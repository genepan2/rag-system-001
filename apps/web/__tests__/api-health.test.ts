/**
 * @jest-environment node
 */
import { GET } from '../app/api/health/route'

describe('/api/health endpoint', () => {
  it('should return 200 status code', async () => {
    const response = await GET()
    expect(response.status).toBe(200)
  })

  it('should return correct JSON response body', async () => {
    const response = await GET()
    const data = await response.json()
    
    expect(data).toEqual({ status: 'ok' })
  })

  it('should have correct content-type header', async () => {
    const response = await GET()
    const contentType = response.headers.get('content-type')
    
    expect(contentType).toContain('application/json')
  })
})