import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/ApiService';
import './Tournaments.css';

interface Tournament {
    id: number;
    name: string;
    format: string;
    status: string;
    max_teams: number;
    registration_deadline: string;
    starts_at: string;
    prize_pool: number | null;
}

const TournamentsPage = () => {
    const navigate = useNavigate();
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        apiService.getTournaments().then(res => {
            if (res.success) setTournaments(res.data.items ?? []);
        }).finally(() => setLoading(false));
    }, []);

    const filtered = tournaments.filter(t =>
        t.name.toLowerCase().includes(filter.toLowerCase()) ||
        t.status.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="tournaments-container">
            <header className="tournaments-header">
                <h1 onClick={() => navigate('/dashboard')} className="logo">PULSE GRID</h1>
                <button onClick={() => navigate('/dashboard')} className="back-btn">← Dashboard</button>
            </header>

            <main className="tournaments-main">
                <div className="tournaments-top">
                    <h2>Turniri</h2>
                    <input
                        type="text"
                        placeholder="Pretraži turnire..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="search-input"
                    />
                </div>

                {loading ? (
                    <p>Učitavanje...</p>
                ) : filtered.length === 0 ? (
                    <p className="empty">Nema turnira.</p>
                ) : (
                    <div className="tournament-grid">
                        {filtered.map((t) => (
                            <div key={t.id} className="tournament-card">
                                <div className="card-header">
                                    <h3>{t.name}</h3>
                                    <span className={`status-badge status-${t.status}`}>{t.status}</span>
                                </div>
                                <div className="card-body">
                                    <p><span>Format:</span> {t.format.replace(/_/g, ' ')}</p>
                                    <p><span>Timovi:</span> {t.max_teams}</p>
                                    <p><span>Rok prijave:</span> {new Date(t.registration_deadline).toLocaleDateString()}</p>
                                    <p><span>Početak:</span> {new Date(t.starts_at).toLocaleDateString()}</p>
                                    {t.prize_pool && <p><span>Nagrada:</span> ${t.prize_pool}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default TournamentsPage;