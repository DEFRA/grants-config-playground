import { config } from '#/config.js'
import { createServer } from '#/server.js'
import { storePublishedConfigAndInformBroker } from '#/service/config-store-and-inform.js'

export async function startServer() {
  const server = await createServer()
  await server.start()

  server.logger.info('Server started successfully')
  server.logger.info(
    `Access your backend on http://localhost:${config.get('port')}`
  )

  await storePublishedConfigAndInformBroker(server.logger.child({}))

  return server
}
