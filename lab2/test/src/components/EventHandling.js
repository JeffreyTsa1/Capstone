import { useState, useRef } from 'react';

const EventHandling = () => {
  const [clickCount, setClickCount] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [keyPressed, setKeyPressed] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    category: 'general',
    subscribe: false
  });
  const [submissions, setSubmissions] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);
  const [droppedItems, setDroppedItems] = useState([]);
  const fileInputRef = useRef(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // Click event handler
  const handleClick = (event) => {
    setClickCount(prev => prev + 1); 
    console.log('Button clicked!', event);
  };

  // Mouse move event handler
  const handleMouseMove = (event) => {
    setMousePosition({
      x: event.clientX,
      y: event.clientY
    });
  };

  // Keyboard event handler
  const handleKeyDown = (event) => {
    setKeyPressed(event.key);
    console.log('Key pressed:', event.key);
  };

  // Form input change handler
  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Form submission handler
  const handleSubmit = (event) => {
    event.preventDefault();
    const submission = {
      ...formData,
      timestamp: new Date().toLocaleString(),
      id: Date.now()
    };
    setSubmissions(prev => [...prev, submission]);
    setFormData({
      name: '',
      email: '',
      message: '',
      category: 'general',
      subscribe: false
    });
    alert('Form submitted successfully!');
  };

  // Double click handler
  const handleDoubleClick = () => {
    alert('Double clicked!');
  };

  // Context menu handler
  const handleContextMenu = (event) => {
    event.preventDefault();
    alert('Right-clicked! Context menu prevented.');
  };

  // Focus and blur handlers
  const handleFocus = (event) => {
    event.target.style.borderColor = '#4CAF50';
  };

  const handleBlur = (event) => {
    event.target.style.borderColor = '#ccc';
  };

  // Drag and drop handlers
  const handleDragStart = (event, item) => {
    setDraggedItem(item);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (event) => {
    event.preventDefault();
    if (draggedItem) {
      setDroppedItems(prev => [...prev, draggedItem]);
      setDraggedItem(null);
    }
  };

  // File upload handler
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const fileInfo = files.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified).toLocaleString()
    }));
    setUploadedFiles(prev => [...prev, ...fileInfo]);
  };

  // Custom event handlers
  const handleCustomEvent = (message) => {
    alert(`Custom event: ${message}`);
  };

  const draggableItems = ['Item 1', 'Item 2', 'Item 3', 'Item 4'];

  return (
    <div className="page-container">
      <h1>Event Handling in React</h1>
      
      <div className="demo-section">
        <h2>Basic Click Events</h2>
        <button onClick={handleClick}>Click Me! (Count: {clickCount})</button>
        <button onDoubleClick={handleDoubleClick}>Double Click Me!</button>
        <button onContextMenu={handleContextMenu}>Right Click Me!</button>
      </div>

      <div className="demo-section">
        <h2>Mouse Events</h2>
        <div 
          className="mouse-area"
          onMouseMove={handleMouseMove}
          style={{
            width: '100%',
            height: '200px',
            border: '2px solid #3498db',
            borderRadius: '8px',
            position: 'relative',
            backgroundColor: '#f8f9fa'
          }}
        >
          <p style={{ padding: '20px' }}>Move your mouse in this area!</p>
          <div 
            className="mouse-pointer"
            style={{
              position: 'absolute',
              left: mousePosition.x - 320,
              top: mousePosition.y - 200,
              width: '10px',
              height: '10px',
              backgroundColor: '#e74c3c',
              borderRadius: '50%',
              pointerEvents: 'none'
            }}
          />
          <p style={{ padding: '20px' }}>
            Mouse position: X: {mousePosition.x}, Y: {mousePosition.y}
          </p>
        </div>
      </div>

      <div className="demo-section">
        <h2>Keyboard Events</h2>
        <input
          type="text"
          placeholder="Type something..."
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        <p>Last key pressed: <strong>{keyPressed}</strong></p>
      </div>

      <div className="demo-section">
        <h2>Form Handling</h2>
        <form onSubmit={handleSubmit} className="demo-form">
          <div className="form-group">
            <label>Name:</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              required
            />
          </div>

          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              required
            />
          </div>

          <div className="form-group">
            <label>Category:</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
            >
              <option value="general">General</option>
              <option value="support">Support</option>
              <option value="feedback">Feedback</option>
              <option value="bug">Bug Report</option>
            </select>
          </div>

          <div className="form-group">
            <label>Message:</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              rows="4"
              required
            />
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                name="subscribe"
                checked={formData.subscribe}
                onChange={handleInputChange}
              />
              Subscribe to newsletter
            </label>
          </div>

          <button type="submit">Submit Form</button>
        </form>
      </div>

      <div className="demo-section">
        <h2>Drag and Drop</h2>
        <div className="drag-drop-demo">
          <div className="drag-source">
            <h3>Drag Items:</h3>
            {draggableItems.map((item, index) => (
              <div
                key={index}
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
                className="draggable-item"
                style={{
                  padding: '10px',
                  margin: '5px',
                  backgroundColor: '#3498db',
                  color: 'white',
                  borderRadius: '4px',
                  cursor: 'move'
                }}
              >
                {item}
              </div>
            ))}
          </div>

          <div 
            className="drop-zone"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            style={{
              minHeight: '200px',
              border: '2px dashed #ccc',
              borderRadius: '8px',
              padding: '20px',
              marginTop: '20px'
            }}
          >
            <h3>Drop Zone:</h3>
            {droppedItems.length === 0 ? (
              <p>Drag items here!</p>
            ) : (
              droppedItems.map((item, index) => (
                <div key={index} className="dropped-item">
                  {item}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="demo-section">
        <h2>File Upload</h2>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          multiple
          accept=".jpg,.jpeg,.png,.gif,.pdf,.txt"
        />
        <button onClick={() => fileInputRef.current.click()}>
          Choose Files
        </button>
        
        {uploadedFiles.length > 0 && (
          <div className="uploaded-files">
            <h3>Uploaded Files:</h3>
            {uploadedFiles.map((file, index) => (
              <div key={index} className="file-info">
                <p><strong>Name:</strong> {file.name}</p>
                <p><strong>Size:</strong> {(file.size / 1024).toFixed(2)} KB</p>
                <p><strong>Type:</strong> {file.type}</p>
                <p><strong>Modified:</strong> {file.lastModified}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="demo-section">
        <h2>Custom Events</h2>
        <button onClick={() => handleCustomEvent('Button 1 clicked!')}>
          Custom Event 1
        </button>
        <button onClick={() => handleCustomEvent('Button 2 clicked!')}>
          Custom Event 2
        </button>
      </div>

      {submissions.length > 0 && (
        <div className="demo-section">
          <h2>Form Submissions</h2>
          {submissions.map(submission => (
            <div key={submission.id} className="submission">
              <p><strong>Name:</strong> {submission.name}</p>
              <p><strong>Email:</strong> {submission.email}</p>
              <p><strong>Category:</strong> {submission.category}</p>
              <p><strong>Message:</strong> {submission.message}</p>
              <p><strong>Newsletter:</strong> {submission.subscribe ? 'Yes' : 'No'}</p>
              <p><strong>Submitted:</strong> {submission.timestamp}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventHandling;
