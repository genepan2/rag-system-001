import { render, screen, fireEvent } from '@testing-library/react'
import Home from '../app/page'

describe('Home Page - UI Shell', () => {
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
})