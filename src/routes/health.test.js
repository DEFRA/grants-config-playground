import { health } from './health.js'

describe('health route', () => {
  it('should return success response', () => {
    const response = vi.fn().mockReturnValue({
      message: 'success'
    })
    const h = { response }

    const result = health.handler({}, h)

    expect(health.method).toBe('GET')
    expect(health.path).toBe('/health')
    expect(response).toHaveBeenCalledWith({ message: 'success' })
    expect(result).toEqual({ message: 'success' })
  })
})
