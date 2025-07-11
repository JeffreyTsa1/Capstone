"use client"
// import { useDroppable, useDraggable } from '@dnd-kit/core';
import { useEffect, useRef } from 'react';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
const QueueSidebar = ({ clientQueue, setClientQueue }) => {
    const sidebarRef = useRef();
    const draggableRef = useRef(); // Store reference to the Draggable instance

    useEffect(() => {
        if (sidebarRef.current) {
            // Clean up any existing Draggable instance
            if (draggableRef.current) {
                draggableRef.current.destroy();
            }

            // Create new Draggable instance
            draggableRef.current = new Draggable(sidebarRef.current, {
                itemSelector: '.fc-draggable',
                eventData: function (el) {
                    const clientId = el.getAttribute('data-client-id');
                    const clientName = el.getAttribute('data-client-name');
                    const duration = el.getAttribute('data-client-duration') || '01:00';
                    
                    return {
                        title: clientName,
                        duration: duration,
                        id: `event-${clientId}-${Date.now()}`, // Generate unique event ID
                        extendedProps: {
                            clientId: clientId, // Store original client ID
                            clientName: clientName,
                            fromQueue: true
                        }
                    };
                },
            });
        }

        // Cleanup function to destroy the Draggable instance when component unmounts
        return () => {
            if (draggableRef.current) {
                draggableRef.current.destroy();
                draggableRef.current = null;
            }
        };
    }, []);


    // const { setNodeRef, isOver } = useDroppable({
    //     id: 'queue-sidebar',
    // });

    return (
        <div className="sidebar" ref={sidebarRef}>
            <h3>Client Queue</h3>
            {clientQueue.map((client) => (
                <div
                    key={client.id}
                    className="fc-draggable draggable-client"
                    data-client-name={client.name}
                    data-client-duration={client.duration || '01:00'}
                    data-client-id={client.id}
                    style={{
                        cursor: 'grab',
                        padding: '10px',
                        margin: '5px 0',
                        backgroundColor: '#f0f0f0',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        userSelect: 'none',
                        // transition: 'all 0.01s'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#e8e8e8';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#f0f0f0';
                    }}
                >
                    {client.name}
                </div>
            ))}
        </div>
    );
}



export default QueueSidebar