import React, { useState, useEffect, useReducer } from 'react';

// Reducer for complex state management
const todoReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TODO':
      return [
        ...state,
        {
          id: Date.now(),
          text: action.payload,
          completed: false,
          createdAt: new Date().toLocaleString()
        }
      ];
    case 'TOGGLE_TODO':
      return state.map(todo =>
        todo.id === action.payload
          ? { ...todo, completed: !todo.completed }
          : todo
      );
    case 'DELETE_TODO':
      return state.filter(todo => todo.id !== action.payload);
    case 'CLEAR_COMPLETED':
      return state.filter(todo => !todo.completed);
    default:
      return state;
  }
};

const StateManagement = () => {
  // Basic state management with useState
  const [count, setCount] = useState(0);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3498db');
  const [isVisible, setIsVisible] = useState(true);

  // Complex state management with useReducer
  const [todos, dispatch] = useReducer(todoReducer, []);
  const [newTodo, setNewTodo] = useState('');

  // State with useEffect for side effects
  const [time, setTime] = useState(new Date());
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    // Timer effect
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Window resize effect
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Local storage effect
  useEffect(() => {
    const savedTodos = localStorage.getItem('todos');
    if (savedTodos) {
      try {
        const parsedTodos = JSON.parse(savedTodos);
        parsedTodos.forEach(todo => {
          dispatch({ type: 'ADD_TODO', payload: todo.text });
        });
      } catch (error) {
        console.error('Error parsing saved todos:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  const increment = () => setCount(count + 1);
  const decrement = () => setCount(count - 1);
  const reset = () => setCount(0);

  const handleAddTodo = (e) => {
    e.preventDefault();
    if (newTodo.trim()) {
      dispatch({ type: 'ADD_TODO', payload: newTodo.trim() });
      setNewTodo('');
    }
  };

  const completedCount = todos.filter(todo => todo.completed).length;
  const pendingCount = todos.length - completedCount;

  return (
    <div className="page-container">
      <h1>State Management in React</h1>
      
      <div className="demo-section">
        <h2>Basic State with useState</h2>
        <div className="counter-demo">
          <h3>Counter: {count}</h3>
          <div className="demo-controls">
            <button onClick={decrement}>-</button>
            <button onClick={increment}>+</button>
            <button onClick={reset}>Reset</button>
          </div>
        </div>

        <div className="input-demo">
          <h3>Dynamic Input</h3>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
          />
          <p>Hello, {name || 'Anonymous'}!</p>
        </div>

        <div className="color-demo">
          <h3>Color Picker</h3>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
          <div
            className="color-display"
            style={{
              backgroundColor: color,
              width: '100px',
              height: '100px',
              border: '2px solid #333',
              borderRadius: '8px',
              margin: '10px auto'
            }}
          />
          <p>Selected color: {color}</p>
        </div>

        <div className="visibility-demo">
          <h3>Toggle Visibility</h3>
          <button onClick={() => setIsVisible(!isVisible)}>
            {isVisible ? 'Hide' : 'Show'} Content
          </button>
          {isVisible && (
            <div className="toggle-content">
              <p>This content can be toggled on and off!</p>
            </div>
          )}
        </div>
      </div>

      <div className="demo-section">
        <h2>Complex State with useReducer</h2>
        <div className="todo-demo">
          <h3>Todo List</h3>
          <form onSubmit={handleAddTodo}>
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="Enter a new todo"
            />
            <button type="submit">Add Todo</button>
          </form>

          <div className="todo-stats">
            <p>Total: {todos.length} | Completed: {completedCount} | Pending: {pendingCount}</p>
            <button onClick={() => dispatch({ type: 'CLEAR_COMPLETED' })}>
              Clear Completed
            </button>
          </div>

          <ul className="todo-list">
            {todos.map(todo => (
              <li key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
                <span onClick={() => dispatch({ type: 'TOGGLE_TODO', payload: todo.id })}>
                  {todo.text}
                </span>
                <small className="todo-date">{todo.createdAt}</small>
                <button onClick={() => dispatch({ type: 'DELETE_TODO', payload: todo.id })}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="demo-section">
        <h2>useEffect for Side Effects</h2>
        <div className="effect-demo">
          <h3>Live Clock</h3>
          <p className="clock">{time.toLocaleTimeString()}</p>
          
          <h3>Window Width</h3>
          <p>Current window width: {windowWidth}px</p>
          <p><em>Try resizing your browser window!</em></p>
        </div>
      </div>
    </div>
  );
};

export default StateManagement;
