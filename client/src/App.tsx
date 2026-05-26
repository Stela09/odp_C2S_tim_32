import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/Login/LoginPage';
import RegisterPage from './pages/Register/RegisterPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import TournamentsPage from './pages/Tournaments/TournamentsPage';
import TeamsPage from './pages/Teams/TeamsPage';
import AdminPage from './pages/Admin/AdminPage';
import HealthPage from './pages/Health/HealthPage';
import AuditPage from './pages/Audit/AuditPage';
import WatchlistPage from './pages/Watchlist/WatchlistPage';
import './App.css';

const isAdmin = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split('.')[1] ?? ''));
    return payload.role === 'admin';
  } catch {
    return false;
  }
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  return isAdmin() ? children : <Navigate to="/dashboard" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/tournaments" element={<TournamentsPage />} />
        <Route path="/teams" element={<TeamsPage />} />
        <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
        <Route path="/health" element={<AdminRoute><HealthPage /></AdminRoute>} />
        <Route path="/audit" element={<AdminRoute><AuditPage /></AdminRoute>} />
        <Route path="/watchlist" element={<WatchlistPage />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
