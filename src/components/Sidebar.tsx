import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, PlusCircle } from 'lucide-react';

const navItems = [
  { to: '/',             label: 'Dashboard',        Icon: LayoutDashboard },
  { to: '/orcamentos',   label: 'Orçamentos',        Icon: FileText },
  { to: '/orcamentos/novo', label: 'Novo Orçamento', Icon: PlusCircle },
];

export function Sidebar() {
  return (
    <aside className="w-60 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
        <img src="/logo.svg" alt="Logo" className="w-8 h-8" />
        <div>
          <p className="font-bold text-gray-800 text-sm leading-tight">OrçaPro</p>
          <p className="text-xs text-gray-400">Instalações</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-gray-100">
        <p className="text-xs text-gray-400">Protótipo v0.1</p>
      </div>
    </aside>
  );
}
