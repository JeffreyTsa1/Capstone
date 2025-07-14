import Image from "next/image";
import styles from "./page.module.css";
import Link from "next/link";

export default function Home() {
  const userFirstName = "Johnny";
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 className={styles.title}>Dashboard Overview</h1>
        <h2 className={styles.subtitle}>Welcome back, {userFirstName}! 👋</h2>
        <div className={styles.welcomeText}>
          <span>Today is <strong>{today}</strong>.</span>
          <br />
          <span>You have <span className={styles.highlight}>3</span> appointments today.</span>
          <br />
          <span>Your next appointment is at <span className={styles.highlight}>10:00 AM</span> with <strong>Alice Johnson</strong>.</span>
          <br />
          <span><span className={styles.highlight}>0</span> clients are waiting to be scheduled.</span>
        </div>
        <div className="flex-lr space-evenly">
          <div className={styles.cardContainer}>
            <div className={styles.card + " " + styles.upcomingAppointments}>
              <h3 className={styles.cardTitle}>📅 Upcoming Appointments</h3>
              <ul className={styles.appointmentList}>
                <li>🕙 10:00 AM - Meeting with Alice Johnson</li>
                <li>🕦 11:30 AM - Call with Bob Smith</li>
                <li>🕑 2:00 PM - Consultation with Charlie West</li>
              </ul>
              <div className={styles.cardFooter}>
                <Link href="/calendar" className={styles.cardLink}>View Calendar →</Link>
              </div>
            </div>
            <div className={styles.card + " " + styles.TodaySchedule}>
              <h3 className={styles.cardTitle}>⏰ Today's Schedule</h3>
              <p className={styles.cardContent}>
                <span className={styles.scheduleItem}>🏢 Office hours: 9:00 AM - 5:00 PM</span>
                <span className={styles.scheduleItem}>📊 Total booked: 3.5 hours</span>
                <span className={styles.scheduleItem}>☕ Free time: 1:30 PM - 3:00 PM</span>
              </p>
              <div className={styles.cardFooter}>
                <Link href="/schedule" className={styles.cardLink}>View Schedule →</Link>
              </div>
            </div>
          </div>
          <div className={styles.cardContainer}>
            <div className={styles.card + " " + styles.clientsInQueue}>
              <h3 className={styles.cardTitle}>👥 Clients in Queue</h3>
              <p className={styles.cardContent}>✅ All caught up! No clients waiting to be scheduled.</p>
              <div className={styles.cardFooter}>
                <Link href="/clients" className={styles.cardLink}>View Clients →</Link>
              </div>
            </div>
            <div className={styles.card + " " + styles.clientsActivity}>
              <h3 className={styles.cardTitle}>📈 Client Activity</h3>
              <p className={styles.cardContent}>Weekly engagement summary:</p>
              <ul className={styles.activityList}>
                <li>📧 3 clients messaged this week</li>
                <li>✨ 1 new client joined</li>
                <li>🔄 2 returning clients scheduled</li>
              </ul>
              <div className={styles.cardMetrics}>
                <div className={styles.metric}>
                  <span className={styles.metricValue}>85%</span>
                  <span className={styles.metricLabel}>Retention</span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricValue}>6</span>
                  <span className={styles.metricLabel}>Active Clients</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
