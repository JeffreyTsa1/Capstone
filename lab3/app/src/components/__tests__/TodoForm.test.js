import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TodoForm from '../components/TodoForm';

describe('TodoForm', () => {
  const mockOnAdd = jest.fn();

  beforeEach(() => {
    mockOnAdd.mockClear();
  });

  test('renders input and button', () => {
    render(<TodoForm onAdd={mockOnAdd} loading={false} />);
    
    expect(screen.getByPlaceholderText('What needs to be done?')).toBeInTheDocument();
    expect(screen.getByText('Add Todo')).toBeInTheDocument();
  });

  test('calls onAdd when form is submitted with text', async () => {
    const user = userEvent.setup();
    render(<TodoForm onAdd={mockOnAdd} loading={false} />);
    
    const input = screen.getByPlaceholderText('What needs to be done?');
    const button = screen.getByText('Add Todo');
    
    await user.type(input, 'New todo item');
    await user.click(button);
    
    expect(mockOnAdd).toHaveBeenCalledWith('New todo item');
    expect(input.value).toBe(''); // Input should be cleared
  });

  test('does not call onAdd when form is submitted with empty text', async () => {
    const user = userEvent.setup();
    render(<TodoForm onAdd={mockOnAdd} loading={false} />);
    
    const button = screen.getByText('Add Todo');
    await user.click(button);
    
    expect(mockOnAdd).not.toHaveBeenCalled();
  });

  test('trims whitespace from input', async () => {
    const user = userEvent.setup();
    render(<TodoForm onAdd={mockOnAdd} loading={false} />);
    
    const input = screen.getByPlaceholderText('What needs to be done?');
    const button = screen.getByText('Add Todo');
    
    await user.type(input, '  Trimmed todo  ');
    await user.click(button);
    
    expect(mockOnAdd).toHaveBeenCalledWith('Trimmed todo');
  });

  test('disables input and button when loading', () => {
    render(<TodoForm onAdd={mockOnAdd} loading={true} />);
    
    expect(screen.getByPlaceholderText('What needs to be done?')).toBeDisabled();
    expect(screen.getByText('Adding...')).toBeDisabled();
  });

  test('submits form on Enter key press', async () => {
    const user = userEvent.setup();
    render(<TodoForm onAdd={mockOnAdd} loading={false} />);
    
    const input = screen.getByPlaceholderText('What needs to be done?');
    
    await user.type(input, 'Todo via Enter key');
    await user.keyboard('{Enter}');
    
    expect(mockOnAdd).toHaveBeenCalledWith('Todo via Enter key');
  });
});
