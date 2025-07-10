import styles from './page.module.css'
import { sampleProfileData } from '../data/sampleProfileData' // Adjust the path as necessary
import Image from 'next/image' // Importing Image component from Next.js

const page = () => {
  return (
    <div className={styles.profilePageWrapper}>
      <h1> Profile </h1>
      <div className={styles.profileContainer}>
        <div className={styles.sidebar}>
          {/* Profile picture, contact info, socials */}
          <Image
            src={sampleProfileData.profilePicture}
            alt="Profile Picture"
            width={200}
            height={200}
            className={styles.profilePicture}
          />
          <div className={styles.contactInfo}>
            <div>
              <label> Email: </label>
              <p>{sampleProfileData.email}</p>
            </div>
            <div>
              <label> Phone: </label>
              <p>{sampleProfileData.phone}</p>
            </div>
            <div>
              <label> Address: </label>
              <p>{sampleProfileData.address}</p>
            </div>
          </div>

          <div className={styles.socialMedia}>
            <h3> Social Media </h3>
            <ul>
              {sampleProfileData.socialMedia && Object.entries(sampleProfileData.socialMedia).map(([platform, url]) => (
                <li key={platform}>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </a>
                </li>
              ))}
            </ul>
            </div>
        </div>
        <div className={styles.main}>
          <h2> {sampleProfileData.businessName}   </h2>
          <div>
            <label> Business Address: </label>
            <p>{sampleProfileData.businessAddress}</p>
          </div>
          <div>
            <label> Business Hours: </label>
            <p>{sampleProfileData.businessHours}</p>
          </div>
          <div>
            <label> Bio: </label>
            <p>{sampleProfileData.bio}</p>
          </div>
          <div>
            <p><label> Languages: </label>{sampleProfileData.languages.join(', ')}</p>
          </div>
          <div className={styles.certifications}>
            <label> Certifications: </label>
            <ul>
              {sampleProfileData.certifications.map((cert, index) => (
                <li key={index}>
                  {cert.title} - {cert.issuingOrganization} ({cert.issueDate} to {cert.expirationDate})
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.skills}>
            <label> Skills: </label>
            <ul>
              {sampleProfileData.skills.map((skill, index) => (
                <li key={index}>{skill}</li>
              ))}
            </ul>

          </div>
          <div>
            <p><label>Owner: </label>{sampleProfileData.name}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default page