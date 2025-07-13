import React from 'react';
import './ErrorMessage.css';

const ErrorMessage = ({ error, onRetry }) => {
  if (!error) return null;

  return (
    <div className="error-message">
      <div className="error-content">
        <span className="error-icon">⚠️</span>
        <div className="error-text">
          <strong>Something went wrong</strong>
          <p>{error}</p>
        </div>
        {onRetry && (
          <button onClick={onRetry} className="btn btn-retry">
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
