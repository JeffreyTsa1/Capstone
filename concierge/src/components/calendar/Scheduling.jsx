"use client"
import styles from './calendar.module.css';
import QueueSidebar from '../dragndrop/QueueSidebar';
import CalendarDropArea from './CalendarDropArea'; // Adjust the import path as necessary
import { useEffect, useRef, useState } from 'react';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import { sampleClientQueue } from '../../app/data/sampleClientQueue';

const Scheduling = () => {
    const [clientQueue, setClientQueue] = useState(sampleClientQueue);
    
    const removeClientFromQueue = (clientId) => {
        // alert(`Removing client with ID: ${clientId}`);
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