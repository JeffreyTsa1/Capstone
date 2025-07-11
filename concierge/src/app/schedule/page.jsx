import styles from './page.module.css';
import QueueSidebar from '@/components/dragndrop/QueueSidebar';
import CalendarDropArea from '@/components/calendar/CalendarDropArea'; // Adjust the import path as necessary
import FullCalendar from '@fullcalendar/react';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import Scheduling from '@/components/calendar/Scheduling'; // Adjust the import path as necessary




const page = () => {
  return (
    <div className={styles.schedulePageWrapper}>
            <Scheduling />

        
    </div>
  )
}

export default page