import { createContext, useEffect, useState, useCallback } from 'react';
import type { AuthContextType, Usuario, CultivadorMe } from '../types';
import { apiService } from '../services/api';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    const stored = localStorage.getItem('usuario');
    return stored ? JSON.parse(stored) : null;
  });
  const [isRestoring, setIsRestoring] = useState(true);
  const [cultivador, setCultivador] = useState<CultivadorMe | null>(() => {
    const stored = localStorage.getItem('cultivador');
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    const restore = async () => {
      const credentials = localStorage.getItem('credentials');
      if (!credentials) {
        setIsRestoring(false);
        return;
      }

      try {
        const { login, senha } = JSON.parse(credentials);
        apiService.setCredentials(login, senha);
        const me = await apiService.getUsuarioMe();
        const cultivadorMe = await apiService.getCultivadorMe();
        setUsuario(me);
        setCultivador(cultivadorMe);
        localStorage.setItem('usuario', JSON.stringify(me));
        localStorage.setItem('cultivador', JSON.stringify(cultivadorMe));
      } catch {
        apiService.clearCredentials();
        localStorage.removeItem('credentials');
        localStorage.removeItem('usuario');
        localStorage.removeItem('cultivador');
        setUsuario(null);
        setCultivador(null);
      } finally {
        setIsRestoring(false);
      }
    };

    restore();
  }, []);

  const login = useCallback(async (login: string, senha: string) => {
    try {
      console.log(`🔄 Configurando credenciais para: ${login}`);
      apiService.setCredentials(login, senha);
      
      console.log('📡 Validando credenciais na API (/usuarios/me)...');
      const usuarioData = await apiService.getUsuarioMe();
      const cultivadorData = await apiService.getCultivadorMe();
      console.log('✅ Credenciais válidas! Criando sessão...');
      
      setUsuario(usuarioData);
      setCultivador(cultivadorData);
      localStorage.setItem('usuario', JSON.stringify(usuarioData));
      localStorage.setItem('cultivador', JSON.stringify(cultivadorData));
      localStorage.setItem('credentials', JSON.stringify({ login, senha }));
      console.log(`✅ Sessão criada para: ${login}`);
    } catch (error: any) {
      console.error('❌ Falha na autenticação:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        mensagem: error.message,
        erro: error
      });
      apiService.clearCredentials();
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    setUsuario(null);
    setCultivador(null);
    apiService.clearCredentials();
    localStorage.removeItem('usuario');
    localStorage.removeItem('credentials');
    localStorage.removeItem('cultivador');
  }, []);

  // Restaurar credenciais ao carregar
  const isAuthenticated = usuario !== null;

  return (
    <AuthContext.Provider value={{ usuario, cultivador, login, logout, isAuthenticated, isRestoring }}>
      {children}
    </AuthContext.Provider>
  );
}
