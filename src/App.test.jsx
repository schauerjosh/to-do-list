/* eslint-env jest */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

// Mock fetch for EmailJS
beforeAll(() => {
  global.fetch = jest.fn(() => Promise.resolve({ ok: true }));
});
afterAll(() => {
  global.fetch.mockRestore();
});

describe('To-Do List App', () => {
  beforeEach(() => {
    localStorage.clear();
    fetch.mockClear();
  });

  it('renders title and add button', () => {
    render(<App />);
    expect(screen.getByText(/TO-DO LIST/i)).toBeInTheDocument();
    expect(screen.getByText(/\+ ADD TASK/i)).toBeInTheDocument();
  });

  it('adds a new task', () => {
    render(<App />);
    fireEvent.change(screen.getByPlaceholderText(/add a task/i), { target: { value: 'Test Task' } });
    fireEvent.click(screen.getByText(/\+ ADD TASK/i));
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('marks a task as completed', () => {
    render(<App />);
    fireEvent.change(screen.getByPlaceholderText(/add a task/i), { target: { value: 'Complete Me' } });
    fireEvent.click(screen.getByText(/\+ ADD TASK/i));
    const checkbox = screen.getByText('Complete Me').parentElement.querySelector('.checkbox');
    fireEvent.click(checkbox);
    expect(screen.getByText('Complete Me').parentElement).toHaveClass('completed');
  });

  it('removes a task', () => {
    render(<App />);
    fireEvent.change(screen.getByPlaceholderText(/add a task/i), { target: { value: 'Remove Me' } });
    fireEvent.click(screen.getByText(/\+ ADD TASK/i));
    fireEvent.click(screen.getByTitle('Remove'));
    expect(screen.queryByText('Remove Me')).not.toBeInTheDocument();
  });

  it('emails the list', async () => {
    render(<App />);
    fireEvent.change(screen.getByPlaceholderText(/add a task/i), { target: { value: 'Email Task' } });
    fireEvent.click(screen.getByText(/\+ ADD TASK/i));
    fireEvent.change(screen.getByPlaceholderText(/your email address/i), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByText(/email me my list/i));
    // Wait for either 'Sending...' or 'Sent!' to appear, then for 'Sent!' to appear
    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /sending|sent!/i });
      expect(btn).toBeInTheDocument();
    });
    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /sent!/i });
      expect(btn).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('does not add empty or whitespace-only tasks', () => {
    render(<App />);
    fireEvent.change(screen.getByPlaceholderText(/add a task/i), { target: { value: '   ' } });
    fireEvent.click(screen.getByText(/\+ ADD TASK/i));
    expect(screen.queryByText('   ')).not.toBeInTheDocument();
  });

  it('handles emailing with no tasks gracefully', async () => {
    render(<App />);
    fireEvent.change(screen.getByPlaceholderText(/your email address/i), { target: { value: 'test@example.com' } });
    const btn = screen.getByText(/email me my list/i);
    expect(btn).toBeDisabled();
  });

  it('handles very long task text', () => {
    render(<App />);
    const longText = 'A'.repeat(1000);
    fireEvent.change(screen.getByPlaceholderText(/add a task/i), { target: { value: longText } });
    fireEvent.click(screen.getByText(/\+ ADD TASK/i));
    expect(screen.getByText(longText)).toBeInTheDocument();
  });
});
