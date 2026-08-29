import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import Search from './pages/Search';
import Profile from './pages/Profile';
import PublicProfile from './pages/PublicProfile';
import Chat from './pages/Chat';
import VerifyEmail from './pages/VerifyEmail';
import ResetPassword from './pages/ResetPassword';
import './assets/css/global.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <NotificationProvider>
            <Routes>
              {/* ROUTES PUBLIQUES (NON CONNECTÉ) */}
              <Route path="/login" element={<Login />} />
              <Route path="/verify/:token" element={<VerifyEmail />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              
              {/* ROUTES PRIVÉES (CONNECTÉ) */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<MainLayout />}>
                  <Route index element={<Navigate to="/search" replace />} />
                  <Route path="search" element={<Search />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="profile/:id" element={<PublicProfile />} />
                  <Route path="user/:id" element={<PublicProfile />} />
                  <Route path="chat" element={<Chat />} />
                </Route>
              </Route>
            </Routes>
          </NotificationProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;