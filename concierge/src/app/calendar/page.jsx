'use client';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { sampleAppointments } from '../data/sampleAppointmentData'; // Adjust the path as necessary
import styles  from './page.module.css'; // Adjust the path as necessary

const page = () => {


  return (
    <div className={styles.calendarPageWrapper}> 

    <div className={styles.fullCalendar}>
      <h1 className="text-2xl font-bold mb-4">Your Calendar</h1>

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        events={sampleAppointments}
        nowIndicator={true}
        height="auto"
      />
    </div>
    </div>
  );

}

export default page