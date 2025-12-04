/**
 * Header Component Tests
 */

import { render, screen } from '@testing-library/react';
import { Header } from './Header';

describe('Header', () => {
  it('renders the default title', () => {
    render(<Header />);
    expect(screen.getByText('Scorecards')).toBeInTheDocument();
  });

  it('renders a custom title', () => {
    render(<Header title="Custom Title" />);
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('renders the Scorecards logo', () => {
    render(<Header />);
    // The logo is an SVG with class header-logo
    const header = document.querySelector('.header-bar');
    expect(header).toBeInTheDocument();
    const logo = document.querySelector('.header-logo');
    expect(logo).toBeInTheDocument();
  });

  it('renders the header strip', () => {
    render(<Header />);
    const strip = document.querySelector('.header-strip');
    expect(strip).toBeInTheDocument();
  });

  it('has proper semantic structure', () => {
    render(<Header />);
    // Should have a header element
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
  });
});
