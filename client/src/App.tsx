import { BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import LoginPage from './pages/Login/LoginPage';
import RegisterPage from './pages/Register/RegisterPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import TournamentsPage from './pages/Tournaments/TournamentsPage';
import TeamsPage from './pages/Teams/TeamsPage';
import AdminPage from './pages/Admin/AdminPage';

import './App.css';

function App(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage/>}/>
        <Route path="/register" element={<RegisterPage/>}/>
        <Route path="/dashboard" element={<DashboardPage/>}/>
        <Route path='/tournaments' element={<TournamentsPage/>}/>
        <Route path='/teams' element={<TeamsPage/>}/>
        <Route path='/admin' element={<AdminPage/>}/>
        <Route path="*" element={<Navigate to ="/login"/>}/>
      </Routes>
    </BrowserRouter>
    
  );
}

export default App;