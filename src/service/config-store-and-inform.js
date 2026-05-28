import { readFileSync, existsSync, lstatSync, readdirSync } from 'node:fs'
import { config } from '#/config.js'
import { listFiles, uploadBlob } from '#/storage/s3-interactions.js'
import { createApiHeadersForConfigBroker } from '#/common/helpers/broker/broker-auth-helper.js'

const configsDirectory = 'configurations'

export const storeConfigVersionAndInformBroker = async (logger) => {
  if (!configsDirectoryExists(configsDirectory, logger)) {
    return // exit early, configurations directory not found
  }

  const configsAtServiceVersion = constructConfigsAtServiceVersion(configsDirectory)

  if (await configAlreadyPublished(configsAtServiceVersion, logger)) {
    return // exit early, broker already published config
  }

  await storeConfigAtServiceVersion(configsAtServiceVersion, logger)

  await notifyConfigBrokerServiceVersionAvailable(configsAtServiceVersion, logger)
}

const configsDirectoryExists = (configsDirectory, logger) => {
  const configsDirectoryExists = existsSync(configsDirectory) && lstatSync(configsDirectory).isDirectory()

  if (!configsDirectoryExists) {
    logger.warn(`config folder '${configsDirectory}' not found, so performing the file upload`)
  }

  return configsDirectoryExists
}

const constructConfigsAtServiceVersion = (configsDirectory) => {
  const version = config.get('serviceVersion')

  // all top-level directories are considered separate grant configurations
  const configDirs = readdirSync(configsDirectory, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)

  // iterate each grant configuration, collecting: grant, version and files
  return configDirs.map((config) => {
    const files = readdirSync(`${configsDirectory}/${config}`, { withFileTypes: true, recursive: true })
      .filter((dirent) => dirent.isFile())
      .map((dirent) => {
        const configPath = `${configsDirectory}/${config}`

        const direntWithoutConfigPath = dirent.parentPath
          ? `${dirent.parentPath.replace(configPath, '')}/${dirent.name}`
          : `${dirent.name}`

        const localPath = `${configPath}${direntWithoutConfigPath}`
        const s3Path = `${config}/${version}${direntWithoutConfigPath}`
        return [localPath, s3Path]
      })

    return { grant: config, version, files }
  })
}

const configAlreadyPublished = async (configsAtServiceVersion, logger) => {
  for (const { grant, version } of configsAtServiceVersion) {
    const files = await listFiles(logger, `${grant}/${version}/metadata.json`)
    if (files.length > 0) {
      logger.warn(`grant config '${grant}' at version '${version}' already published, not safe to store`)
      return true
    }
  }
  return false
}

const storeConfigAtServiceVersion = async (configsAtServiceVersion, logger) => {
  // upload all files across all grant configurations at once
  const allConfigFiles = configsAtServiceVersion.map((config) => config.files).flat()
  for (const [localPath, s3Path] of allConfigFiles) {
    logger.info(`uploading '${s3Path}' to S3`)
    await uploadBlob(logger, s3Path, readFileSync(localPath, 'utf8'))
  }

  logger.info(
    `successfully uploaded '${allConfigFiles.length}' files across '${configsAtServiceVersion.length}' configs`
  )
}

const notifyConfigBrokerServiceVersionAvailable = async (configsAtServiceVersion, logger) => {
  const configBrokerEndpoint = config.get('configBroker.apiEndpoint')

  // iterate each grant configuration, notify config available at current service version
  for (const configAtServiceVersion of configsAtServiceVersion) {
    await callReleaseConfigEndpoint(configBrokerEndpoint, configAtServiceVersion, logger)
  }
}

const callReleaseConfigEndpoint = async (configBrokerEndpoint, configAtServiceVersion, logger) => {
  if (!configBrokerEndpoint?.length) {
    logger.warn(`config broker endpoint not set, so skipping release config call`)
    return
  }

  const { grant, version, files } = configAtServiceVersion
  // files is and array of tuples, we only want the S3 paths here
  const s3Paths = files.map(([_, s3Path]) => s3Path)

  const payload = {
    grant,
    version,
    files: s3Paths,
    status: 'draft' // hardcode status for now
  }

  const url = new URL(`/api/release-config`, configBrokerEndpoint)
  try {
    const response = await fetch(url.href, {
      method: 'POST',
      headers: {
        ...createApiHeadersForConfigBroker(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      logger.error(`call to release config failed with status '${response.status}' and text '${response.statusText}'`)
    } else {
      logger.info(`successfully notified the config broker about '${grant}' at version '${version}'`)
    }
  } catch (err) {
    logger.error('call to release config failed', err)
  }
}
