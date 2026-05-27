import process from 'node:process'

const mockInfo = vi.fn()
const mockError = vi.fn()

vi.mock('#/common/helpers/logging/logger.js', () => ({
  createLogger: () => ({
    info: mockInfo,
    error: mockError
  })
}))

vi.mock('#/common/helpers/start-server.js', () => ({
  startServer: vi.fn()
}))

describe('unhandledRejection handler', () => {
  const originalListeners = process.listeners('unhandledRejection')

  beforeEach(async () => {
    vi.resetModules()

    mockInfo.mockClear()
    mockError.mockClear()

    await import('./index.js')
  })

  afterEach(() => {
    process.removeAllListeners('unhandledRejection')

    for (const listener of originalListeners) {
      process.on('unhandledRejection', listener)
    }

    process.exitCode = undefined
  })

  it('logs and sets exitCode on unhandled rejection', () => {
    const error = new Error('Test rejection')

    process.emit('unhandledRejection', error, Promise.resolve())

    expect(mockInfo).toHaveBeenCalledWith('Unhandled rejection')
    expect(mockError).toHaveBeenCalledWith(error)
    expect(process.exitCode).toBe(1)
  })
})
