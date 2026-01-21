// src/pages/Calendar.jsx
import React, { useState, useEffect } from 'react';
import http from '../lib/http';
import { PageLoading } from '../components/LoadingStates';
import { useToast } from '../components/Toast';
import './Calendar.css';

export default function Calendar() {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState('week'); // 'day', 'week', 'month'
    const [events, setEvents] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [selectedDoctor, setSelectedDoctor] = useState('');

    useEffect(() => {
        loadDoctors();
    }, []);

    useEffect(() => {
        loadEvents();
    }, [currentDate, view, selectedDoctor]);

    async function loadDoctors() {
        try {
            const data = await http.get('/doctors');
            setDoctors(data.items || []);
        } catch (error) {
            console.error('Load doctors error:', error);
        }
    }

    async function loadEvents() {
        setLoading(true);
        try {
            const { startDate, endDate } = getDateRange();

            const params = {
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0]
            };

            if (selectedDoctor) {
                params.doctorId = selectedDoctor;
            }

            const data = await http.get('/calendar/events', params);
            setEvents(data.events || []);
        } catch (error) {
            console.error('Load events error:', error);
            toast.error('Kalendar ma\'lumotlarini yuklashda xatolik');
        } finally {
            setLoading(false);
        }
    }

    function getDateRange() {
        const start = new Date(currentDate);
        const end = new Date(currentDate);

        if (view === 'day') {
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
        } else if (view === 'week') {
            const day = start.getDay();
            start.setDate(start.getDate() - day + (day === 0 ? -6 : 1)); // Monday
            start.setHours(0, 0, 0, 0);
            end.setDate(start.getDate() + 6); // Sunday
            end.setHours(23, 59, 59, 999);
        } else if (view === 'month') {
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
            end.setMonth(end.getMonth() + 1, 0);
            end.setHours(23, 59, 59, 999);
        }

        return { startDate: start, endDate: end };
    }

    function navigateDate(direction) {
        const newDate = new Date(currentDate);

        if (view === 'day') {
            newDate.setDate(newDate.getDate() + direction);
        } else if (view === 'week') {
            newDate.setDate(newDate.getDate() + (direction * 7));
        } else if (view === 'month') {
            newDate.setMonth(newDate.getMonth() + direction);
        }

        setCurrentDate(newDate);
    }

    function getEventsByDate(date) {
        const dateStr = date.toISOString().split('T')[0];
        return events.filter(event => {
            const eventDate = new Date(event.start).toISOString().split('T')[0];
            return eventDate === dateStr;
        });
    }

    function renderDayView() {
        const hours = Array.from({ length: 24 }, (_, i) => i);
        const dayEvents = getEventsByDate(currentDate);

        return (
            <div className="calendar-day-view">
                <div className="time-column">
                    {hours.map(hour => (
                        <div key={hour} className="time-slot">
                            {String(hour).padStart(2, '0')}:00
                        </div>
                    ))}
                </div>
                <div className="events-column">
                    {hours.map(hour => {
                        const hourEvents = dayEvents.filter(event => {
                            const eventHour = new Date(event.start).getHours();
                            return eventHour === hour;
                        });

                        return (
                            <div key={hour} className="hour-slot">
                                {hourEvents.map(event => (
                                    <div key={event.id} className={`event-card status-${event.status}`}>
                                        <div className="event-time">
                                            {new Date(event.start).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <div className="event-title">{event.title}</div>
                                        <div className="event-doctor">{event.doctor}</div>
                                        {event.isPaid && <span className="badge success">To'langan</span>}
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    function renderWeekView() {
        const { startDate } = getDateRange();
        const days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            return date;
        });

        return (
            <div className="calendar-week-view">
                <div className="week-header">
                    {days.map(day => (
                        <div key={day.toISOString()} className="day-header">
                            <div className="day-name">{day.toLocaleDateString('uz-UZ', { weekday: 'short' })}</div>
                            <div className="day-number">{day.getDate()}</div>
                        </div>
                    ))}
                </div>
                <div className="week-body">
                    {days.map(day => {
                        const dayEvents = getEventsByDate(day);
                        return (
                            <div key={day.toISOString()} className="day-column">
                                {dayEvents.map(event => (
                                    <div key={event.id} className={`event-card status-${event.status}`}>
                                        <div className="event-time">
                                            {new Date(event.start).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <div className="event-title">{event.title}</div>
                                        <div className="event-doctor">{event.doctor}</div>
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    function renderMonthView() {
        const { startDate, endDate } = getDateRange();
        const firstDay = new Date(startDate);
        firstDay.setDate(1);
        const startDay = firstDay.getDay();
        const daysInMonth = new Date(endDate).getDate();

        const days = [];
        // Add empty cells for days before month starts
        for (let i = 0; i < (startDay === 0 ? 6 : startDay - 1); i++) {
            days.push(null);
        }
        // Add days of month
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
            days.push(date);
        }

        return (
            <div className="calendar-month-view">
                <div className="month-header">
                    {['Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan', 'Yak'].map(day => (
                        <div key={day} className="weekday-header">{day}</div>
                    ))}
                </div>
                <div className="month-grid">
                    {days.map((day, idx) => {
                        if (!day) return <div key={`empty-${idx}`} className="day-cell empty" />;

                        const dayEvents = getEventsByDate(day);
                        const isToday = day.toDateString() === new Date().toDateString();

                        return (
                            <div key={day.toISOString()} className={`day-cell ${isToday ? 'today' : ''}`}>
                                <div className="day-number">{day.getDate()}</div>
                                <div className="day-events">
                                    {dayEvents.slice(0, 3).map(event => (
                                        <div key={event.id} className={`event-dot status-${event.status}`} title={event.title} />
                                    ))}
                                    {dayEvents.length > 3 && <div className="more-events">+{dayEvents.length - 3}</div>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    if (loading && events.length === 0) {
        return <PageLoading message="Kalendar yuklanmoqda..." />;
    }

    return (
        <div className="page calendar-page">
            {/* Header */}
            <div className="calendar-header">
                <h1>Kalendar</h1>

                <div className="calendar-controls">
                    {/* View Selector */}
                    <div className="view-selector">
                        <button
                            className={`btn ${view === 'day' ? 'primary' : ''}`}
                            onClick={() => setView('day')}
                        >
                            Kun
                        </button>
                        <button
                            className={`btn ${view === 'week' ? 'primary' : ''}`}
                            onClick={() => setView('week')}
                        >
                            Hafta
                        </button>
                        <button
                            className={`btn ${view === 'month' ? 'primary' : ''}`}
                            onClick={() => setView('month')}
                        >
                            Oy
                        </button>
                    </div>

                    {/* Doctor Filter */}
                    <select
                        className="input"
                        value={selectedDoctor}
                        onChange={e => setSelectedDoctor(e.target.value)}
                        style={{ width: 'auto', minWidth: 200 }}
                    >
                        <option value="">Barcha shifokorlar</option>
                        {doctors.map(doctor => (
                            <option key={doctor._id} value={doctor._id}>
                                {doctor.firstName} {doctor.lastName}
                            </option>
                        ))}
                    </select>

                    {/* Navigation */}
                    <div className="date-navigation">
                        <button className="btn" onClick={() => navigateDate(-1)}>‹</button>
                        <button className="btn" onClick={() => setCurrentDate(new Date())}>Bugun</button>
                        <button className="btn" onClick={() => navigateDate(1)}>›</button>
                    </div>
                </div>
            </div>

            {/* Current Date Display */}
            <div className="current-date">
                {currentDate.toLocaleDateString('uz-UZ', {
                    year: 'numeric',
                    month: 'long',
                    ...(view === 'day' && { day: 'numeric' })
                })}
            </div>

            {/* Calendar View */}
            <div className="card calendar-container">
                {view === 'day' && renderDayView()}
                {view === 'week' && renderWeekView()}
                {view === 'month' && renderMonthView()}
            </div>
        </div>
    );
}
