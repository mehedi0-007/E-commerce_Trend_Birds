import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { Tag, Plus, Edit2, Trash2, Search, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { MediaAsset } from './MediaView';

interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoId?: string;
  logo?: MediaAsset;
  active: boolean;
}

export const BrandsView: React.FC = () => {
  const { hasPermission } = useAuth();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [mediaList, setMediaList] = useState<MediaAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  // Form Modal
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [logoId, setLogoId] = useState('');
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBrands = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('limit', '50');
      if (search) params.append('search', search);
      if (activeFilter !== '') params.append('active', activeFilter);

      const [brandsRes, mediaRes] = await Promise.all([
        apiClient.get(`/brands?${params.toString()}`),
        apiClient.get('/media?limit=50'),
      ]);

      setBrands(brandsRes.data.data || []);
      setMediaList(mediaRes.data.data || []);
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, [search, activeFilter]);

  const handleOpenCreate = () => {
    setEditingBrand(null);
    setName('');
    setSlug('');
    setDescription('');
    setLogoId('');
    setActive(true);
    setError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setName(brand.name);
    setSlug(brand.slug);
    setDescription(brand.description || '');
    setLogoId(brand.logoId || '');
    setActive(brand.active);
    setError(null);
    setShowModal(true);
  };

  const handleDeleteBrand = async (brand: Brand) => {
    if (!window.confirm(`Are you sure you want to delete brand "${brand.name}"?`)) return;

    try {
      await apiClient.delete(`/brands/${brand.id}`);
      fetchBrands();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete brand');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload: any = {
      name,
      slug: slug || undefined,
      description,
      logoId: logoId || null,
      active,
    };

    try {
      if (editingBrand) {
        await apiClient.patch(`/brands/${editingBrand.id}`, payload);
      } else {
        await apiClient.post('/brands', payload);
      }

      setShowModal(false);
      fetchBrands();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save brand');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Brand Directory</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Product brands, logos, and active status
          </p>
        </div>

        {hasPermission('brand:create') && (
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={18} /> Create Brand
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div
        className="card"
        style={{
          marginBottom: '1.5rem',
          display: 'grid',
          gridTemplateColumns: '1fr 180px',
          gap: '1rem',
        }}
      >
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search brands by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>

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
          Loading brands...
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Brand Logo & Name</th>
                <th>Slug</th>
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {brands.map((b) => (
                <tr key={b.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {b.logo?.thumbnailUrl ? (
                        <img
                          src={b.logo.thumbnailUrl}
                          alt={b.name}
                          style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '6px',
                            background: 'rgba(99,102,241,0.15)',
                            color: '#6366f1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Tag size={18} />
                        </div>
                      )}
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.name}</span>
                    </div>
                  </td>
                  <td>
                    <code style={{ fontSize: '0.8rem', color: '#a5b4fc' }}>{b.slug}</code>
                  </td>
                  <td>{b.description || '-'}</td>
                  <td>
                    {b.active ? (
                      <span className="badge badge-success">Active</span>
                    ) : (
                      <span className="badge badge-danger">Inactive</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {hasPermission('brand:update') && (
                        <button className="btn btn-secondary btn-sm" onClick={() => handleOpenEdit(b)}>
                          <Edit2 size={14} /> Edit
                        </button>
                      )}
                      {hasPermission('brand:delete') && (
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteBrand(b)}>
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
                {editingBrand ? `Edit Brand: ${editingBrand.name}` : 'Create Brand'}
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
                <label className="form-label">Brand Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Nike, Apple"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Custom Slug (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="auto-generated-if-empty"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Brand Logo (Media Library)</label>
                <select
                  className="form-control"
                  value={logoId}
                  onChange={(e) => setLogoId(e.target.value)}
                >
                  <option value="">No Logo</option>
                  {mediaList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title || m.originalName} ({m.mimeType})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Brand details"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="brandActive"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#6366f1' }}
                />
                <label htmlFor="brandActive" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>
                  Active Status
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingBrand ? 'Update Brand' : 'Create Brand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
