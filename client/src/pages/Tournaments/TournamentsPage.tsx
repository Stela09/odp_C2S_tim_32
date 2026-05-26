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

interface Team {
    id: number;
    name: string;
    tag: string;
}

const TournamentsPage = () => {
    const navigate = useNavigate();
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [myTeams, setMyTeams] = useState<Team[]>([]);
    const [selectedTournament, setSelectedTournament] = useState<number | null>(null);
    const [selectedTeam, setSelectedTeam] = useState<number>(0);

    useEffect(() => {
        apiService.getTournaments().then(res => {
            if (res.success) setTournaments(res.data.items ?? []);
        }).finally(() => setLoading(false));

        const token = localStorage.getItem('token');
        if (token) {
            apiService.getMyTeams(token).then(res => {
                if (res.success) setMyTeams(res.data ?? []);
            });
        }
    }, []);

    const filtered = tournaments.filter(t =>
        t.name.toLowerCase().includes(filter.toLowerCase()) ||
        t.status.toLowerCase().includes(filter.toLowerCase())
    );

    const handleWatch = async (tournamentId: number) => {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/login'); return; }
        const res = await apiService.watchTournament(tournamentId, token);
        if (res.success) alert("Turnir dodat na watchlist!");
        else alert(res.message ?? "Greška!");
    };

    const handleRegister = async () => {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/login'); return; }
        if (!selectedTeam || !selectedTournament) { alert("Izaberi tim!"); return; }
        const res = await apiService.registerTeamToTournament(selectedTournament, selectedTeam, token);
        if (res.success) {
            alert("Tim prijavljen na turnir!");
            setSelectedTournament(null);
        } else {
            alert(res.message ?? "Greška pri prijavi!");
        }
    };

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

                {selectedTournament && (
                    <div className="register-modal">
                        <div className="register-modal-box">
                            <h3>Prijavi tim na turnir</h3>
                            <select value={selectedTeam} onChange={(e) => setSelectedTeam(parseInt(e.target.value))} className="team-select">
                                <option value={0}>Izaberi tim...</option>
                                {myTeams.map(t => (
                                    <option key={t.id} value={t.id}>{t.name} [{t.tag}]</option>
                                ))}
                            </select>
                            <div className="modal-buttons">
                                <button onClick={handleRegister} className="submit-btn">Prijavi</button>
                                <button onClick={() => setSelectedTournament(null)} className="cancel-btn">Otkaži</button>
                            </div>
                        </div>
                    </div>
                )}

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
                                <div className="card-actions">
                                    <button onClick={() => handleWatch(t.id)} className="watch-btn">⭐ Prati</button>
                                    <button onClick={() => setSelectedTournament(t.id)} className="register-btn">+ Prijavi tim</button>
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