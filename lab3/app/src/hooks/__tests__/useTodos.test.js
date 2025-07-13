import { renderHook, act } from '@testing-library/react';
import { useTodos } from '../hooks/useTodos';
import { todoAPI } from '../services/todoService';

// Mock the todoService
jest.mock('../services/todoService');

describe('useTodos hook', () => {
  const mockTodos = [
    { id: 1, title: 'Todo 1', completed: false, userId: 1 },
    { id: 2, title: 'Todo 2', completed: true, userId: 1 },
    { id: 3, title: 'Todo 3', completed: false, userId: 1 }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    todoAPI.getTodos.mockResolvedValue(mockTodos);
    todoAPI.createTodo.mockResolvedValue({ id: 4, title: 'New Todo', completed: false, userId: 1 });
    todoAPI.updateTodo.mockResolvedValue({ id: 1, title: 'Updated Todo', completed: true, userId: 1 });
    todoAPI.deleteTodo.mockResolvedValue(true);
  });

  test('fetches todos on mount', async () => {
    const { result } = renderHook(() => useTodos());

    expect(result.current.loading).toBe(true);
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(todoAPI.getTodos).toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.todos).toEqual(mockTodos);
  });

  test('adds a new todo', async () => {
    const { result } = renderHook(() => useTodos());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.addTodo('New Todo');
    });

    expect(todoAPI.createTodo).toHaveBeenCalledWith({
      title: 'New Todo',
      completed: false,
      userId: 1
    });
    expect(result.current.todos).toHaveLength(4);
  });

  test('toggles todo completion', async () => {
    const { result } = renderHook(() => useTodos());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.toggleTodo(1);
    });

    expect(todoAPI.updateTodo).toHaveBeenCalledWith(1, {
      id: 1,
      title: 'Todo 1',
      completed: true,
      userId: 1
    });
  });

  test('deletes a todo', async () => {
    const { result } = renderHook(() => useTodos());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.deleteTodo(1);
    });

    expect(todoAPI.deleteTodo).toHaveBeenCalledWith(1);
    expect(result.current.todos).toHaveLength(2);
    expect(result.current.todos.find(t => t.id === 1)).toBeUndefined();
  });

  test('edits todo text', async () => {
    const { result } = renderHook(() => useTodos());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.editTodo(1, 'Edited Todo');
    });

    expect(todoAPI.updateTodo).toHaveBeenCalledWith(1, {
      id: 1,
      title: 'Edited Todo',
      completed: false,
      userId: 1
    });
  });

  test('filters todos correctly', async () => {
    const { result } = renderHook(() => useTodos());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const activeTodos = result.current.getFilteredTodos('active');
    const completedTodos = result.current.getFilteredTodos('completed');
    const allTodos = result.current.getFilteredTodos('all');

    expect(activeTodos).toHaveLength(2);
    expect(completedTodos).toHaveLength(1);
    expect(allTodos).toHaveLength(3);
  });

  test('clears completed todos', async () => {
    const { result } = renderHook(() => useTodos());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    act(() => {
      result.current.clearCompleted();
    });

    expect(result.current.todos).toHaveLength(2);
    expect(result.current.todos.every(todo => !todo.completed)).toBe(true);
  });

  test('handles API errors', async () => {
    todoAPI.getTodos.mockRejectedValue(new Error('API Error'));
    
    const { result } = renderHook(() => useTodos());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.error).toBe('API Error');
    expect(result.current.loading).toBe(false);
  });
});
