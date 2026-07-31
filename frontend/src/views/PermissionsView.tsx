import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { Shield, Plus, X, AlertCircle } from 'lucide-react';
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

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [actionsInput, setActionsInput] = useState('read, create, update, delete');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchGroups = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/permissions?limit=50');
      setGroups(response.data.data || []);
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const actions = actionsInput
      .split(',')
      .map((a) => a.trim())
      .filter((a) => a.length > 0);

    try {
      await apiClient.post('/permissions/groups', {
        name: groupName,
        description,
        actions,
      });

      setShowModal(false);
      setGroupName('');
      setDescription('');
      fetchGroups();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create permission group');
    } finally {
      setIsSubmitting(false);
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
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} /> Create Group
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          Loading permission groups...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {groups.map((group) => (
            <div key={group.id} className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
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

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '1rem' }}>
                {group.permissions.map((perm) => (
                  <span key={perm.id} className="badge badge-info" title={perm.description}>
                    {perm.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Create Permission Group</h2>
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

            <form onSubmit={handleCreateGroup}>
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
                  {isSubmitting ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
