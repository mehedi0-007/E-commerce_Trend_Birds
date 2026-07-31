import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { Shield, Plus, Edit2, Search, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Permission {
  id: string;
  name: string;
  description?: string;
}

interface PermissionGroup {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
}

export const PermissionsView: React.FC = () => {
  const { hasPermission } = useAuth();
  const [groups, setGroups] = useState<PermissionGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Pagination State
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal State (Create & Edit)
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<PermissionGroup | null>(null);
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [actionsInput, setActionsInput] = useState('read, create, update, delete');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchGroups = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');
      if (search) params.append('search', search);

      const response = await apiClient.get(`/permissions?${params.toString()}`);
      setGroups(response.data.data || []);
      setTotalPages(response.data.meta?.totalPages || 1);
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [page, search]);

  const handleOpenCreate = () => {
    setEditingGroup(null);
    setGroupName('');
    setDescription('');
    setActionsInput('read, create, update, delete');
    setError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (group: PermissionGroup) => {
    setEditingGroup(group);
    setGroupName(group.name);
    setDescription(group.description || '');
    // Extract actions from existing permission names (e.g. 'product:create' -> 'create')
    const extractedActions = group.permissions.map((p) => {
      const parts = p.name.split(':');
      return parts.length > 1 ? parts[1] : p.name;
    });
    setActionsInput(extractedActions.join(', '));
    setError(null);
    setShowModal(true);
  };

  const handleSubmitGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const actions = actionsInput
      .split(',')
      .map((a) => a.trim())
      .filter((a) => a.length > 0);

    try {
      if (editingGroup) {
        await apiClient.put(`/permissions/groups/${editingGroup.id}`, {
          name: groupName,
          description,
          actions,
        });
      } else {
        await apiClient.post('/permissions/groups', {
          name: groupName,
          description,
          actions,
        });
      }

      setShowModal(false);
      setGroupName('');
      setDescription('');
      fetchGroups();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save permission group');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePermission = async (perm: Permission) => {
    if (!window.confirm(`Delete permission "${perm.name}"?`)) return;
    try {
      await apiClient.delete(`/permissions/${perm.id}`);
      fetchGroups();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete permission');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Permission Groups</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            System permissions grouped by module domain
          </p>
        </div>

        {hasPermission('permission:create') && (
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={18} /> Create Group
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search permission groups or actions..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          Loading permission groups...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {groups.map((group) => (
            <div key={group.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: 'rgba(99, 102, 241, 0.15)',
                      color: '#6366f1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Shield size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{group.name}</h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {group.description || 'Module permission domain'}
                    </p>
                  </div>
                </div>

                {hasPermission('permission:update') && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleOpenEdit(group)}
                    title="Edit Group"
                  >
                    <Edit2 size={14} />
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '1rem' }}>
                {group.permissions.map((perm) => (
                  <span
                    key={perm.id}
                    className="badge badge-info"
                    title={perm.description}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    {perm.name}
                    {hasPermission('permission:delete') && (
                      <X
                        size={12}
                        style={{ cursor: 'pointer', opacity: 0.7 }}
                        onClick={() => handleDeletePermission(perm)}
                      />
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Page {page} of {totalPages}
        </span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <button
            className="btn btn-secondary btn-sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                {editingGroup ? `Edit Group: ${editingGroup.name}` : 'Create Permission Group'}
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

            <form onSubmit={handleSubmitGroup}>
              <div className="form-group">
                <label className="form-label">Module Group Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Order, Report"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Module permission descriptions"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Actions (Comma-separated)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="watch, read, create, update, delete"
                  value={actionsInput}
                  onChange={(e) => setActionsInput(e.target.value)}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Will generate permissions as: groupName:action
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting
                    ? 'Saving...'
                    : editingGroup
                    ? 'Update Group'
                    : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
