import { createContext, useCallback, useEffect, useState } from 'react';
import type { AuthContextType, Usuario, CultivadorMe } from '../types';
import { apiService } from '../services/api';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_TOKEN_KEY = 'authToken';
const AUTH_USUARIO_KEY = 'usuario';
const AUTH_CULTIVADOR_KEY = 'cultivador';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    const stored = localStorage.getItem(AUTH_USUARIO_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [isRestoring, setIsRestoring] = useState(true);
  const [cultivador, setCultivador] = useState<CultivadorMe | null>(() => {
    const stored = localStorage.getItem(AUTH_CULTIVADOR_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  const clearSession = useCallback(() => {
    setUsuario(null);
    setCultivador(null);
    apiService.clearToken();
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USUARIO_KEY);
    localStorage.removeItem(AUTH_CULTIVADOR_KEY);
  }, []);

  useEffect(() => {
    apiService.setUnauthorizedHandler(clearSession);
    return () => apiService.setUnauthorizedHandler(null);
  }, [clearSession]);

  useEffect(() => {
    const restore = async () => {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        setIsRestoring(false);
        return;
      }

      try {
        apiService.setToken(token);
        const me = await apiService.getUsuarioMe();
        const cultivadorMe = await apiService.getCultivadorMe();
        setUsuario(me);
        setCultivador(cultivadorMe);
        localStorage.setItem(AUTH_USUARIO_KEY, JSON.stringify(me));
        localStorage.setItem(AUTH_CULTIVADOR_KEY, JSON.stringify(cultivadorMe));
      } catch {
        clearSession();
      } finally {
        setIsRestoring(false);
      }
    };

    restore();
  }, [clearSession]);

  const login = useCallback(async (login: string, senha: string) => {
    try {
      const session = await apiService.login({ login, senha });
      apiService.setToken(session.token);

      const usuarioData = await apiService.getUsuarioMe();
      const cultivadorData = await apiService.getCultivadorMe();

      setUsuario(usuarioData);
      setCultivador(cultivadorData);
      localStorage.setItem(AUTH_TOKEN_KEY, session.token);
      localStorage.setItem(AUTH_USUARIO_KEY, JSON.stringify(usuarioData));
      localStorage.setItem(AUTH_CULTIVADOR_KEY, JSON.stringify(cultivadorData));
    } catch (error) {
      clearSession();
      throw error;
    }
  }, [clearSession]);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const isAuthenticated = usuario !== null;

  return (
    <AuthContext.Provider value={{ usuario, cultivador, login, logout, isAuthenticated, isRestoring }}>
      {children}
    </AuthContext.Provider>
  );
}
