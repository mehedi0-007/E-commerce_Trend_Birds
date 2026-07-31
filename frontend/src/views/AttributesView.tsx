import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { Sliders, Plus, Edit2, Trash2, X, AlertCircle, Tag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AttributeValue {
  id: string;
  name: string;
  value: string;
  meta?: any;
  sortOrder: number;
}

interface Attribute {
  id: string;
  name: string;
  code: string;
  type: string;
  description?: string;
  values: AttributeValue[];
}

export const AttributesView: React.FC = () => {
  const { hasPermission } = useAuth();
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form Modal
  const [showModal, setShowModal] = useState(false);
  const [editingAttr, setEditingAttr] = useState<Attribute | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState('dropdown');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Value Modal
  const [showValModal, setShowValModal] = useState(false);
  const [selectedAttrForVal, setSelectedAttrForVal] = useState<Attribute | null>(null);
  const [valName, setValName] = useState('');
  const [valValue, setValValue] = useState('');

  const fetchAttributes = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/attributes?limit=50');
      setAttributes(res.data.data || []);
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttributes();
  }, []);

  const handleOpenCreate = () => {
    setEditingAttr(null);
    setName('');
    setCode('');
    setType('dropdown');
    setDescription('');
    setError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (attr: Attribute) => {
    setEditingAttr(attr);
    setName(attr.name);
    setCode(attr.code);
    setType(attr.type);
    setDescription(attr.description || '');
    setError(null);
    setShowModal(true);
  };

  const handleDeleteAttr = async (attr: Attribute) => {
    if (!window.confirm(`Are you sure you want to delete attribute "${attr.name}"?`)) return;

    try {
      await apiClient.delete(`/attributes/${attr.id}`);
      fetchAttributes();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete attribute');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload = { name, code, type, description };

    try {
      if (editingAttr) {
        await apiClient.patch(`/attributes/${editingAttr.id}`, payload);
      } else {
        await apiClient.post('/attributes', payload);
      }

      setShowModal(false);
      fetchAttributes();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save attribute');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddValueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAttrForVal) return;

    try {
      await apiClient.post(`/attributes/${selectedAttrForVal.id}/values`, {
        name: valName,
        value: valValue || valName,
      });

      setShowValModal(false);
      setValName('');
      setValValue('');
      fetchAttributes();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add attribute value');
    }
  };

  const handleDeleteValue = async (attrId: string, valId: string) => {
    if (!window.confirm('Delete this attribute value?')) return;
    try {
      await apiClient.delete(`/attributes/${attrId}/values/${valId}`);
      fetchAttributes();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete attribute value');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Product Attributes</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Variant attributes (Size, Colour, Material), types, and value tags
          </p>
        </div>

        {hasPermission('attribute:create') && (
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={18} /> Create Attribute
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          Loading attributes...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {attributes.map((attr) => (
            <div key={attr.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: 'rgba(99,102,241,0.15)',
                      color: '#6366f1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Sliders size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{attr.name}</h3>
                    <code style={{ fontSize: '0.75rem', color: '#a5b4fc' }}>code: {attr.code}</code>
                  </div>
                </div>

                <span className="badge badge-info">{attr.type}</span>
              </div>

              {/* Value Tags */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Values ({attr.values?.length || 0})</span>
                  {hasPermission('attribute:update') && (
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                      onClick={() => {
                        setSelectedAttrForVal(attr);
                        setShowValModal(true);
                      }}
                    >
                      <Plus size={12} /> Add Value
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {attr.values?.map((val) => (
                    <span
                      key={val.id}
                      className="badge"
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}
                    >
                      {attr.type === 'colour swatch' && val.value && (
                        <span
                          style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: val.value,
                            border: '1px solid rgba(255,255,255,0.4)',
                            display: 'inline-block',
                          }}
                        />
                      )}
                      {val.name}
                      {hasPermission('attribute:update') && (
                        <X
                          size={12}
                          style={{ cursor: 'pointer', color: 'var(--text-muted)' }}
                          onClick={() => handleDeleteValue(attr.id, val.id)}
                        />
                      )}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                {hasPermission('attribute:update') && (
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => handleOpenEdit(attr)}>
                    <Edit2 size={14} /> Edit
                  </button>
                )}
                {hasPermission('attribute:delete') && (
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteAttr(attr)}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Attribute Form Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                {editingAttr ? `Edit Attribute: ${editingAttr.name}` : 'Create Attribute'}
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
                <label className="form-label">Attribute Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Size, Colour, Material"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Code Identifier</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. size, colour, material"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Display Type</label>
                <select
                  className="form-control"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="dropdown">Dropdown Select</option>
                  <option value="radio">Radio Options</option>
                  <option value="checkbox">Checkboxes</option>
                  <option value="colour swatch">Colour Swatch</option>
                  <option value="image swatch">Image Swatch</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Attribute usage"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingAttr ? 'Update Attribute' : 'Create Attribute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Value Modal */}
      {showValModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                Add Value to {selectedAttrForVal?.name}
              </h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowValModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddValueSubmit}>
              <div className="form-group">
                <label className="form-label">Value Name / Label</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. XL, Red, Leather"
                  value={valName}
                  onChange={(e) => setValName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Value Code / Hex ({selectedAttrForVal?.type === 'colour swatch' ? 'Hex code e.g. #ff0000' : 'Value string'})
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder={selectedAttrForVal?.type === 'colour swatch' ? '#ff0000' : 'xl'}
                  value={valValue}
                  onChange={(e) => setValValue(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowValModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Value Tag
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
