import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import './Login.css';

export function Login() {
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const { login: fazerLogin } = useAuth();

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
              type="text"
              id="login"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="seu@login"
              disabled={carregando}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="senha">Senha</label>
            <input
              type="password"
              id="senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              disabled={carregando}
              required
            />
          </div>

          {erro && <div className="error-message">{erro}</div>}

          <button type="submit" disabled={carregando} className="login-button">
            {carregando ? 'Conectando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
