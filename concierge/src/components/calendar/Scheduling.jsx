"use client"
import styles from './calendar.module.css';
import QueueSidebar from '../dragndrop/QueueSidebar';
import CalendarDropArea from './CalendarDropArea'; // Adjust the import path as necessary
import { useEffect, useRef, useState } from 'react';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';


const Scheduling = () => {
    const [clientQueue, setClientQueue] = useState([
        { id: '1', name: 'Alice Johnson' },
        { id: '2', name: 'Bob Smith' },
        { id: '3', name: 'Charlie West' },
    ]);
    
    const removeClientFromQueue = (clientId) => {
        alert(`Removing client with ID: ${clientId}`);
        setClientQueue(prevQueue => prevQueue.filter(client => client.id !== clientId));
    };  
    
  return (
    <div>
        <h1>Scheduling</h1>
        <div className={styles.scheduleContainer + " flex-lr space-evenly"}>
            <QueueSidebar clientQueue={clientQueue} removeClientFromQueue={removeClientFromQueue} />
            <CalendarDropArea removeClientFromQueue={removeClientFromQueue} />
        </div>

    </div>
  )
}

export default Scheduling