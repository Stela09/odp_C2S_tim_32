import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/ApiService';
import './Audit.css';

interface AuditLog {
    id: number;
    user_id: number | null;
    action: string;
    entity_type: string | null;
    entity_id: number | null;
    created_at: string;
    gamer_tag?: string | null;
}

const AuditPage = () => {
    const navigate = useNavigate();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 20;
    const token = localStorage.getItem('token');

    const loadLogs = useCallback(async () => {
        if (!token) { navigate('/login'); return; }
        setLoading(true);
        try {
            const res = await apiService.getAuditLogs(token, page, limit);
            if (res.success) {
                setLogs(res.data.items ?? []);
                setTotal(res.data.total ?? 0);
            }
        } catch {
            console.error("Failed to load audit logs");
        } finally {
            setLoading(false);
        }
    }, [token, navigate, page]);

    useEffect(() => {
        loadLogs();
    }, [loadLogs]);

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="audit-container">
            <header className="audit-header">
                <h1 onClick={() => navigate('/dashboard')} className="logo">PULSE GRID</h1>
                <span className="admin-badge">ADMIN</span>
                <button onClick={() => navigate('/admin')} className="back-btn">← Admin</button>
            </header>

            <main className="audit-main">
                <h2>Audit Log</h2>

                {loading ? <p>Učitavanje...</p> : (
                    <>
                        <div className="audit-table-wrap">
                            <table className="audit-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Korisnik</th>
                                        <th>Akcija</th>
                                        <th>Entitet</th>
                                        <th>Vreme</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.length === 0 ? (
                                        <tr><td colSpan={5} className="empty">Nema zapisa.</td></tr>
                                    ) : logs.map(log => (
                                        <tr key={log.id}>
                                            <td>{log.id}</td>
                                            <td>{log.gamer_tag ?? log.user_id ?? '-'}</td>
                                            <td><span className="action-badge">{log.action}</span></td>
                                            <td>{log.entity_type ? `${log.entity_type} #${log.entity_id}` : '-'}</td>
                                            <td>{new Date(log.created_at).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="pagination">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="page-btn">← Prethodna</button>
                            <span>{page} / {totalPages || 1}</span>
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="page-btn">Sledeća →</button>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default AuditPage;
