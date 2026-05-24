import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/ApiService';
import './Teams.css';

interface TeamMember {
    id: number;
    gamer_tag: string;
    role: string;
}

interface Team {
    id: number;
    name: string;
    tag: string;
    description: string | null;
    members: TeamMember[];
}

const TeamsPage = () => {
    const navigate = useNavigate();
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newTeam, setNewTeam] = useState({ name: '', tag: '', description: '' });

    const loadTeams = useCallback((token: string) => {
        apiService.getMyTeams(token).then(res => {
            if (res.success) setTeams(res.data ?? []);
        }).finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/login'); return; }
        loadTeams(token);
    }, [navigate, loadTeams]);

    const handleCreate = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        if (newTeam.name.length < 2) { alert("Naziv mora imati bar 2 karaktera!"); return; }
        if (newTeam.tag.length < 2 || newTeam.tag.length > 6) { alert("Tag mora imati 2-6 karaktera!"); return; }
        const res = await apiService.createTeam(newTeam.name, newTeam.tag, newTeam.description, token);
        if (res.success) {
            setShowCreate(false);
            setNewTeam({ name: '', tag: '', description: '' });
            loadTeams(token);
        } else {
            alert(res.message ?? "Greška pri kreiranju tima!");
        }
    };

    return (
        <div className="teams-container">
            <header className="teams-header">
                <h1 onClick={() => navigate('/dashboard')} className="logo">PULSE GRID</h1>
                <button onClick={() => navigate('/dashboard')} className="back-btn">← Dashboard</button>
            </header>

            <main className="teams-main">
                <div className="teams-top">
                    <h2>Moji timovi</h2>
                    <button onClick={() => setShowCreate(!showCreate)} className="create-btn">
                        {showCreate ? 'Otkaži' : '+ Novi tim'}
                    </button>
                </div>

                {showCreate && (
                    <div className="create-form">
                        <h3>Kreiraj tim</h3>
                        <input type="text" placeholder="Naziv tima..." value={newTeam.name}
                            onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })} />
                        <input type="text" placeholder="Tag (2-6 slova)..." value={newTeam.tag}
                            onChange={(e) => setNewTeam({ ...newTeam, tag: e.target.value.toUpperCase() })} />
                        <textarea placeholder="Opis tima (opciono)..." value={newTeam.description}
                            onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })} />
                        <button onClick={handleCreate} className="submit-btn">Kreiraj</button>
                    </div>
                )}

                {loading ? (
                    <p>Učitavanje...</p>
                ) : teams.length === 0 ? (
                    <p className="empty">Nisi član nijednog tima. Kreiraj novi!</p>
                ) : (
                    <div className="teams-grid">
                        {teams.map((t) => (
                            <div key={t.id} className="team-card">
                                <div className="team-card-header">
                                    <h3>{t.name}</h3>
                                    <span className="team-tag">{t.tag}</span>
                                </div>
                                {t.description && <p className="team-desc">{t.description}</p>}
                                <div className="team-members">
                                    <p className="members-title">Članovi:</p>
                                    {t.members?.map(m => (
                                        <span key={m.id} className={`member-badge ${m.role}`}>
                                            {m.gamer_tag} {m.role === 'captain' ? '⭐' : ''}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default TeamsPage;