import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Home from '../app/page'

// Mock fetch for health check tests
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('Home Page - UI Shell', () => {
  beforeEach(() => {
    mockFetch.mockClear()
    jest.spyOn(console, 'log').mockImplementation()
    jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('renders query interface heading', () => {
    render(<Home />)
    
    const heading = screen.getByRole('heading', { name: /rag system query interface/i })
    expect(heading).toBeInTheDocument()
  })

  it('renders large text input field correctly', () => {
    render(<Home />)
    
    const textInput = screen.getByRole('textbox', { name: /your query/i })
    expect(textInput).toBeInTheDocument()
    expect(textInput.tagName.toLowerCase()).toBe('textarea')
    expect(textInput).toHaveAttribute('placeholder', 'Enter your question or query here...')
  })

  it('renders submit button', () => {
    render(<Home />)
    
    const submitButton = screen.getByRole('button', { name: /submit/i })
    expect(submitButton).toBeInTheDocument()
    expect(submitButton).toHaveAttribute('type', 'submit')
  })

  it('renders results display area', () => {
    render(<Home />)
    
    const resultsHeading = screen.getByRole('heading', { name: /results/i })
    const resultsPlaceholder = screen.getByText(/query results will appear here/i)
    
    expect(resultsHeading).toBeInTheDocument()
    expect(resultsPlaceholder).toBeInTheDocument()
  })

  it('handles text input changes', () => {
    render(<Home />)
    
    const textInput = screen.getByRole('textbox', { name: /your query/i }) as HTMLTextAreaElement
    fireEvent.change(textInput, { target: { value: 'Test query input' } })
    
    expect(textInput.value).toBe('Test query input')
  })

  it('handles form submission', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
    render(<Home />)
    
    const textInput = screen.getByRole('textbox', { name: /your query/i })
    const submitButton = screen.getByRole('button', { name: /submit/i })
    
    fireEvent.change(textInput, { target: { value: 'Test submission' } })
    fireEvent.click(submitButton)
    
    expect(consoleSpy).toHaveBeenCalledWith('Query submitted:', 'Test submission')
    
    consoleSpy.mockRestore()
  })

  it('has responsive layout classes', () => {
    render(<Home />)
    
    const formContainer = screen.getByRole('textbox', { name: /your query/i }).closest('form')
    const flexContainer = formContainer?.querySelector('[class*="flex"]')
    
    expect(flexContainer).toHaveClass('flex', 'flex-col', 'md:flex-row')
  })

  describe('Health Check Integration', () => {
    it('calls health endpoint on page load', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok' })
      })

      render(<Home />)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/health')
      })
    })

    it('logs success message when health check passes', async () => {
      const consoleSpy = jest.spyOn(console, 'log')
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok' })
      })

      render(<Home />)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('✅ Backend connectivity verified:', { status: 'ok' })
      })
    })

    it('logs error when health check fails with non-200 status', async () => {
      const consoleSpy = jest.spyOn(console, 'error')
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      })

      render(<Home />)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('❌ Health check failed with status:', 500)
      })
    })

    it('logs error when health check fails with network error', async () => {
      const consoleSpy = jest.spyOn(console, 'error')
      const networkError = new Error('Network error')
      mockFetch.mockRejectedValueOnce(networkError)

      render(<Home />)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('❌ Health check failed - network or endpoint error:', networkError)
      })
    })
  })
})