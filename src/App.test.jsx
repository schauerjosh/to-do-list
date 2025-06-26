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
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(screen.getByText(/sent!/i)).toBeInTheDocument();
  });
});
