import { useContext } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { Login } from './pages/Login';
import { Pokedex } from './pages/Pokedex';
import { AppToastCenter } from './components/AppToastCenter';
import './App.css';

function AppContent() {
  const context = useContext(AuthContext);
  const isRestoring = context?.isRestoring ?? true;
  const isAuthenticated = context?.isAuthenticated ?? false;

  if (isRestoring) return <div className="loading-app">Carregando...</div>;
  return isAuthenticated ? <Pokedex /> : <Login />;
}

function App() {
  return (
    <AuthProvider>
      <AppToastCenter />
      <AppContent />
    </AuthProvider>
  );
}

export default App;
