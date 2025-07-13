import React from 'react';
import './TodoFilter.css';

const TodoFilter = ({ currentFilter, onFilterChange, todoCount, completedCount, onClearCompleted }) => {
  const activeCount = todoCount - completedCount;

  return (
    <div className="todo-filter">
      <div className="todo-stats">
        <span className="todo-count">
          {activeCount} {activeCount === 1 ? 'item' : 'items'} left
        </span>
      </div>
      
      <div className="filter-buttons">
        <button
          className={`filter-btn ${currentFilter === 'all' ? 'active' : ''}`}
          onClick={() => onFilterChange('all')}
        >
          All
        </button>
        <button
          className={`filter-btn ${currentFilter === 'active' ? 'active' : ''}`}
          onClick={() => onFilterChange('active')}
        >
          Active
        </button>
        <button
          className={`filter-btn ${currentFilter === 'completed' ? 'active' : ''}`}
          onClick={() => onFilterChange('completed')}
        >
          Completed
        </button>
      </div>
      
      {completedCount > 0 && (
        <button
          className="btn btn-clear"
          onClick={onClearCompleted}
        >
          Clear completed ({completedCount})
        </button>
      )}
    </div>
  );
};

export default TodoFilter;
