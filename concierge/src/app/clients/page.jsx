import styles from './page.module.css';
import Link from 'next/link';
import { sampleClients } from '../data/sampleData';

const page = () => {
    return (
        <div className={styles.mainContainer}>
            <div 
                className='flex-lr space-between mid-width'

            >
                <h1> Clients </h1>
                <div className={styles.buttonGroup}>
                    <button> Add Client</button>
                    <button> Edit Client</button>
                </div>
            </div>
            
            <ul>
                {sampleClients.map((client, index) => (
                    <li 
                        key={client.id} 
                        className={styles.clientListItem}
                        whileHover={{ scale: 1.02 }}
                    >
                        <Link href={`/clients/${client.id}`} className={styles.clientButton}>
                            <div className={styles.clientHeader}>
                                <h2>#{client.id}</h2>
                                <span className={`${styles.statusBadge} ${styles[client.status]}`}>
                                    {client.status}
                                </span>
                            </div>
                            <h3>{client.name}</h3>
                            <p>{client.email}</p>
                            <div className={styles.clientMeta}>
                                <span className={styles.visitCount}>
                                    {client.visitCount} visits
                                </span>
                                <span className={styles.lastVisit}>
                                    Last: {new Date(client.lastVisit).toLocaleDateString()}
                                </span>
                            </div>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default page