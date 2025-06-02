import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
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

  it('updates heading when team is selected', () => {
    render(<App />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'Boston Celtics' } });
    expect(
      screen.getByText('Boston Celtics Draft Statistics')
    ).toBeInTheDocument();
  });

  it('enables button when team is selected', () => {
    render(<App />);
    const select = screen.getByRole('combobox');
    const button = screen.getByRole('button', { name: /get draft stats/i });

    fireEvent.change(select, { target: { value: 'Boston Celtics' } });
    expect(button).not.toBeDisabled();
  });

  it('shows loading state when fetching data', async () => {
    render(<App />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'Boston Celtics' } });

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
