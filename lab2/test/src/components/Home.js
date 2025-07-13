import React from 'react';

const Home = () => {
  return (
    <div className="page-container">
      <h1>Welcome to the React Demo App</h1>
      <p>This React Demo Application demonstrates various React concepts and examples utilizing those concepts:</p>
      <ul className="feature-list">
        <li><strong>DOM Manipulation:</strong> Direct DOM manipulation using refs and vanilla JavaScript</li>
        <li><strong>State Management:</strong> Managing component state with useState and useEffect hooks</li>
        <li><strong>Event Handling:</strong> Handling user interactions and form submissions</li>
        <li><strong>SPA Routing:</strong> Single Page Application navigation with React Router</li>
      </ul>
      <p>Navigate through the different sections using the navigation menu above!</p>
    </div>
  );
};

export default Home;
