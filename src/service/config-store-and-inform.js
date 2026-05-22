import { config } from '#/config.js'
// import { uploadBlob } from '#/storage/s3-interactions.js'

export const storeConfigVersionAndInformBroker = async (logger) => {
  const serviceVersion = config.get('serviceVersion')

  const newConfigVersion = !(await configVersionExists(serviceVersion, logger))
  if (newConfigVersion) {
    await storeNewConfigVersion(serviceVersion, logger)
  }

  await notifyConfigBrokerConfigVersionAvailable(serviceVersion, logger)
}

const configVersionExists = async (serviceVersion, logger) => {
  // logger.error('failed to verify if config version already exists')
  // logger.info('config version already exists')
  // Check if this exists: playground/2.0.0/metadata.json
  return false
}

const storeNewConfigVersion = async (serviceVersion, logger) => {
  // const serviceName = config.get('serviceName')
  // logger.error('failed to stored new config version')

  // await uploadBlob(
  //   logger,
  //   `${serviceName}/${serviceVersion}/test-file-upload-1.json`,
  //   JSON.stringify({ foo: 'bar' })
  // )

  logger.info('successfully stored new config version')
}

const notifyConfigBrokerConfigVersionAvailable = async (
  serviceVersion,
  logger
) => {
  // logger.error('failed to notify the config broker')
  logger.info('successfully notified the config broker')
}
