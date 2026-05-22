import { useState } from 'react';
import { apiService } from '../../services/ApiService';

import './Login.css';

const LoginPage = () => {
    const [gamerTag, setGamerTag] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (gamerTag.length < 3) {
            alert("Gamer Tag mora imati najmanje 3 karaktera!");
            return;
        }
        if (password.length < 8) {
            alert("Lozinka mora imati najmanje 8 karaktera!");
            return;
        }

        setLoading(true);
        try {
            const result = await apiService.login(gamerTag, password);
            if (!result.success) {
                alert(result.message ?? "Prijava neuspešna!");
                return;
            }
            localStorage.setItem('token', result.data);
            alert(`Uspešna prijava: Dobrodošao, ${gamerTag}!`);
            window.location.href = '/dashboard';
        } catch {
            alert("Greška pri prijavi. Proveri konekciju.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="Login-container">
            <div className="login-box">
                <h1>PULSE GRID</h1>
                <p>Unesite svoj nadimak da biste pristupili turnirima</p>

                <input
                    type="text"
                    placeholder="Gamer Tag..."
                    value={gamerTag}
                    onChange={(e) => setGamerTag(e.target.value)}
                />

                <input
                    type="password"
                    placeholder="Lozinka..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button onClick={handleLogin} disabled={loading}>
                    {loading ? "Prijava..." : "Prijavi se"}
                </button>
            </div>
        </div>
    );
};

export default LoginPage;