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

interface TeamInvitation {
    id: number;
    team_id: number;
    team_name: string;
    team_tag: string;
    invited_by: string;
}

const getUserIdFromToken = (token: string): number | null => {
    try {
        const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=')));
        return Number(payload.id) || null;
    } catch {
        return null;
    }
};

const TeamsPage = () => {
    const navigate = useNavigate();
    const [teams, setTeams] = useState<Team[]>([]);
    const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
    const [inviteTags, setInviteTags] = useState<Record<number, string>>({});
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newTeam, setNewTeam] = useState({ name: '', tag: '', description: '' });
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

    const loadTeams = useCallback(async (token: string) => {
        setLoading(true);
        const [teamsRes, invitationsRes] = await Promise.all([
            apiService.getMyTeams(token),
            apiService.getTeamInvitations(token),
        ]);

        if (teamsRes.success) setTeams(teamsRes.data ?? []);
        if (invitationsRes.success) setInvitations(invitationsRes.data ?? []);
        setLoading(false);
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/login'); return; }
        setCurrentUserId(getUserIdFromToken(token));
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

    const handleInvite = async (teamId: number) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const gamerTag = inviteTags[teamId]?.trim();
        if (!gamerTag) {
            alert('Unesi gamer tag igraca.');
            return;
        }

        const res = await apiService.inviteTeamMember(teamId, gamerTag, token);
        if (res.success) {
            setInviteTags(prev => ({ ...prev, [teamId]: '' }));
            alert('Pozivnica poslata!');
        } else {
            alert(res.message ?? 'Pozivnica nije poslata.');
        }
    };

    const handleInvitation = async (invitation: TeamInvitation, action: "accept" | "decline") => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await apiService.respondToTeamInvitation(invitation.team_id, invitation.id, action, token);
        if (res.success) {
            loadTeams(token);
        } else {
            alert(res.message ?? 'Pozivnica nije obradjena.');
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

                {invitations.length > 0 && (
                    <section className="invitations-panel">
                        <h3>Pozivnice</h3>
                        {invitations.map(invitation => (
                            <div key={invitation.id} className="invitation-row">
                                <span>
                                    {invitation.invited_by} te je pozvao u {invitation.team_name} [{invitation.team_tag}]
                                </span>
                                <div>
                                    <button onClick={() => handleInvitation(invitation, "accept")} className="mini-btn accept-btn">Prihvati</button>
                                    <button onClick={() => handleInvitation(invitation, "decline")} className="mini-btn decline-btn">Odbij</button>
                                </div>
                            </div>
                        ))}
                    </section>
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
                                {t.members?.some(m => m.id === currentUserId && m.role === 'captain') && (
                                    <div className="invite-box">
                                        <input
                                            type="text"
                                            placeholder="Gamer tag igraca..."
                                            value={inviteTags[t.id] ?? ''}
                                            onChange={(e) => setInviteTags({ ...inviteTags, [t.id]: e.target.value })}
                                        />
                                        <button onClick={() => handleInvite(t.id)} className="mini-btn">Pozovi</button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default TeamsPage;
