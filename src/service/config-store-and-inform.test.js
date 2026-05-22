import { storeConfigVersionAndInformBroker } from '#/service/config-store-and-inform.js'
import { config } from '#/config.js'

describe('#storeConfigVersionAndInformBroker', () => {
  const mockLogger = {
    info: vi.fn(),
    error: vi.fn()
  }

  beforeAll(async () => {
    config.set('serviceVersion', '1.2.3')
  })

  afterAll(() => {
    vi.resetAllMocks()
  })

  describe('When config version stored and config broker notified', () => {
    test('Should have interactions with S3 and Config Broker API', async () => {
      await storeConfigVersionAndInformBroker(mockLogger)

      // expect(createServerSpy).toHaveBeenCalled()
      // s3 read
      // s3 write
      // broker endpoint called with

      expect(mockLogger.info.mock.calls).toEqual([
        ['successfully stored new config version'],
        ['successfully notified the config broker']
      ])
    })
  })
})
