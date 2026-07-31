import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { Plus, Edit2, Trash2, Search, Filter, X, AlertCircle, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface User {
  id: string;
  name?: string;
  email: string;
  phone?: string;
  gender?: string;
  active: boolean;
  roleId: string;
  role: { id: string; name: string };
  createdAt: string;
}

interface Role {
  id: string;
  name: string;
}

export const UsersView: React.FC = () => {
  const { user: currentUser, hasPermission, refetchSession } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Form Modal
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState('');
  const [phone, setPhone] = useState('');
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsersAndRoles = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');
      if (search) params.append('search', search);
      if (roleFilter) params.append('roleId', roleFilter);
      if (activeFilter !== '') params.append('active', activeFilter);

      const [usersRes, rolesRes] = await Promise.all([
        apiClient.get(`/users?${params.toString()}`),
        apiClient.get('/roles?limit=50'),
      ]);

      setUsers(usersRes.data.data || []);
      setTotalPages(usersRes.data.meta?.totalPages || 1);
      setRoles(rolesRes.data.data || []);
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndRoles();
  }, [page, search, roleFilter, activeFilter]);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setPassword('');
    setRoleId(roles[0]?.id || '');
    setPhone('');
    setActive(true);
    setError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setName(user.name || '');
    setEmail(user.email);
    setPassword('');
    setRoleId(user.roleId);
    setPhone(user.phone || '');
    setActive(user.active);
    setError(null);
    setShowModal(true);
  };

  const handleDeleteUser = async (user: User) => {
    if (user.id === currentUser?.id) {
      alert('You cannot delete your own account');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete user "${user.name || user.email}"?`)) return;

    try {
      await apiClient.delete(`/users/${user.id}`);
      fetchUsersAndRoles();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload: any = {
      name,
      email,
      roleId,
      phone,
      active,
    };
    if (password) payload.password = password;

    try {
      if (editingUser) {
        await apiClient.patch(`/users/${editingUser.id}`, payload);
      } else {
        if (!password) {
          setError('Password is required for new users');
          setIsSubmitting(false);
          return;
        }
        await apiClient.post('/users', payload);
      }

      setShowModal(false);
      fetchUsersAndRoles();
      if (editingUser?.id === currentUser?.id) {
        refetchSession();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save user');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Users Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            System accounts, roles, and status control
          </p>
        </div>

        {hasPermission('user:create') && (
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={18} /> Create User
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div
        className="card"
        style={{
          marginBottom: '1.5rem',
          display: 'grid',
          gridTemplateColumns: '1fr 200px 180px',
          gap: '1rem',
        }}
      >
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>

        <select
          className="form-control"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">All Roles</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>

        <select
          className="form-control"
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="true">Active Only</option>
          <option value="false">Inactive Only</option>
        </select>
      </div>

      {isLoading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          Loading users...
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name || 'Unnamed User'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.email}</div>
                  </td>
                  <td>
                    <span className="badge badge-info">{u.role?.name}</span>
                  </td>
                  <td>{u.phone || '-'}</td>
                  <td>
                    {u.active ? (
                      <span className="badge badge-success">Active</span>
                    ) : (
                      <span className="badge badge-danger">Inactive</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {hasPermission('user:update') && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEdit(u)}
                          title="Edit User"
                        >
                          <Edit2 size={14} /> Edit
                        </button>
                      )}
                      {hasPermission('user:delete') && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteUser(u)}
                          disabled={u.id === currentUser?.id}
                          title={u.id === currentUser?.id ? 'Cannot delete your own account' : 'Delete User'}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                {editingUser ? `Edit User: ${editingUser.name || editingUser.email}` : 'Create New User'}
              </h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="alert-banner alert-danger">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Password {editingUser && '(Leave blank to keep unchanged)'}
                </label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={!editingUser}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Assign Role</label>
                <select
                  className="form-control"
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  disabled={editingUser?.id === currentUser?.id}
                  required
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                {editingUser?.id === currentUser?.id && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    You cannot change your own role
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Phone (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="+1234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  disabled={editingUser?.id === currentUser?.id}
                  style={{ width: '18px', height: '18px', accentColor: '#6366f1' }}
                />
                <label htmlFor="activeCheck" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>
                  Account Active Status
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
