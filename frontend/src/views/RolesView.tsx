import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { Plus, Edit2, Trash2, CheckSquare, Square, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Role {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  userCount: number;
  permissionIds?: string[];
  permissions?: Array<{ id: string; name: string }>;
}

interface PermissionGroup {
  id: string;
  name: string;
  permissions: Array<{ id: string; name: string; description?: string }>;
}

export const RolesView: React.FC = () => {
  const { hasPermission, refetchSession } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleName, setRoleName] = useState('');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);
  const [grantAll, setGrantAll] = useState(false);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRolesAndPermissions = async () => {
    setIsLoading(true);
    try {
      const [rolesRes, groupsRes] = await Promise.all([
        apiClient.get('/roles?limit=50'),
        apiClient.get('/permissions?limit=50'),
      ]);
      setRoles(rolesRes.data.data || []);
      setPermissionGroups(groupsRes.data.data || []);
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRolesAndPermissions();
  }, []);

  const handleOpenCreate = () => {
    setEditingRole(null);
    setRoleName('');
    setDescription('');
    setActive(true);
    setGrantAll(false);
    setSelectedPermissionIds([]);
    setError(null);
    setShowModal(true);
  };

  const handleOpenEdit = async (role: Role) => {
    setIsSubmitting(true);
    try {
      const res = await apiClient.get(`/roles/${role.id}`);
      const detailedRole = res.data?.data || res.data;
      setEditingRole(detailedRole);
      setRoleName(detailedRole.name);
      setDescription(detailedRole.description || '');
      setActive(detailedRole.active);
      setGrantAll(false);
      setSelectedPermissionIds(detailedRole.permissionIds || []);
      setError(null);
      setShowModal(true);
    } catch {
      setError('Failed to fetch role details');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRole = async (role: Role) => {
    if (!window.confirm(`Are you sure you want to delete role "${role.name}"?`)) return;
    try {
      await apiClient.delete(`/roles/${role.id}`);
      fetchRolesAndPermissions();
      refetchSession();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete role');
    }
  };

  const togglePermission = (id: string) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const toggleGroupAll = (group: PermissionGroup) => {
    const groupPermIds = group.permissions.map((p) => p.id);
    const allSelected = groupPermIds.every((id) => selectedPermissionIds.includes(id));

    if (allSelected) {
      setSelectedPermissionIds((prev) => prev.filter((id) => !groupPermIds.includes(id)));
    } else {
      setSelectedPermissionIds((prev) => Array.from(new Set([...prev, ...groupPermIds])));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload = {
      name: roleName,
      description,
      active,
      grantAll,
      ...(!grantAll && { permissionIds: selectedPermissionIds }),
    };

    try {
      if (editingRole) {
        await apiClient.patch(`/roles/${editingRole.id}`, payload);
      } else {
        await apiClient.post('/roles', payload);
      }
      setShowModal(false);
      fetchRolesAndPermissions();
      refetchSession();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save role');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Roles Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Define roles and configure permission sets
          </p>
        </div>

        {hasPermission('role:create') && (
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={18} /> Create Role
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          Loading roles...
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Role Name</th>
                <th>Description</th>
                <th>Users Assigned</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{role.name}</td>
                  <td>{role.description || '-'}</td>
                  <td>
                    <span className="badge badge-info">{role.userCount} Active Users</span>
                  </td>
                  <td>
                    {role.active ? (
                      <span className="badge badge-success">Active</span>
                    ) : (
                      <span className="badge badge-danger">Inactive</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {hasPermission('role:update') && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEdit(role)}
                          title="Edit Role"
                        >
                          <Edit2 size={14} /> Edit
                        </button>
                      )}
                      {hasPermission('role:delete') && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteRole(role)}
                          title="Delete Role"
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

      {/* Role Form Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '800px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                {editingRole ? `Edit Role: ${editingRole.name}` : 'Create New Role'}
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Role Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Content Manager"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Role responsibilities"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <input
                  type="checkbox"
                  id="roleActiveCheck"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#6366f1' }}
                />
                <label htmlFor="roleActiveCheck" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>
                  Role Active Status
                </label>
              </div>

              {/* Shortcut: Grant All Permissions */}
              <div
                className="card"
                style={{
                  background: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: '#a5b4fc' }}>Grant All Permissions Shortcut</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Automatically grant all current and future permissions (Super Admin)
                  </div>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={grantAll}
                    onChange={(e) => setGrantAll(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#6366f1' }}
                  />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Enable Grant All</span>
                </label>
              </div>

              {/* Module-by-Action Permission Grid */}
              {!grantAll && (
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                    Module-by-Action Permissions Matrix
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {permissionGroups.map((group) => {
                      const groupPermIds = group.permissions.map((p) => p.id);
                      const allSelected =
                        groupPermIds.length > 0 &&
                        groupPermIds.every((id) => selectedPermissionIds.includes(id));

                      return (
                        <div
                          key={group.id}
                          style={{
                            background: 'rgba(0, 0, 0, 0.2)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            padding: '1rem',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '0.75rem',
                              borderBottom: '1px solid var(--border-color)',
                              paddingBottom: '0.5rem',
                            }}
                          >
                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{group.name} Module</span>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => toggleGroupAll(group)}
                            >
                              {allSelected ? <CheckSquare size={14} /> : <Square size={14} />} Select All
                            </button>
                          </div>

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                            {group.permissions.map((perm) => {
                              const isChecked = selectedPermissionIds.includes(perm.id);
                              return (
                                <label
                                  key={perm.id}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    padding: '0.35rem 0.65rem',
                                    borderRadius: 'var(--radius-sm)',
                                    background: isChecked ? 'var(--accent-glow)' : 'rgba(255,255,255,0.03)',
                                    border: isChecked ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid var(--border-color)',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => togglePermission(perm.id)}
                                    style={{ accentColor: '#6366f1' }}
                                  />
                                  <span>{perm.name.split(':')[1] || perm.name}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingRole ? 'Update Role' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
