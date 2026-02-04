import React, { useState } from 'react';
import { FiFilter, FiCalendar, FiUser, FiHome } from 'react-icons/fi';
import './FilterBar.css';

const FilterBar = ({ onFilterChange }) => {
    const [filters, setFilters] = useState({
        date: 'today',
        doctor: 'all',
        department: 'all',
        mode: 'real-time'
    });

    const handleFilterChange = (key, value) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        if (onFilterChange) {
            onFilterChange(newFilters);
        }
    };

    return (
        <div className="filter-bar">
            <div className="filter-group">
                <label className="filter-label">
                    <FiCalendar className="filter-icon" />
                    Sana
                </label>
                <select
                    className="filter-select"
                    value={filters.date}
                    onChange={(e) => handleFilterChange('date', e.target.value)}
                >
                    <option value="today">Bugun</option>
                    <option value="yesterday">Kecha</option>
                    <option value="week">Bu hafta</option>
                    <option value="month">Bu oy</option>
                </select>
            </div>

            <div className="filter-group">
                <label className="filter-label">
                    <FiUser className="filter-icon" />
                    Shifokor
                </label>
                <select
                    className="filter-select"
                    value={filters.doctor}
                    onChange={(e) => handleFilterChange('doctor', e.target.value)}
                >
                    <option value="all">Barchasi</option>
                    <option value="dr1">Dr. Aziza</option>
                    <option value="dr2">Dr. Bekzod</option>
                    <option value="dr3">Dr. Malika</option>
                </select>
            </div>

            <div className="filter-group">
                <label className="filter-label">
                    <FiHome className="filter-icon" />
                    Bo'lim
                </label>
                <select
                    className="filter-select"
                    value={filters.department}
                    onChange={(e) => handleFilterChange('department', e.target.value)}
                >
                    <option value="all">Barchasi</option>
                    <option value="cardiology">Kardiologiya</option>
                    <option value="neurology">Nevrologiya</option>
                    <option value="pediatrics">Pediatriya</option>
                </select>
            </div>

            <div className="filter-group">
                <label className="filter-label">Ma'lumot</label>
                <select
                    className="filter-select"
                    value={filters.mode}
                    onChange={(e) => handleFilterChange('mode', e.target.value)}
                >
                    <option value="real-time">Real-Time</option>
                    <option value="daily">Kunlik</option>
                    <option value="weekly">Haftalik</option>
                </select>
            </div>

            <button className="filter-apply-btn">
                <FiFilter />
                Filtr qo'llash
            </button>
        </div>
    );
};

export default FilterBar;
