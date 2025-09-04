import { render, screen } from '@testing-library/react'
import Home from '../app/page'

describe('Home Page', () => {
  it('renders hello world heading', () => {
    render(<Home />)
    
    const heading = screen.getByRole('heading', { name: /hello world/i })
    expect(heading).toBeInTheDocument()
  })

  it('displays welcome message', () => {
    render(<Home />)
    
    const welcomeText = screen.getByText(/welcome to the rag system/i)
    expect(welcomeText).toBeInTheDocument()
  })

  it('shows system ready indicator', () => {
    render(<Home />)
    
    const readyIndicator = screen.getByText(/system ready/i)
    expect(readyIndicator).toBeInTheDocument()
  })
})