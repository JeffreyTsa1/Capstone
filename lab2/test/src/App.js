import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import Home from './components/Home';
import DOMManipulation from './components/DOMManipulation';
import StateManagement from './components/StateManagement';
import EventHandling from './components/EventHandling';

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <div className="nav-container">
            <h1 className="nav-title">React Demo App</h1>
            <ul className="nav-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/dom">DOM Manipulation</Link></li>
              <li><Link to="/state">State Management</Link></li>
              <li><Link to="/events">Event Handling</Link></li>
            </ul>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dom" element={<DOMManipulation />} />
            <Route path="/state" element={<StateManagement />} />
            <Route path="/events" element={<EventHandling />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
