import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TodoItem from '../components/TodoItem';

describe('TodoItem', () => {
  const mockTodo = {
    id: 1,
    title: 'Test todo',
    completed: false
  };

  const mockProps = {
    todo: mockTodo,
    onToggle: jest.fn(),
    onDelete: jest.fn(),
    onEdit: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders todo item with correct content', () => {
    render(<TodoItem {...mockProps} />);
    
    expect(screen.getByText('Test todo')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
    expect(screen.getByTitle('Edit')).toBeInTheDocument();
    expect(screen.getByTitle('Delete')).toBeInTheDocument();
  });

  test('calls onToggle when checkbox is clicked', async () => {
    const user = userEvent.setup();
    render(<TodoItem {...mockProps} />);
    
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);
    
    expect(mockProps.onToggle).toHaveBeenCalledWith(1);
  });

  test('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(<TodoItem {...mockProps} />);
    
    const deleteButton = screen.getByTitle('Delete');
    await user.click(deleteButton);
    
    expect(mockProps.onDelete).toHaveBeenCalledWith(1);
  });

  test('enters edit mode when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(<TodoItem {...mockProps} />);
    
    const editButton = screen.getByTitle('Edit');
    await user.click(editButton);
    
    expect(screen.getByDisplayValue('Test todo')).toBeInTheDocument();
    expect(screen.getByTitle('Save')).toBeInTheDocument();
  });

  test('enters edit mode when text is double clicked', async () => {
    const user = userEvent.setup();
    render(<TodoItem {...mockProps} />);
    
    const todoText = screen.getByText('Test todo');
    await user.dblClick(todoText);
    
    expect(screen.getByDisplayValue('Test todo')).toBeInTheDocument();
  });

  test('calls onEdit when saving edited text', async () => {
    const user = userEvent.setup();
    render(<TodoItem {...mockProps} />);
    
    // Enter edit mode
    const editButton = screen.getByTitle('Edit');
    await user.click(editButton);
    
    // Edit the text
    const input = screen.getByDisplayValue('Test todo');
    await user.clear(input);
    await user.type(input, 'Edited todo');
    
    // Save
    const saveButton = screen.getByTitle('Save');
    await user.click(saveButton);
    
    expect(mockProps.onEdit).toHaveBeenCalledWith(1, 'Edited todo');
  });

  test('cancels edit on Escape key', async () => {
    const user = userEvent.setup();
    render(<TodoItem {...mockProps} />);
    
    // Enter edit mode
    const editButton = screen.getByTitle('Edit');
    await user.click(editButton);
    
    // Edit the text
    const input = screen.getByDisplayValue('Test todo');
    await user.clear(input);
    await user.type(input, 'Edited todo');
    
    // Press Escape
    await user.keyboard('{Escape}');
    
    // Should show original text and not call onEdit
    expect(screen.getByText('Test todo')).toBeInTheDocument();
    expect(mockProps.onEdit).not.toHaveBeenCalled();
  });

  test('saves edit on Enter key', async () => {
    const user = userEvent.setup();
    render(<TodoItem {...mockProps} />);
    
    // Enter edit mode
    const editButton = screen.getByTitle('Edit');
    await user.click(editButton);
    
    // Edit the text and press Enter
    const input = screen.getByDisplayValue('Test todo');
    await user.clear(input);
    await user.type(input, 'Edited todo{Enter}');
    
    expect(mockProps.onEdit).toHaveBeenCalledWith(1, 'Edited todo');
  });

  test('displays completed todo with correct styling', () => {
    const completedTodo = { ...mockTodo, completed: true };
    render(<TodoItem {...mockProps} todo={completedTodo} />);
    
    const todoItem = screen.getByText('Test todo').closest('.todo-item');
    expect(todoItem).toHaveClass('completed');
    expect(screen.getByRole('checkbox')).toBeChecked();
  });
});
