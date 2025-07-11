import { sampleClients } from "@/app/data/sampleData";
import style from "../page.module.css"; // Adjust the path as necessary

export default async function ClientPage({ params }) {
    const { clientId } = await params;
    const client = sampleClients.find(client => client.id === parseInt(clientId));

    console.log('Client ID:', clientId); // Debug log
    console.log('Found client:', client); // Debug log

    return (
        <div className={style.clientPageWrapper}>
            <button> Add Client </button>
            <h1>Client #{clientId}</h1>
            {client ? (
                <div className={style.clientInfoWrapper}>
                    <h2>{client.name}</h2>
                    <div className={style.clientNotes}>
                        <h3> Client Notes </h3>
                        <p>{client.notes}</p>
                    </div>
                    <div className={style.detailsContainer + " flex-lr space-evenly "}>

                        <div className={style.clientDetails}>
                            <h3> Client Details </h3>
                            <div className={style.clientDetail}>
                                <label> Email: </label>
                                <p>{client.email}</p>
                            </div>

                            <div className={style.clientDetail}><label> Phone: </label>
                                <p>{client.phone}</p>
                            </div>
                            <div className={style.clientDetail}><label> Address: </label>
                                <p>{client.address}</p>
                            </div>
                        </div>
                        <div className={style.clientStats}>
                            <h3> Statistics </h3>
                            {/* <div className={style.clientDetail}>
                                <label> Visits: </label>
                                <p>{client.visitCount}</p>
                            </div> */}
                            <div className={style.clientDetail}>
                                <label> Last Visit: </label>
                                <p>{client.lastVisit ? new Date(client.lastVisit).toLocaleDateString() : 'N/A'}</p>
                            </div>
                            <div className={style.clientDetail}>
                                <label> Next Visit: </label>
                                <p>{client.nextVisit ? new Date(client.nextVisit).toLocaleDateString() : 'N/A'}</p>
                            </div>
                            <div className={style.clientDetail}>
                                <label> First Visit: </label>
                                <p>{client.firstVisit ? new Date(client.firstVisit).toLocaleDateString() : 'N/A'}</p>
                            </div>
                            {/* <div className={style.clientDetail}>
                                <label> Status: </label>
                                <p>{client.status.charAt(0).toUpperCase() + client.status.slice(1)}</p>
                            </div> */}
                        </div>
                    </div>
                    {/* Display other client details as needed */}
                </div>
            ) : (
                <p>Client not found, please contact support if issues persist.</p>
            )}

        </div>
    );
}