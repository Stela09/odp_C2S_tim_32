import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/ApiService';
import './Admin.css';

interface User {
    id: number;
    gamer_tag: string;
    full_name: string;
    email: string;
    role: string;
}

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

const AdminPage = () => {
    const navigate = useNavigate();
    const [tab, setTab] = useState<'tournaments' | 'users'>('tournaments');
    const [users, setUsers] = useState<User[]>([]);
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newTournament, setNewTournament] = useState({
        name: '', game_id: 1, format: 'single_elimination',
        max_teams: 8, registration_deadline: '', starts_at: '', prize_pool: ''
    });

    const token = localStorage.getItem('token');

    const loadData = useCallback(async () => {
        setLoading(true);
        if (tab === 'users') {
            const res = await apiService.getUsers(token!);
            if (res.success) setUsers(res.data ?? []);
        } else {
            const res = await apiService.getTournaments();
            if (res.success) setTournaments(res.data.items ?? []);
        }
        setLoading(false);
    }, [tab, token]);

    useEffect(() => {
        if (!token) { navigate('/login'); return; }
        loadData();
    }, [navigate, tab, loadData, token]);

    const handleCreateTournament = async () => {
        if (!newTournament.name || !newTournament.registration_deadline || !newTournament.starts_at) {
            alert("Popunite sva obavezna polja!"); return;
        }
        const payload = {
            ...newTournament,
            game_id: Number(newTournament.game_id),
            max_teams: Number(newTournament.max_teams),
            prize_pool: newTournament.prize_pool ? Number(newTournament.prize_pool) : null,
        };
        const res = await apiService.createTournament(payload, token!);
        if (res.success) {
            alert("Turnir kreiran!");
            setShowCreate(false);
            setNewTournament({ name: '', game_id: 1, format: 'single_elimination', max_teams: 8, registration_deadline: '', starts_at: '', prize_pool: '' });
            loadData();
        } else {
            alert(res.message ?? "Greška pri kreiranju!");
        }
    };

    const handleRoleChange = async (userId: number, newRole: string) => {
        const res = await apiService.updateUserRole(userId, newRole, token!);
        if (res.success) loadData();
        else alert("Greška pri promeni uloge!");
    };

    return (
        <div className="admin-container">
            <header className="admin-header">
                <h1 onClick={() => navigate('/dashboard')} className="logo">PULSE GRID</h1>
                <span className="admin-badge">ADMIN</span>
                <button onClick={() => navigate('/dashboard')} className="back-btn">← Dashboard</button>
            </header>

            <div className="admin-tabs">
                <button className={tab === 'tournaments' ? 'tab active' : 'tab'} onClick={() => setTab('tournaments')}>Turniri</button>
                <button className={tab === 'users' ? 'tab active' : 'tab'} onClick={() => setTab('users')}>Korisnici</button>
            </div>

            <main className="admin-main">
                {tab === 'tournaments' && (
                    <>
                        <div className="section-top">
                            <h2>Upravljanje turnirima</h2>
                            <button onClick={() => setShowCreate(!showCreate)} className="create-btn">
                                {showCreate ? 'Otkaži' : '+ Novi turnir'}
                            </button>
                        </div>

                        {showCreate && (
                            <div className="create-form">
                                <h3>Kreiraj turnir</h3>
                                <input type="text" placeholder="Naziv turnira..." value={newTournament.name}
                                    onChange={(e) => setNewTournament({ ...newTournament, name: e.target.value })} />
                                <select value={newTournament.game_id}
                                    onChange={(e) => setNewTournament({ ...newTournament, game_id: parseInt(e.target.value) })}>
                                    <option value={1}>League of Legends</option>
                                    <option value={2}>Valorant</option>
                                    <option value={3}>CS2</option>
                                </select>
                                <select value={newTournament.format}
                                    onChange={(e) => setNewTournament({ ...newTournament, format: e.target.value })}>
                                    <option value="single_elimination">Single Elimination</option>
                                    <option value="double_elimination">Double Elimination</option>
                                    <option value="round_robin">Round Robin</option>
                                </select>
                                <input type="number" placeholder="Maks timova..." value={newTournament.max_teams}
                                    onChange={(e) => setNewTournament({ ...newTournament, max_teams: parseInt(e.target.value) })} />
                                <label>Rok prijave:</label>
                                <input type="datetime-local" value={newTournament.registration_deadline}
                                    onChange={(e) => setNewTournament({ ...newTournament, registration_deadline: e.target.value })} />
                                <label>Početak:</label>
                                <input type="datetime-local" value={newTournament.starts_at}
                                    onChange={(e) => setNewTournament({ ...newTournament, starts_at: e.target.value })} />
                                <input type="number" placeholder="Nagradni fond (opciono)..." value={newTournament.prize_pool}
                                    onChange={(e) => setNewTournament({ ...newTournament, prize_pool: e.target.value })} />
                                <button onClick={handleCreateTournament} className="submit-btn">Kreiraj</button>
                            </div>
                        )}

                        {loading ? <p>Učitavanje...</p> : (
                            <div className="admin-table-wrap">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Naziv</th>
                                            <th>Format</th>
                                            <th>Status</th>
                                            <th>Timovi</th>
                                            <th>Početak</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tournaments.map(t => (
                                            <tr key={t.id}>
                                                <td>{t.name}</td>
                                                <td>{t.format.replace(/_/g, ' ')}</td>
                                                <td><span className={`status-badge status-${t.status}`}>{t.status}</span></td>
                                                <td>{t.max_teams}</td>
                                                <td>{new Date(t.starts_at).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}

                {tab === 'users' && (
                    <>
                        <h2>Upravljanje korisnicima</h2>
                        {loading ? <p>Učitavanje...</p> : (
                            <div className="admin-table-wrap">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Gamer Tag</th>
                                            <th>Ime</th>
                                            <th>Email</th>
                                            <th>Uloga</th>
                                            <th>Akcija</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(u => (
                                            <tr key={u.id}>
                                                <td>{u.gamer_tag}</td>
                                                <td>{u.full_name}</td>
                                                <td>{u.email}</td>
                                                <td><span className={`role-badge role-${u.role}`}>{u.role}</span></td>
                                                <td>
                                                    <select value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)} className="role-select">
                                                        <option value="player">Player</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default AdminPage;