import { readFileSync, existsSync, lstatSync, readdirSync } from 'node:fs'
import { config } from '#/config.js'
import { uploadBlob } from '#/storage/s3-interactions.js'
import { createApiHeadersForConfigBroker } from '#/common/helpers/broker/broker-auth-helper.js'

export const storeConfigVersionAndInformBroker = async (logger) => {
  // TODO BH add to README, make clear versioned together
  const configsDirectory = 'configurations'
  if (!folderExists(configsDirectory)) {
    logger.warn(`Config folder '${configsDirectory}' not found, so performing the file upload`)
    return
  }

  const configs = getConfigsAtNewVersion(configsDirectory)

  const newConfigVersion = !(await configVersionExists(configs, logger))
  if (newConfigVersion) {
    await storeConfigAtNewVersion(configs, logger)
  }

  await notifyConfigBrokerNewVersionAvailable(configs, logger)
}

const folderExists = (configsDirectory) => existsSync(configsDirectory) && lstatSync(configsDirectory).isDirectory()

const getConfigsAtNewVersion = (configsDirectory) => {
  const version = config.get('serviceVersion')

  const configDirs = readdirSync(configsDirectory, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)

  return configDirs.map((config) => {
    const files = readdirSync(`${configsDirectory}/${config}`, { withFileTypes: true, recursive: true })
      .filter((dirent) => dirent.isFile())
      .map((dirent) => {
        const configPath = `${configsDirectory}/${config}`

        const direntWithoutConfigPath = dirent.parentPath
          ? `${dirent.parentPath.replace(configPath, '')}/${dirent.name}`
          : `${dirent.name}`

        const localPath = `${configPath}${direntWithoutConfigPath}`
        const s3Key = `${config}/${version}${direntWithoutConfigPath}`
        return [localPath, s3Key]
      })

    return { grant: config, version, files }
  })
}

const configVersionExists = async (configs, logger) => {
  // logger.info('config version already exists')
  // Check if any configs have: $config/x.x.x/metadata.json
  return false
}

const storeConfigAtNewVersion = async (configs, logger) => {
  const allConfigFiles = configs.map((config) => config.files).flat()

  for (const [localPath, s3Key] of allConfigFiles) {
    logger.info(`Uploading ${s3Key} to S3`)
    await uploadBlob(logger, s3Key, readFileSync(localPath, 'utf8'))
  }

  logger.info(`successfully uploaded '${allConfigFiles.length}' files across '${configs.length}' configs`)
}

const notifyConfigBrokerNewVersionAvailable = async (configs, logger) => {
  const configBrokerEndpoint = config.get('configBroker.apiEndpoint')
  for (const c of configs) {
    await callReleaseConfigEndpoint(configBrokerEndpoint, c, logger)
  }
}

const callReleaseConfigEndpoint = async (configBrokerEndpoint, { grant, version, files }, logger) => {
  if (!configBrokerEndpoint?.length) {
    logger.warn(`Config broker endpoint not set, so skipping release config call`)
    return
  }

  const serviceName = config.get('serviceName')
  const s3Keys = files.map(([_, s3Key]) => s3Key)

  // TODO BH hardcode status for now
  const payload = {
    grant,
    repository: serviceName,
    version,
    files: s3Keys,
    status: 'draft'
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
      logger.error(`Call to release config failed with status '${response.status}' and text '${response.statusText}'`)
    } else {
      logger.info(`successfully notified the config broker about '${grant}' at version ${version}`)
    }
    return response.json()
  } catch (err) {
    logger.error('Call to release config failed', err)
  }
}
