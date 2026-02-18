import { createContext, useState, useCallback } from 'react';
import type { AuthContextType, Usuario } from '../types';
import { apiService } from '../services/api';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    const stored = localStorage.getItem('usuario');
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async (login: string, senha: string) => {
    try {
      console.log(`🔄 Configurando credenciais para: ${login}`);
      apiService.setCredentials(login, senha);
      
      // Faz uma chamada para validar as credenciais
      console.log('📡 Validando credenciais na API...');
      const response = await apiService.getPlantasListagem(0, 1);
      
      console.log('✅ Credenciais válidas! Criando sessão...');
      const usuarioData: Usuario = {
        id: 1, // Você pode buscar o ID real de um endpoint /me se houver
        nome: login,
        login: login,
      };
      
      setUsuario(usuarioData);
      localStorage.setItem('usuario', JSON.stringify(usuarioData));
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
    apiService.clearCredentials();
    localStorage.removeItem('usuario');
    localStorage.removeItem('credentials');
  }, []);

  // Restaurar credenciais ao carregar
  const isAuthenticated = usuario !== null;

  return (
    <AuthContext.Provider value={{ usuario, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}
