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
import './assets/css/global.css';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <NotificationProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              
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
          </BrowserRouter>
        </NotificationProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
