import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/ApiService';
import './Watchlist.css';

interface Tournament {
    id: number;
    name: string;
    format: string;
    status: string;
    max_teams: number;
    starts_at: string;
}

const WatchlistPage = () => {
    const navigate = useNavigate();
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem('token');

    const loadWatchlist = useCallback(async () => {
        if (!token) { navigate('/login'); return; }
        setLoading(true);
        const res = await apiService.getWatchlist(token);
        if (res.success) setTournaments(res.data ?? []);
        setLoading(false);
    }, [token, navigate]);

    useEffect(() => {
        loadWatchlist();
    }, [loadWatchlist]);

    const handleUnwatch = async (tournamentId: number) => {
        if (!token) return;
        const res = await apiService.unwatchTournament(tournamentId, token);
        if (res.success) loadWatchlist();
        else alert(res.message ?? "Greška!");
    };

    return (
        <div className="watchlist-container">
            <header className="watchlist-header">
                <h1 onClick={() => navigate('/dashboard')} className="logo">PULSE GRID</h1>
                <button onClick={() => navigate('/dashboard')} className="back-btn">← Dashboard</button>
            </header>

            <main className="watchlist-main">
                <h2>Praćeni turniri</h2>
                {loading ? <p>Učitavanje...</p> : tournaments.length === 0 ? (
                    <p className="empty">Ne pratiš nijedan turnir. Idi na <span className="link" onClick={() => navigate('/tournaments')}>turnire</span> i dodaj!</p>
                ) : (
                    <div className="watchlist-grid">
                        {tournaments.map(t => (
                            <div key={t.id} className="watchlist-card">
                                <div className="card-header">
                                    <h3>{t.name}</h3>
                                    <span className={`status-badge status-${t.status}`}>{t.status}</span>
                                </div>
                                <div className="card-body">
                                    <p><span>Format:</span> {t.format.replace(/_/g, ' ')}</p>
                                    <p><span>Timovi:</span> {t.max_teams}</p>
                                    <p><span>Početak:</span> {new Date(t.starts_at).toLocaleDateString()}</p>
                                </div>
                                <button onClick={() => handleUnwatch(t.id)} className="unwatch-btn">Otprati</button>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default WatchlistPage;