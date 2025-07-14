import styles from './page.module.css'
import { sampleProfileData } from '../data/sampleProfileData' // Adjust the path as necessary
import Image from 'next/image' // Importing Image component from Next.js
import Link from 'next/link'

const ProfilePage = () => {
  // Format certification dates for better readability
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  return (
    <div className={styles.profilePageWrapper}>
      <h1>Your Profile</h1>
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
          <h2 className={styles.profileName}>{sampleProfileData.name}</h2>
          <p className={styles.businessName}>{sampleProfileData.businessName}</p>
          
          <div className={styles.contactInfo}>
            <div>
              <label>Email</label>
              <p>{sampleProfileData.email}</p>
            </div>
            <div>
              <label>Phone</label>
              <p>{sampleProfileData.phone}</p>
            </div>
            <div>
              <label>Address</label>
              <p>{sampleProfileData.address}</p>
            </div>
          </div>

          <div className={styles.socialMedia}>
            <h3>Connect With Me</h3>
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
          <h2>Business Information</h2>
          <div>
            <label>Business Address</label>
            <p>{sampleProfileData.businessAddress}</p>
          </div>
          <div>
            <label>Business Hours</label>
            <p>{sampleProfileData.businessHours}</p>
          </div>
          <div>
            <label>About Me</label>
            <p className={styles.bio}>{sampleProfileData.bio}</p>
          </div>
          <div>
            <label>Languages</label>
            <p>{sampleProfileData.languages.join(', ')}</p>
          </div>
          <div className={styles.skills}>
            <label>Skills & Expertise</label>
            <ul>
              {sampleProfileData.skills.map((skill, index) => (
                <li key={index}>{skill}</li>
              ))}
            </ul>
          </div>
          <div className={styles.certifications}>
            <label>Certifications & Credentials</label>
            <ul>
              {sampleProfileData.certifications.map((cert, index) => (
                <li key={index}>
                  <div className={styles.certTitle}>{cert.title}</div>
                  <div className={styles.certDetails}>
                    <span>{cert.issuingOrganization}</span>
                    <span className={styles.certDates}>
                      {formatDate(cert.issueDate)} - {formatDate(cert.expirationDate)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage