import { useRef, useEffect } from 'react';

const DOMManipulation = () => {
  const boxRef = useRef(null);
  const textRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    // DOM manipulation on component mount
    const box = boxRef.current;
    box.style.transition = 'all 0.3s ease';
  }, []);

  const changeBoxColor = () => {
    const box = boxRef.current;
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    box.style.backgroundColor = randomColor;
  };

  const changeBoxSize = () => {
    const box = boxRef.current;
    const currentWidth = parseInt(box.style.width) || 200;
    const newWidth = currentWidth === 200 ? 300 : 200;
    box.style.width = `${newWidth}px`;
    box.style.height = `${newWidth}px`;
  };

  const animateBox = () => {
    const box = boxRef.current;
    box.style.transform = box.style.transform === 'rotate(180deg)' ? 'rotate(0deg)' : 'rotate(180deg)';
  };

  const changeText = () => {
    const text = textRef.current;
    const messages = [
      'DOM Manipulation is powerful!',
      'React refs give us direct access to DOM elements',
      'We can change styles, content, and attributes',
      'This is useful for animations and complex interactions'
    ];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    text.textContent = randomMessage;
    text.style.color = `hsl(${Math.random() * 360}, 70%, 50%)`;
  };

  const addListItem = () => {
    const list = listRef.current;
    const newItem = document.createElement('li');
    newItem.textContent = `Item ${list.children.length + 1} - Added at ${new Date().toLocaleTimeString()}`;
    newItem.style.opacity = '0';
    newItem.style.transition = 'opacity 0.5s ease';
    list.appendChild(newItem);
    
    // Animate in
    setTimeout(() => {
      newItem.style.opacity = '1';
    }, 10);
  };

  const clearList = () => {
    const list = listRef.current;
    while (list.firstChild) {
      list.removeChild(list.firstChild);
    }
  };

  const highlightElements = () => {
    const elements = document.querySelectorAll('.highlight-target');
    elements.forEach(el => {
      el.classList.add('highlighted');
      setTimeout(() => {
        el.classList.remove('highlighted');
      }, 1000);
    });
  };

  return (
    <div className="page-container">
      <h1>DOM Manipulation with React</h1>
      
      <div className="demo-section">
        <h2>Direct DOM Manipulation</h2>
        <p>Using refs to directly manipulate DOM elements:</p>
        
        <div className="demo-controls">
          <button onClick={changeBoxColor}>Change Color</button>
          <button onClick={changeBoxSize}>Change Size</button>
          <button onClick={animateBox}>Rotate</button>
        </div>
        
        <div 
          ref={boxRef}
          className="demo-box highlight-target"
          style={{
            width: '200px',
            height: '200px',
            backgroundColor: '#3498db',
            margin: '20px auto',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '18px',
            fontWeight: 'bold'
          }}
        >
          Interactive Box
        </div>
      </div>

      <div className="demo-section">
        <h2>Text Manipulation</h2>
        <button onClick={changeText}>Change Text</button>
        <p ref={textRef} className="demo-text highlight-target">
          Click the button to change this text dynamically!
        </p>
      </div>

      <div className="demo-section">
        <h2>Dynamic List Manipulation</h2>
        <div className="demo-controls">
          <button onClick={addListItem}>Add Item</button>
          <button onClick={clearList}>Clear List</button>
        </div>
        <ul ref={listRef} className="dynamic-list highlight-target">
          <li>Initial item</li>
        </ul>
      </div>

      <div className="demo-section">
        <h2>Query Selector Example</h2>
        <button onClick={highlightElements}>Highlight All Elements</button>
        <p>This button uses querySelector to find and highlight all elements with the class 'highlight-target'.</p>
      </div>
    </div>
  );
};

export default DOMManipulation;
