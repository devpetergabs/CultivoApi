import React, { useState } from 'react';

interface UserRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (data: RegisterFormData) => void;
  loading?: boolean;
  error?: string | null;
}

export interface RegisterFormData {
  nome: string;
  login: string;
  senha: string;
}

const UserRegisterModal: React.FC<UserRegisterModalProps> = ({ isOpen, onClose, onRegister, loading, error }) => {
  const [form, setForm] = useState<RegisterFormData>({
    nome: '',
    login: '',
    senha: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRegister(form);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
        <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={onClose}>&times;</button>
        <h2 className="text-xl font-bold mb-4">Cadastro de Usuário</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Nome</label>
            <input name="nome" value={form.nome} onChange={handleChange} required className="w-full border rounded px-2 py-1" />
          </div>
          <div>
            <label className="block text-sm font-medium">Login</label>
            <input name="login" value={form.login} onChange={handleChange} required className="w-full border rounded px-2 py-1" />
          </div>
          <div>
            <label className="block text-sm font-medium">Senha</label>
            <input name="senha" type="password" value={form.senha} onChange={handleChange} required className="w-full border rounded px-2 py-1" />
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-semibold" disabled={loading}>{loading ? 'Cadastrando...' : 'Cadastrar'}</button>
        </form>
      </div>
    </div>
  );
};

export default UserRegisterModal;
