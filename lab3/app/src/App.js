import React, { useState, useEffect } from 'react';
import './App.css';
import { todoAPI } from './services/todoService';

function App() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch todos on component mount
  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await todoAPI.getTodos();
      // Limit to first 10 for demo
      setTodos(data.slice(0, 10));
    } catch (err) {
      setError('Failed to fetch todos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async (e) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    try {
      const todoData = {
        title: newTodo.trim(),
        completed: false,
        userId: 1
      };
      
      const createdTodo = await todoAPI.createTodo(todoData);
      // Since JSONPlaceholder doesn't persist, add locally with unique ID
      setTodos([{ ...createdTodo, id: Date.now(), title: newTodo.trim() }, ...todos]);
      setNewTodo('');
    } catch (err) {
      setError('Failed to add todo');
      console.error(err);
    }
  };

  const toggleTodo = async (id) => {
    try {
      const todo = todos.find(t => t.id === id);
      if (!todo) return;

      const updatedTodo = { ...todo, completed: !todo.completed };
      await todoAPI.updateTodo(id, updatedTodo);
      
      setTodos(todos.map(t => t.id === id ? updatedTodo : t));
    } catch (err) {
      setError('Failed to update todo');
      console.error(err);
    }
  };

  const deleteTodo = async (id) => {
    try {
      await todoAPI.deleteTodo(id);
      setTodos(todos.filter(t => t.id !== id));
    } catch (err) {
      setError('Failed to delete todo');
      console.error(err);
    }
  };

  return (
    <div className="App">
      <div className="todo-app">
        <h1>📝 Todo App</h1>
        <p>Using JSONPlaceholder API</p>

        {error && (
          <div className="error">
            {error} <button onClick={fetchTodos}>Retry</button>
          </div>
        )}

        <form onSubmit={addTodo} className="add-form">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="What needs to be done?"
            className="todo-input"
          />
          <button type="submit" disabled={!newTodo.trim()}>
            Add
          </button>
        </form>

        {loading ? (
          <div className="loading">Loading todos...</div>
        ) : (
          <div className="todo-list">
            {todos.map(todo => (
              <div key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id)}
                />
                <span className="todo-text">{todo.title}</span>
                <button onClick={() => deleteTodo(todo.id)} className="delete-btn">
                  ×
                </button>
              </div>
            ))}
            {todos.length === 0 && !loading && (
              <div className="empty">No todos yet. Add one above!</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
