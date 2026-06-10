// packages/dashboard/src/components/Navbar.tsx
import { useAuth, useLogout } from '../hooks/useAuth';

export function Navbar() {
  const { data: user } = useAuth();
  const logout = useLogout();

  return (
    <nav className="border-b border-gray-800 px-8 py-4 flex items-center justify-between">
      <span className="text-white font-semibold">▲ Vercel Clone</span>
      {user && (
        <div className="flex items-center gap-4">
          <img
            src={user.avatarUrl}
            alt={user.username}
            className="w-8 h-8 rounded-full"
          />
          <span className="text-gray-300 text-sm">{user.username}</span>
          <button
            onClick={() => logout.mutate()}
            className="text-gray-500 hover:text-white text-sm transition-colors"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}