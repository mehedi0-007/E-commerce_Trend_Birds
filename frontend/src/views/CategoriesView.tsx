import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { FolderTree, Plus, Edit2, Trash2, ChevronRight, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MediaAsset } from './MediaView';

interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  parent?: { id: string; name: string };
  children?: CategoryNode[];
  image?: MediaAsset;
  active: boolean;
  sortOrder: number;
}

export const CategoriesView: React.FC = () => {
  const { hasPermission } = useAuth();
  const [treeCategories, setTreeCategories] = useState<CategoryNode[]>([]);
  const [flatCategories, setFlatCategories] = useState<CategoryNode[]>([]);
  const [mediaList, setMediaList] = useState<MediaAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form Modal
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryNode | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [imageId, setImageId] = useState<string>('');
  const [active, setActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const [treeRes, flatRes, mediaRes] = await Promise.all([
        apiClient.get('/categories/tree'),
        apiClient.get('/categories?limit=100'),
        apiClient.get('/media?limit=50'),
      ]);
      setTreeCategories(treeRes.data || []);
      setFlatCategories(flatRes.data.data || []);
      setMediaList(mediaRes.data.data || []);
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setParentId('');
    setImageId('');
    setActive(true);
    setSortOrder(0);
    setError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (cat: CategoryNode) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setParentId(cat.parentId || '');
    setImageId(cat.image?.id || '');
    setActive(cat.active);
    setSortOrder(cat.sortOrder || 0);
    setError(null);
    setShowModal(true);
  };

  const handleDeleteCategory = async (cat: CategoryNode) => {
    if (!window.confirm(`Are you sure you want to delete category "${cat.name}"?`)) return;

    try {
      await apiClient.delete(`/categories/${cat.id}`);
      fetchCategories();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete category');
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
      parentId: parentId || null,
      imageId: imageId || null,
      active,
      sortOrder: Number(sortOrder),
    };

    try {
      if (editingCategory) {
        await apiClient.patch(`/categories/${editingCategory.id}`, payload);
      } else {
        await apiClient.post('/categories', payload);
      }

      setShowModal(false);
      fetchCategories();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCategoryTreeNodes = (nodes: CategoryNode[], depth = 0) => {
    return nodes.map((node) => (
      <React.Fragment key={node.id}>
        <tr>
          <td style={{ paddingLeft: `${1.2 + depth * 1.5}rem` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {depth > 0 && <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />}
              {node.image?.thumbnailUrl ? (
                <img
                  src={node.image.thumbnailUrl}
                  alt={node.name}
                  style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'cover' }}
                />
              ) : (
                <FolderTree size={18} style={{ color: '#6366f1' }} />
              )}
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{node.name}</span>
            </div>
          </td>
          <td>
            <code style={{ fontSize: '0.8rem', color: '#a5b4fc' }}>{node.slug}</code>
          </td>
          <td>{node.sortOrder}</td>
          <td>
            {node.active ? (
              <span className="badge badge-success">Active</span>
            ) : (
              <span className="badge badge-danger">Inactive</span>
            )}
          </td>
          <td>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {hasPermission('category:update') && (
                <button className="btn btn-secondary btn-sm" onClick={() => handleOpenEdit(node)}>
                  <Edit2 size={14} /> Edit
                </button>
              )}
              {hasPermission('category:delete') && (
                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteCategory(node)}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </td>
        </tr>
        {node.children && node.children.length > 0 && renderCategoryTreeNodes(node.children, depth + 1)}
      </React.Fragment>
    ));
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Category Hierarchy</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Tree taxonomy, nested subcategories, and sort order
          </p>
        </div>

        {hasPermission('category:create') && (
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={18} /> Create Category
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          Loading category tree...
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Category Name</th>
                <th>Slug</th>
                <th>Sort Order</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>{renderCategoryTreeNodes(treeCategories)}</tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                {editingCategory ? `Edit Category: ${editingCategory.name}` : 'Create Category'}
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
                <label className="form-label">Category Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Footwear, Men's Fashion"
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
                <label className="form-label">Parent Category</label>
                <select
                  className="form-control"
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                >
                  <option value="">None (Top Level Root)</option>
                  {flatCategories
                    .filter((c) => c.id !== editingCategory?.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Category Image (Media Library)</label>
                <select
                  className="form-control"
                  value={imageId}
                  onChange={(e) => setImageId(e.target.value)}
                >
                  <option value="">No Image</option>
                  {mediaList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title || m.originalName} ({m.mimeType})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Sort Order</label>
                  <input
                    type="number"
                    className="form-control"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', marginTop: '1.5rem', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="catActive"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#6366f1' }}
                  />
                  <label htmlFor="catActive" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>
                    Active Category
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
