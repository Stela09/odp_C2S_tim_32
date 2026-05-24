import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/ApiService';
import './Dashboard.css';

interface Tournament {
    id: number;
    name: string;
    format: string;
    status: string;
    max_teams: number;
}

const DashboardPage = () => {
    const navigate = useNavigate();
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/login'); return; }
        apiService.getTournaments().then(res => {
            if (res.success) setTournaments(res.data.items ?? []);
        }).finally(() => setLoading(false));
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h1>PULSE GRID</h1>
                <nav>
                    <button onClick={() => navigate('/tournaments')} className="nav-btn">Turniri</button>
                    <button onClick={handleLogout} className="logout-btn">Odjavi se</button>
                    <button onClick={() => navigate('/teams')} className="nav-btn">Timovi</button>
                    <button onClick={() => navigate('/admin')} className="nav-btn">Admin</button>
                </nav>
            </header>

            <main className="dashboard-main">
                <h2>Turniri</h2>
                {loading ? (
                    <p>Učitavanje...</p>
                ) : tournaments.length === 0 ? (
                    <p className="empty">Nema aktivnih turnira.</p>
                ) : (
                    <div className="tournament-grid">
                        {tournaments.map((t) => (
                            <div key={t.id} className="tournament-card">
                                <h3>{t.name}</h3>
                                <p>Format: {t.format}</p>
                                <p>Status: {t.status}</p>
                                <p>Timovi: {t.max_teams}</p>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default DashboardPage;