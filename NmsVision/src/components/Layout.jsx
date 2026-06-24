import React from 'react';
import Sidebar from './Sidebar';
import { useTheme } from '../context/ThemeContext';

const Layout = ({ children }) => {
    const { theme } = useTheme();

    return (
        <div data-theme={theme} style={{ 
            display: 'flex', 
            minHeight: '100vh', 
            width: '100vw',
            backgroundColor: 'var(--bg-dark-1)',
            backgroundImage: 'linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)',
            backgroundSize: '35px 35px'
        }}>
            <Sidebar />
            <main style={{
                flex: 1,
                marginLeft: 'var(--sidebar-width)',
                padding: '2.5rem',
                height: '100vh',
                position: 'relative',
                zIndex: 1,
                width: 'calc(100vw - var(--sidebar-width))',
                overflowY: 'auto',
                overflowX: 'hidden'
            }}>
                <div className="animate-fade-in">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;