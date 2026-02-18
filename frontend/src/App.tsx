import { useState, useEffect } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { Login } from './pages/Login';
import { Pokedex } from './pages/Pokedex';
import { apiService } from './services/api';
import './App.css';

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Tentar restaurar sessão
    const credentials = localStorage.getItem('credentials');
    if (credentials) {
      const { login, senha } = JSON.parse(credentials);
      apiService.setCredentials(login, senha);
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="loading-app">Carregando...</div>;
  }

  return (
    <AuthContext.Consumer>
      {(context) => (
        isAuthenticated || context?.isAuthenticated ? <Pokedex /> : <Login />
      )}
    </AuthContext.Consumer>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
