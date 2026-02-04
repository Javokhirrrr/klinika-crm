import React from 'react';
import { FiBell } from 'react-icons/fi';
import './DashboardHeader.css';

const DashboardHeader = ({ userName = 'Doctor', greeting = 'Salom', statusText = 'Tizim faol' }) => {
    return (
        <div className="dashboard-header">
            <div className="header-greeting">
                <h1 className="greeting-text">
                    {greeting}, {userName}! 👋
                </h1>
                <p className="greeting-subtitle">Bugungi natijalar</p>
            </div>

            <div className="header-actions">
                <div className="status-indicator">
                    <span className="status-dot"></span>
                    <span className="status-text">{statusText}</span>
                </div>

                <button className="notification-btn">
                    <FiBell />
                    <span className="notification-badge">3</span>
                </button>
            </div>
        </div>
    );
};

export default DashboardHeader;
