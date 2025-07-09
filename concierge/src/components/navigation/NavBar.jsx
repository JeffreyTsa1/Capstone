"use client"
import Link from 'next/link';
import styles from './Navigation.module.css'; // Assuming you have a CSS module for styles
import { usePathname } from 'next/navigation';

const links = [
    { name: 'Home', href: '/' },
    { name: 'Schedule', href: '/schedule' },
    { name: 'Clients', href: '/clients' },
    { name: 'Profile', href: '/profile' },
];


const NavBar = () => {
    const pathname = usePathname();

    return (
        <div className={styles.navWrapper}>
            <nav className={styles.nav}>
                <div className="flex-lr">
                    {/* Brand Logo */}
                    <div className="text-2xl font-bold text-gray-800">
                        <Link href="/">Concierge</Link>
                    </div>

                    <div className={styles.rightNav}>
                        {links.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={`text-sm font-medium ${pathname === link.href ? 'text-indigo-600' : 'text-gray-600 hover:text-indigo-500'
                                    }`}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>
                </div>
            </nav>



        </div>
    )
}

export default NavBar