import { useState, useEffect, useCallback } from 'react';
import { todoAPI } from '../services/todoService';

// Custom hook for managing todos with API integration
export const useTodos = () => {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all todos
  const fetchTodos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const todosData = await todoAPI.getTodos();
      // Limit to first 10 todos for demo purposes
      setTodos(todosData.slice(0, 10));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add a new todo
  const addTodo = useCallback(async (todoText) => {
    if (!todoText.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const newTodo = await todoAPI.createTodo({
        title: todoText,
        completed: false,
        userId: 1,
      });
      
      // Since JSONPlaceholder doesn't actually save data,
      // we'll add it locally with a temporary ID
      const localTodo = {
        ...newTodo,
        id: Date.now(), // temporary ID
        title: todoText,
      };
      
      setTodos(prev => [localTodo, ...prev]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update todo completion status
  const toggleTodo = useCallback(async (id) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    setError(null);
    try {
      const updatedTodo = await todoAPI.updateTodo(id, {
        ...todo,
        completed: !todo.completed,
      });

      setTodos(prev =>
        prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
      );
    } catch (err) {
      setError(err.message);
    }
  }, [todos]);

  // Delete a todo
  const deleteTodo = useCallback(async (id) => {
    setError(null);
    try {
      await todoAPI.deleteTodo(id);
      setTodos(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // Edit todo text
  const editTodo = useCallback(async (id, newText) => {
    if (!newText.trim()) return;

    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    setError(null);
    try {
      await todoAPI.updateTodo(id, {
        ...todo,
        title: newText,
      });

      setTodos(prev =>
        prev.map(t => t.id === id ? { ...t, title: newText } : t)
      );
    } catch (err) {
      setError(err.message);
    }
  }, [todos]);

  // Clear completed todos
  const clearCompleted = useCallback(() => {
    setTodos(prev => prev.filter(todo => !todo.completed));
  }, []);

  // Get filtered todos
  const getFilteredTodos = useCallback((filter) => {
    switch (filter) {
      case 'active':
        return todos.filter(todo => !todo.completed);
      case 'completed':
        return todos.filter(todo => todo.completed);
      default:
        return todos;
    }
  }, [todos]);

  // Load todos on mount
  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  return {
    todos,
    loading,
    error,
    addTodo,
    toggleTodo,
    deleteTodo,
    editTodo,
    clearCompleted,
    getFilteredTodos,
    refetch: fetchTodos,
  };
};
