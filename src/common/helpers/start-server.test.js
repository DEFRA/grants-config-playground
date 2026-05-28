import hapi from '@hapi/hapi'

describe('#startServer', () => {
  let startServerImport
  let createServerSpy
  let hapiServerSpy
  let configStoreInformImportSpy

  beforeAll(async () => {
    vi.stubEnv('PORT', '3098')
    startServerImport = await import('./start-server.js')
    const createServerImport = await import('#/server.js')
    const configStoreInformImport = await import('@defra/grants-config-utils')

    createServerSpy = vi.spyOn(createServerImport, 'createServer')
    hapiServerSpy = vi.spyOn(hapi, 'server')
    configStoreInformImportSpy = vi
      .spyOn(configStoreInformImport, 'storeConfigVersionAndInformBroker')
      .mockImplementation(async () => {})
  })

  afterAll(() => {
    vi.resetAllMocks()
  })

  describe('When server starts', () => {
    test('Should start up server as expected', async () => {
      await startServerImport.startServer()

      expect(createServerSpy).toHaveBeenCalled()
      expect(hapiServerSpy).toHaveBeenCalled()
      expect(configStoreInformImportSpy).toHaveBeenCalled()
    })
  })

  describe('When server start fails', () => {
    test('Should log failed startup message', async () => {
      createServerSpy.mockRejectedValue(new Error('Server failed to start'))

      await expect(startServerImport.startServer()).rejects.toThrow('Server failed to start')
    })
  })
})
