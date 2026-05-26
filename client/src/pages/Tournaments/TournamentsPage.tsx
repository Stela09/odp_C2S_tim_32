import { useEffect, useState, useCallback } from 'react';
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

    const loadData = useCallback(async () => {
        setLoading(true);

        const tournamentsRes = await apiService.getTournaments();
        if (tournamentsRes.success) {
            setTournaments(tournamentsRes.data.items ?? []);
        }

        const token = localStorage.getItem('token');
        if (token) {
            const teamsRes = await apiService.getMyTeams(token);
            if (teamsRes.success) {
                setMyTeams(teamsRes.data ?? []);
            }
        }

        setLoading(false);
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadData();
    }, [loadData]);

    const filtered = tournaments.filter(t =>
        t.name.toLowerCase().includes(filter.toLowerCase()) ||
        t.status.toLowerCase().includes(filter.toLowerCase())
    );

    const openRegisterModal = (tournamentId: number) => {
        setSelectedTournament(tournamentId);
        setSelectedTeam(myTeams[0]?.id ?? 0);
    };

    const closeRegisterModal = () => {
        setSelectedTournament(null);
        setSelectedTeam(0);
    };

    const handleWatch = async (tournamentId: number) => {
        const token = localStorage.getItem('token');

        if (!token) {
            navigate('/login');
            return;
        }

        const res = await apiService.watchTournament(tournamentId, token);

        if (res.success) {
            alert("Turnir dodat na watchlist!");
        } else {
            alert(res.message ?? "Greška!");
        }
    };

    const handleRegister = async () => {
    

        const token = localStorage.getItem('token');

        if (!token) {
            navigate('/login');
            return;
        }

        if (!selectedTournament) {
            alert("Izaberi turnir.");
            return;
        }

        if (!selectedTeam) {
            alert("Izaberi tim.");
            return;
        }

        try {
            const res = await apiService.registerTeamToTournament(selectedTournament, selectedTeam, token);

            if (res.success) {
                alert("Tim je uspešno prijavljen na turnir!");
                closeRegisterModal();
                await loadData();
            } else {
                alert(res.message ?? "Tim je već prijavljen ili prijava nije uspela.");
            }
        } catch (err) {
            console.error(err);
            alert("Greška pri slanju prijave tima.");
        }
    };

    return (
        <div className="tournaments-container">
            <header className="tournaments-header">
                <h1 onClick={() => navigate('/dashboard')} className="logo">PULSE GRID</h1>
                <button onClick={() => navigate('/dashboard')} className="back-btn">
                    ← Dashboard
                </button>
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

                {selectedTournament !== null && (
                    <div className="register-modal">
                        <div className="register-modal-box">
                            <h3>Prijavi tim na turnir</h3>

                            {myTeams.length === 0 ? (
                                <p className="empty">Nemaš tim. Prvo kreiraj tim na stranici Timovi.</p>
                            ) : (
                                <select
                                    value={selectedTeam}
                                    onChange={(e) => setSelectedTeam(Number(e.target.value))}
                                    className="team-select"
                                >
                                    {myTeams.map(t => (
                                        <option key={t.id} value={t.id}>
                                            {t.name} [{t.tag}]
                                        </option>
                                    ))}
                                </select>
                            )}

                            <div className="modal-buttons">
                                <button
                                    type="button"
                                    onClick={handleRegister}
                                    className="submit-btn"
                                    disabled={myTeams.length === 0}
                                >
                                    Prijavi
                                </button>
                                <button
                                    type="button"
                                    onClick={closeRegisterModal}
                                    className="cancel-btn"
                                >
                                    Otkaži
                                </button>
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
                                    <span className={`status-badge status-${t.status}`}>
                                        {t.status}
                                    </span>
                                </div>

                                <div className="card-body">
                                    <p><span>Format:</span> {t.format.replace(/_/g, ' ')}</p>
                                    <p><span>Timovi:</span> {t.max_teams}</p>
                                    <p><span>Rok prijave:</span> {new Date(t.registration_deadline).toLocaleDateString()}</p>
                                    <p><span>Početak:</span> {new Date(t.starts_at).toLocaleDateString()}</p>
                                    {t.prize_pool !== null && (
                                        <p><span>Nagrada:</span> ${t.prize_pool}</p>
                                    )}
                                </div>

                                <div className="card-actions">
                                    <button
                                        type="button"
                                        onClick={() => handleWatch(t.id)}
                                        className="watch-btn"
                                    >
                                        ⭐ Prati
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => openRegisterModal(t.id)}
                                        className="register-btn"
                                    >
                                        + Prijavi tim
                                    </button>
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