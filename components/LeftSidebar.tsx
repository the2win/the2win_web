'use client';
import Link from 'next/link';
import { useAuthStore } from '../lib/authStore';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export function LeftSidebar() {
  const { user, logout } = useAuthStore();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isAdmin = user && (user.email === 'admin@the2win.local');
  const navItems = [
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/games', label: 'Games', icon: '🎮' },
    ...(user ? [
      { href: '/dashboard', label: 'Dashboard', icon: '📊' },
      { href: '/games/crash', label: 'Crash Game', icon: '✈️' },
      { href: '/wallet/deposit', label: 'Deposit', icon: '💰' },
      { href: '/wallet/withdraw', label: 'Withdraw', icon: '💸' },
  { href: '/wallet/transactions', label: 'Transactions', icon: '📋' },
  ...(isAdmin ? [{ href: '/admin', label: 'Admin', icon: '🛠️' }] : []),
    ] : [])
  ];

  return (
    <aside className={`hidden md:block fixed left-0 top-0 h-full bg-slate-900/95 backdrop-blur border-r border-slate-800 transition-all duration-300 z-40 ${collapsed ? 'w-16' : 'w-64'}`}>
      <div className="flex flex-col h-full p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className={`font-bold bg-gradient-to-r from-indigo-400 to-cyan-300 text-transparent bg-clip-text transition-all duration-300 ${collapsed ? 'text-lg' : 'text-2xl'}`}>
            {collapsed ? 'T2W' : 'The2Win'}
          </Link>
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="text-slate-400 hover:text-white transition-colors duration-200 p-1"
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2">
          {navItems.map(item => (
            <SidebarNavItem 
              key={item.href} 
              href={item.href} 
              label={item.label} 
              icon={item.icon}
              active={pathname === item.href}
              collapsed={collapsed}
            />
          ))}
        </nav>

        {/* User Section */}
        {user && (
          <div className="border-t border-slate-800 pt-4 space-y-2">
            {!collapsed && (
              <div className="text-xs text-slate-400">
                <div className="truncate">Balance: <span className="text-indigo-300 font-semibold">{user.balance}</span></div>
                <div className="truncate">{user.email}</div>
              </div>
            )}
            <button 
              onClick={logout}
              className={`w-full text-left text-slate-400 hover:text-red-400 transition-colors duration-200 p-2 rounded hover:bg-slate-800/50 ${collapsed ? 'text-center' : ''}`}
            >
              {collapsed ? '⚡' : 'Logout'}
            </button>
          </div>
        )}

        {!user && (
          <div className="border-t border-slate-800 pt-4 space-y-2">
            <Link href="/auth/login" className={`block text-center bg-indigo-600 hover:bg-indigo-500 px-3 py-2 rounded transition-colors duration-200 ${collapsed ? 'text-xs' : ''}`}>
              {collapsed ? 'In' : 'Login'}
            </Link>
            {!collapsed && (
              <Link href="/auth/register" className="block text-center bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 px-3 py-2 rounded transition-colors duration-200">
                Register
              </Link>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

function SidebarNavItem({ href, label, icon, active, collapsed }: { href: string; label: string; icon: string; active: boolean; collapsed: boolean }) {
  return (
    <Link
      href={href}
      className={`group relative flex items-center rounded px-3 py-2 font-medium transition-all duration-300 overflow-hidden
        ${active ? 'text-white' : 'text-slate-400 hover:text-slate-200'}
      `}
    >
      <span className="text-lg mr-3">{icon}</span>
      {!collapsed && <span className="relative z-10">{label}</span>}
      <span className={`absolute inset-0 bg-gradient-to-r from-indigo-600/70 to-cyan-600/70 opacity-0 group-hover:opacity-60 transition-opacity duration-300 ${active ? 'opacity-100 animate-pulse-slow' : ''}`}></span>
      {active && <span className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-400 to-cyan-400 rounded-r shadow-md shadow-indigo-500/30" />}
    </Link>
  );
}