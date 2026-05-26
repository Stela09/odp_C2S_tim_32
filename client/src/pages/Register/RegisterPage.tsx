import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/ApiService';
import './Register.css';

const RegisterPage = () => {
    const navigate = useNavigate();

    const [gamerTag, setGamerTag] = useState('');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (gamerTag.length < 3) { alert("Gamer Tag mora imati najmanje 3 karaktera!"); return; }
        if (fullName.length < 2) { alert("Ime mora imati najmanje 2 karaktera!"); return; }
        if (!email.includes('@')) { alert("Unesite validan email!"); return; }
        if (password.length < 8) { alert("Lozinka mora imati najmanje 8 karaktera!"); return; }

        setLoading(true);

        try {
            const result = await apiService.register(gamerTag, fullName, email, password);

            if (!result.success) {
                alert(result.message ?? "Registracija neuspešna!");
                return;
            }

            localStorage.setItem('token', result.data);
            alert(`Dobrodošao, ${gamerTag}! Nalog je kreiran.`);
            navigate('/dashboard');
        } catch {
            alert("Greška pri registraciji. Proveri konekciju.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-container">
            <div className="register-box">
                <h1>PULSE GRID</h1>
                <p>Kreirajte novi nalog</p>

                <input
                    type="text"
                    placeholder="Gamer Tag..."
                    value={gamerTag}
                    onChange={(e) => setGamerTag(e.target.value)}
                />

                <input
                    type="text"
                    placeholder="Ime i prezime..."
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                />

                <input
                    type="email"
                    placeholder="Email..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <input
                    type="password"
                    placeholder="Lozinka..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button onClick={handleRegister} disabled={loading}>
                    {loading ? "Registracija..." : "Registruj se"}
                </button>

                <p className="login-link">
                    Već imaš nalog? <a href="/login">Prijavi se</a>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;