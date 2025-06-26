/* eslint-env jest */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

describe('To-Do List App', () => {
  beforeEach(() => {
    localStorage.clear();
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
    // Use getByText to find the checkbox span and click it
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
});
