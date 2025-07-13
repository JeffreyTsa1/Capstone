import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

// Mock the API service
jest.mock('./services/todoService', () => ({
  todoAPI: {
    getTodos: jest.fn(() => Promise.resolve([
      { id: 1, title: 'Test todo', completed: false, userId: 1 }
    ])),
    createTodo: jest.fn((todo) => Promise.resolve({ id: Date.now(), ...todo })),
    updateTodo: jest.fn((id, todo) => Promise.resolve(todo)),
    deleteTodo: jest.fn(() => Promise.resolve())
  }
}));

test('renders todo app', async () => {
  render(<App />);
  
  expect(screen.getByText('📝 Todo App')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('What needs to be done?')).toBeInTheDocument();
  
  // Wait for todos to load
  await waitFor(() => {
    expect(screen.getByText('Test todo')).toBeInTheDocument();
  });
});

test('adds a new todo', async () => {
  render(<App />);
  
  const input = screen.getByPlaceholderText('What needs to be done?');
  const addButton = screen.getByText('Add');
  
  fireEvent.change(input, { target: { value: 'New todo' } });
  fireEvent.click(addButton);
  
  await waitFor(() => {
    expect(screen.getByText('New todo')).toBeInTheDocument();
  });
});
