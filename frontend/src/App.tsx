import { useState, useEffect } from 'react';
import Register from './pages/Register';
import Chat from './pages/Chat';

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('session_token');
    const name = localStorage.getItem('user_name');
    const business = localStorage.getItem('business_name');
    if (saved && name && business) {
      setToken(saved);
      setUserName(name);
      setBusinessName(business);
    }
    setReady(true);
  }, []);

  const handleLogin = (t: string, name: string, business: string) => {
    // Limpia cualquier sesión anterior antes de guardar la nueva
    localStorage.clear();
    localStorage.setItem('session_token', t);
    localStorage.setItem('user_name', name);
    localStorage.setItem('business_name', business);
    setToken(t);
    setUserName(name);
    setBusinessName(business);
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken(null);
    setUserName('');
    setBusinessName('');
  };

  if (!ready) return null;

  if (!token) {
    return <Register onSuccess={handleLogin} />;
  }

  return (
    <Chat
      token={token}
      userName={userName}
      businessName={businessName}
      onLogout={handleLogout}
    />
  );
}
