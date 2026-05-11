import { useState } from 'react';
import { UserRole } from '../../enums/UserRole';
import { storageService } from '../../services/storageService';
import './Login.css';

const LoginPage = () => {

    const [gamerTag, setGamerTag] = useState('');

    const handleLogin = () => {
        if (gamerTag.length < 3){
            alert("Gamer Tag mora imati najmanje 3 karaktera!");
            return;
        
        }

        const user = {
            id: 1,
            gamer_tag: gamerTag,
            role: UserRole.USER,
            full_name: "Gamer User",
            email: "user@pulsegrid.com",
            password_hash: "",
            profil_image: null,
            createdAt: new Date()

        };

        storageService.setCurrentUser(user);

        alert(`Uspešna prijava: Dobrodošao, ${gamerTag}!`);

        window.location.href = '/dashboard';
    }

    return (
        <div className = "Login-container">
            <div className="login-box">
                <h1>PULSE GRID</h1>
                <p>Unesite svoj nadimak da biste pristupili turnirima</p>

                <input 
                    type="text"
                    placeholder="Gamer Tag..."
                    value={gamerTag}
                    onChange={(e) => setGamerTag(e.target.value)}
                />

                <button onClick={handleLogin}>
                    Prijavi se
                </button>
            </div>
        </div>

    );
};

 export default LoginPage;   
