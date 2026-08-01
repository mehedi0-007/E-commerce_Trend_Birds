import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Shield,
  UserCheck,
  Users,
  Image as ImageIcon,
  FolderTree,
  Tag,
  Sliders,
  Package,
  LogOut,
  Sparkles,
} from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { user, logout, canWatch } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/', module: 'dashboard', icon: LayoutDashboard },
    { name: 'Products', path: '/products', module: 'product', icon: Package },
    { name: 'Categories', path: '/categories', module: 'category', icon: FolderTree },
    { name: 'Brands', path: '/brands', module: 'brand', icon: Tag },
    { name: 'Attributes', path: '/attributes', module: 'attribute', icon: Sliders },
    { name: 'Media Library', path: '/media', module: 'media', icon: ImageIcon },
  ];

  const systemNavItems = [
    { name: 'Users', path: '/users', module: 'user', icon: Users },
    { name: 'Roles', path: '/roles', module: 'role', icon: UserCheck },
    { name: 'Permissions', path: '/permissions', module: 'permission', icon: Shield },
  ];

  const visibleNavItems = navItems.filter((item) => canWatch(item.module));
  const visibleSystemItems = systemNavItems.filter((item) => canWatch(item.module));

  const renderNavItem = (item: any) => {
    const Icon = item.icon;
    return (
      <NavLink
        key={item.path}
        to={item.path}
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        end={item.path === '/'}
      >
        <Icon size={18} />
        <span>{item.name}</span>
      </NavLink>
    );
  };

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <Sparkles size={24} style={{ color: '#6366f1' }} />
          <span className="sidebar-brand">Trends Bird</span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-group-title">Catalog & Content</div>
          {visibleNavItems.map(renderNavItem)}

          {visibleSystemItems.length > 0 && (
            <>
              <div className="nav-group-title" style={{ marginTop: '2rem' }}>System & Security</div>
              {visibleSystemItems.map(renderNavItem)}
            </>
          )}
        </nav>
      </aside>

      {/* Main Layout */}
      <div className="main-layout">
        {/* Topbar */}
        <header className="topbar">
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Trends Bird Admin Panel
          </div>

          <div className="user-profile">
            <div className="avatar-chip">
              {user?.name ? user.name.charAt(0).toUpperCase() : user?.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                {user?.name || user?.email}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {user?.role?.name || 'User'}
              </div>
            </div>

            <button
              className="btn btn-secondary btn-sm"
              onClick={logout}
              title="Sign Out"
              style={{ marginLeft: '1rem' }}
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="content-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
