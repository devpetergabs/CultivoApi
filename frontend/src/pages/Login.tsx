import { useState } from 'react';
import UserRegisterModal, { RegisterFormData } from '../components/UserRegisterModal';
import { apiService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import './Login.css';

export function Login() {
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const { login: fazerLogin } = useAuth();
  // Placeholder for registration logic, to be implemented
  const handleRegister = async (data: RegisterFormData) => {
    setRegisterLoading(true);
    setRegisterError(null);
    try {
      await apiService.registerUsuario({
        nome: data.nome,
        login: data.login,
        senha: data.senha,
        isCultivador: data.isCultivador,
        telefone: data.telefone,
      });
      setRegisterOpen(false);
      setErro('Cadastro realizado com sucesso! Faça login.');
    } catch (err: any) {
      if (err?.response?.status === 400) {
        setRegisterError('Usuário já existe ou dados inválidos.');
      } else {
        setRegisterError('Erro ao cadastrar. Tente novamente.');
      }
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    // Validações iniciais
    if (!login.trim()) {
      setErro('❌ Campo "Login" é obrigatório');
      setCarregando(false);
      return;
    }

    if (!senha.trim()) {
      setErro('❌ Campo "Senha" é obrigatório');
      setCarregando(false);
      return;
    }

    try {
      console.log(`🔐 Tentando autenticar com login: ${login}`);
      await fazerLogin(login, senha);
      console.log('✅ Login realizado com sucesso!');
    } catch (err: any) {
      const statusCode = err.response?.status;
      const mensagemErro = err.response?.data?.message || err.message;
      
      console.error(`❌ Erro de autenticação:`, {
        status: statusCode,
        mensagem: mensagemErro,
        erro: err
      });

      if (statusCode === 401) {
        setErro('❌ Login ou senha inválidos. Verifique suas credenciais.');
      } else if (statusCode === 400) {
        setErro('❌ Dados inválidos. Verifique login e senha.');
      } else if (statusCode === 0 || !navigator.onLine) {
        setErro('❌ Erro de conexão. Verifique se a API está rodando em http://localhost:8080');
      } else {
        setErro(`❌ Erro ao fazer login: ${mensagemErro || 'Tente novamente'}`);
      }
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>🌱 Cultivo Inteligente</h1>
          <p>Gerenciar suas plantas</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="login">Login</label>
            <input
              type="email"
              id="login"
              name="username"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              onInput={(e) => setLogin((e.currentTarget as HTMLInputElement).value)}
              placeholder="seu@login"
              autoComplete="username"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              disabled={carregando}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="senha">Senha</label>
            <input
              type="password"
              id="senha"
              name="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              onInput={(e) => setSenha((e.currentTarget as HTMLInputElement).value)}
              placeholder="********"
              autoComplete="current-password"
              disabled={carregando}
              required
            />
          </div>

          {erro && <div className="error-message">{erro}</div>}

          <button type="submit" disabled={carregando} className="login-button">
            {carregando ? 'Conectando...' : 'Entrar'}
          </button>
        </form>
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <button type="button" className="register-link" onClick={() => setRegisterOpen(true)}>
            Não tem conta? Cadastre-se
          </button>
        </div>
        <UserRegisterModal
          isOpen={registerOpen}
          onClose={() => setRegisterOpen(false)}
          onRegister={handleRegister}
          loading={registerLoading}
          error={registerError}
        />
      </div>
    </div>
  );
}
