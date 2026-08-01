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
  const [selectedStandardActions, setSelectedStandardActions] = useState<string[]>(['read', 'create', 'update', 'delete']);
  const [customActions, setCustomActions] = useState<string[]>([]);
  const [customActionInput, setCustomActionInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const STANDARD_ACTIONS = ['read', 'create', 'update', 'delete', 'watch', 'upload', 'write', 'approve', 'status'];

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
    setSelectedStandardActions(['read', 'create', 'update', 'delete']);
    setCustomActions([]);
    setCustomActionInput('');
    setError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (group: PermissionGroup) => {
    setEditingGroup(group);
    setGroupName(group.name);
    setDescription(group.description || '');
    
    const extractedActions = group.permissions.map((p) => {
      const parts = p.name.split(':');
      return (parts.length > 1 ? parts[1] : p.name).toLowerCase();
    });

    const standard = extractedActions.filter((a) => STANDARD_ACTIONS.includes(a));
    const custom = extractedActions.filter((a) => !STANDARD_ACTIONS.includes(a));

    setSelectedStandardActions(Array.from(new Set(standard)));
    setCustomActions(Array.from(new Set(custom)));
    setCustomActionInput('');
    setError(null);
    setShowModal(true);
  };

  const toggleStandardAction = (action: string) => {
    setSelectedStandardActions((prev) =>
      prev.includes(action) ? prev.filter((a) => a !== action) : [...prev, action]
    );
  };

  const handleAddCustomAction = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customActionInput.trim().toLowerCase();
    if (!trimmed) return;
    if (!customActions.includes(trimmed) && !selectedStandardActions.includes(trimmed)) {
      setCustomActions((prev) => [...prev, trimmed]);
    }
    setCustomActionInput('');
  };

  const handleRemoveCustomAction = (action: string) => {
    setCustomActions((prev) => prev.filter((a) => a !== action));
  };

  const handleSubmitGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const allActions = Array.from(new Set([...selectedStandardActions, ...customActions]));
    if (allActions.length === 0) {
      setError('Please select or enter at least one action for this group.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingGroup) {
        await apiClient.put(`/permissions/groups/${editingGroup.id}`, {
          name: groupName,
          description,
          actions: allActions,
        });
      } else {
        await apiClient.post('/permissions/groups', {
          name: groupName,
          description,
          actions: allActions,
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

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>
                  Standard Module Actions
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
                  {STANDARD_ACTIONS.map((action) => {
                    const isChecked = selectedStandardActions.includes(action);
                    return (
                      <label
                        key={action}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.4rem 0.6rem',
                          borderRadius: 'var(--radius-sm)',
                          background: isChecked ? 'var(--accent-glow)' : 'rgba(255, 255, 255, 0.03)',
                          border: isChecked ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid var(--border-color)',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          textTransform: 'capitalize',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleStandardAction(action)}
                          style={{ accentColor: '#6366f1' }}
                        />
                        <span>{action}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Custom Actions (Optional)</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. publish, export, archive"
                    value={customActionInput}
                    onChange={(e) => setCustomActionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomAction();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => handleAddCustomAction()}
                  >
                    + Add
                  </button>
                </div>

                {customActions.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                    {customActions.map((action) => (
                      <span
                        key={action}
                        className="badge badge-info"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.35rem 0.6rem' }}
                      >
                        {action}
                        <X
                          size={12}
                          style={{ cursor: 'pointer', opacity: 0.8 }}
                          onClick={() => handleRemoveCustomAction(action)}
                        />
                      </span>
                    ))}
                  </div>
                )}
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.4rem' }}>
                  Will generate permissions as: <strong>{groupName.toLowerCase() || 'group'}:action</strong>
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
