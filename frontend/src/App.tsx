import { useState, useEffect } from 'react';
import Register from './pages/Register';
import Chat from './pages/Chat';
import BusinessProfile from './pages/BusinessProfile';

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<'chat' | 'profile'>('chat');

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
    localStorage.clear();
    localStorage.setItem('session_token', t);
    localStorage.setItem('user_name', name);
    localStorage.setItem('business_name', business);

    setToken(t);
    setUserName(name);
    setBusinessName(business);
    setScreen('chat');
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken(null);
    setUserName('');
    setBusinessName('');
    setScreen('chat');
  };

  if (!ready) return null;

  if (!token) {
    return <Register onSuccess={handleLogin} />;
  }

  if (screen === 'profile') {
    return (
      <BusinessProfile
        token={token}
        businessName={businessName}
        onBack={() => setScreen('chat')}
      />
    );
  }

  return (
    <Chat
      token={token}
      userName={userName}
      businessName={businessName}
      onLogout={handleLogout}
      onOpenProfile={() => setScreen('profile')}
    />
  );
}