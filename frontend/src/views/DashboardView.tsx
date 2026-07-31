import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { Package, Users, FolderTree, Tag, ShieldCheck } from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    products: 0,
    categories: 0,
    brands: 0,
    users: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [prodRes, catRes, brandRes, userRes] = await Promise.allSettled([
          apiClient.get('/products?limit=1'),
          apiClient.get('/categories?limit=1'),
          apiClient.get('/brands?limit=1'),
          apiClient.get('/users?limit=1'),
        ]);

        setStats({
          products: prodRes.status === 'fulfilled' ? prodRes.value.data.meta?.total || 0 : 0,
          categories: catRes.status === 'fulfilled' ? catRes.value.data.meta?.total || 0 : 0,
          brands: brandRes.status === 'fulfilled' ? brandRes.value.data.meta?.total || 0 : 0,
          users: userRes.status === 'fulfilled' ? userRes.value.data.meta?.total || 0 : 0,
        });
      } catch {
      }
    };

    fetchStats();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>
          Welcome back, {user?.name || user?.email} 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Overview of Trends Bird e-commerce backend status and active session permissions
        </p>
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(99, 102, 241, 0.15)',
              color: '#6366f1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Package size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Products</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.products}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FolderTree size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Categories</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.categories}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Tag size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Brands</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.brands}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(59, 130, 246, 0.15)',
              color: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Users</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.users}</div>
          </div>
        </div>
      </div>

      {/* Active Session Info Card */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <ShieldCheck size={20} style={{ color: '#6366f1' }} />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Active Session Details</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>User Email:</span>
            <div style={{ fontWeight: 500 }}>{user?.email}</div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Assigned Role:</span>
            <div>
              <span className="badge badge-info">{user?.role?.name}</span>
            </div>
          </div>
        </div>

        <div>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>
            Granted Permissions ({user?.userPermissions?.length || 0}):
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {user?.userPermissions?.map((perm) => (
              <span key={perm} className="badge badge-success">
                {perm}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
