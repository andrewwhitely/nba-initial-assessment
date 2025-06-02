import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App Component', () => {
  it('renders the initial heading', () => {
    render(<App />);
    expect(screen.getByText('NBA Draft Statistics')).toBeInTheDocument();
  });

  it('renders team select dropdown', () => {
    render(<App />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('Select a team')).toBeInTheDocument();
  });

  it('renders disabled button when no team selected', () => {
    render(<App />);
    const button = screen.getByRole('button', { name: /get draft stats/i });
    expect(button).toBeDisabled();
  });
});
