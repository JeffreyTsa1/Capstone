import styles from './page.module.css'; // Adjust the path as necessary
import Link from 'next/link';
import { motion } from 'framer-motion'; // If you want to use motion effects
import { sampleClients } from '../data/sampleData'; // Adjust the path as necessary

const page = () => {
    return (
        <div className={styles.mainContainer}>
            <div className='flex-lr space-between mid-width'>
                <h1> Clients </h1>
                <div className={styles.buttonGroup}>
                    <button> Add Client</button>
                    <button> Edit Client</button>

                </div>
            </div>
            <ul>
                {sampleClients.map(client => (
                    <li key={client.id} className={styles.clientListItem}>
                        <Link href={`/clients/${client.id}`} className={styles.clientButton}>
                            {client.name} - {client.email}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default page