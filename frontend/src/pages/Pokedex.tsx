import { useAuth } from '../hooks/useAuth';
import { PokedexLayout } from '../components/PokedexLayout';

export function Pokedex() {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="relative">
      {/* Logout button in corner */}
      <button
        onClick={handleLogout}
        className="fixed top-4 right-4 z-50 bg-[#E23A3A] hover:bg-[#c92a2a] text-white px-4 py-2 rounded-lg font-black uppercase tracking-wide transition-all shadow-lg hover:shadow-[0_0_15px_rgba(226,58,58,0.3)]"
      >
        Sair
      </button>

      <PokedexLayout />
    </div>
  );
}
