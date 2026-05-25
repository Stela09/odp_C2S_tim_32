import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/ApiService';
import './Health.css';

interface DbNode {
    name: string;
    status: string;
    latency?: number;
}

interface ApiNode {
    name: string;
    status: string;
    latency?: number;
    port?: number;
}

const HealthPage = () => {
    const navigate = useNavigate();
    const [dbNodes, setDbNodes] = useState<DbNode[]>([]);
    const [apiNodes, setApiNodes] = useState<ApiNode[]>([]);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem('token');

    const loadHealth = useCallback(async () => {
        if (!token) { navigate('/login'); return; }
        setLoading(true);
        try {
            const [dbRes, apiRes] = await Promise.all([
                apiService.getDbHealth(token),
                apiService.getApiHealth(token),
            ]);
            if (dbRes.success) setDbNodes(dbRes.data ?? []);
            if (apiRes.success) setApiNodes(apiRes.data ?? []);
        } catch {
            console.error("Health check failed");
        } finally {
            setLoading(false);
        }
    }, [token, navigate]);

    useEffect(() => {
        loadHealth();
        const interval = setInterval(loadHealth, 10000);
        return () => clearInterval(interval);
    }, [loadHealth]);

    const statusColor = (status: string) => {
        if (status === 'healthy') return 'status-healthy';
        if (status === 'degraded') return 'status-degraded';
        return 'status-offline';
    };

    const statusIcon = (status: string) => {
        if (status === 'healthy') return '✅';
        if (status === 'degraded') return '⚠️';
        return '❌';
    };

    return (
        <div className="health-container">
            <header className="health-header">
                <h1 onClick={() => navigate('/dashboard')} className="logo">PULSE GRID</h1>
                <span className="admin-badge">ADMIN</span>
                <button onClick={() => navigate('/admin')} className="back-btn">← Admin</button>
            </header>

            <main className="health-main">
                <div className="health-top">
                    <h2>Health Dashboard</h2>
                    <button onClick={loadHealth} className="refresh-btn">↻ Osvježi</button>
                </div>

                {loading ? <p>Učitavanje...</p> : (
                    <>
                        <section className="health-section">
                            <h3>Čvorovi baze podataka</h3>
                            <div className="nodes-grid">
                                {dbNodes.length === 0 ? (
                                    <p className="empty">Nema podataka o čvorovima.</p>
                                ) : dbNodes.map((node, i) => (
                                    <div key={i} className={`node-card ${statusColor(node.status)}`}>
                                        <div className="node-icon">{statusIcon(node.status)}</div>
                                        <div className="node-info">
                                            <h4>{node.name}</h4>
                                            <p className="node-status">{node.status}</p>
                                            {node.latency !== undefined && (
                                                <p className="node-latency">{node.latency}ms</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="health-section">
                            <h3>API serveri</h3>
                            <div className="nodes-grid">
                                {apiNodes.length === 0 ? (
                                    <p className="empty">Nema podataka o API serverima.</p>
                                ) : apiNodes.map((node, i) => (
                                    <div key={i} className={`node-card ${statusColor(node.status)}`}>
                                        <div className="node-icon">{statusIcon(node.status)}</div>
                                        <div className="node-info">
                                            <h4>{node.name}</h4>
                                            <p className="node-status">{node.status}</p>
                                            {node.port && <p className="node-latency">Port: {node.port}</p>}
                                            {node.latency !== undefined && (
                                                <p className="node-latency">{node.latency}ms</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </>
                )}
            </main>
        </div>
    );
};

export default HealthPage;