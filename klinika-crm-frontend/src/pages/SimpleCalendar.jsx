import { FiCalendar } from 'react-icons/fi';
import '../styles/simple-pages.css';

export default function SimpleCalendar() {
    return (
        <div className="simple-page">
            <div className="page-header">
                <div>
                    <h1>Kalendar</h1>
                    <p className="text-muted">Qabullar kalendari</p>
                </div>
            </div>

            <div className="simple-card" style={{ padding: '4rem', textAlign: 'center' }}>
                <FiCalendar size={80} style={{ color: 'var(--gray-400)', marginBottom: '1.5rem' }} />
                <h2 style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                    Kalendar Tez Orada
                </h2>
                <p style={{ fontSize: '1.125rem', color: 'var(--gray-600)' }}>
                    Qabullar kalendari va bandlik ko'rinishi qo'shilmoqda
                </p>
            </div>
        </div>
    );
}
