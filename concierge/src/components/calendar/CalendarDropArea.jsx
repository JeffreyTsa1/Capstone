'use client';

import { useEffect, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

export default function CalendarDropArea({ removeClientFromQueue }) {
  const [events, setEvents] = useState([]);

  // This function handles drops from outside the calendar
//   function handleEventReceive(info) {
//     const newEvent = {
//       id: String(new Date().getTime()),
//       title: info.draggedEl.innerText,
//       start: info.date,
//     };

//     setEvents((prev) => [...prev, newEvent]);
//   }
  function handleEventReceive(info) {
    const { duration = 60, clientId } = info.event.extendedProps;
    const newEvent = {
      id: String(Date.now()),
      title: info.event.title,
      start: info.event.start,
      end: new Date(info.event.start.getTime() + duration * 60 * 1000), // +duration minutes
    };

    setEvents((prev) => [...prev, newEvent]);
    info.event.remove(); // remove the placeholder
    
    // Remove the client from the queue using the original client ID
    if (removeClientFromQueue && clientId) {
      removeClientFromQueue(clientId);
    }
  }


  return (
    <div className="calendar">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        initialView="timeGridDay"
        editable={true}
        droppable={true}
        eventReceive={handleEventReceive}
        events={events}
        height="90vh"
      />
    </div>
  );
}