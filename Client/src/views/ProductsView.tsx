import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { Package, Plus, Trash2, Search, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { MediaAsset } from './MediaView';

interface Product {
  id: string;
  name: string;
  sku: string;
  slug: string;
  type: string;
  hasVariants: boolean;
  price: number;
  salePrice?: number;
  stock?: number;
  active: boolean;
  brand?: { id: string; name: string };
  categories?: Array<{ category: { id: string; name: string } }>;
  mediaAttachments?: Array<{ isThumbnail: boolean; media: MediaAsset }>;
  variants?: any[];
}

export const ProductsView: React.FC = () => {
  const { hasPermission } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [mediaList, setMediaList] = useState<MediaAsset[]>([]);
  const [attributes, setAttributes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Tabbed Modal State
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'taxonomy' | 'media' | 'variants'>('details');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [slug, setSlug] = useState('');
  const [hasVariants, setHasVariants] = useState(false);
  const [price, setPrice] = useState<number>(0);
  const [salePrice, setSalePrice] = useState<number | undefined>(undefined);
  const [stock, setStock] = useState<number | undefined>(10);
  const [description, setDescription] = useState('');
  const [brandId, setBrandId] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedMediaIds, setSelectedMediaIds] = useState<Array<{ mediaId: string; isThumbnail: boolean }>>([]);

  // Variant Matrix state
  const [variantsList, setVariantsList] = useState<
    Array<{
      sku: string;
      price: number;
      salePrice?: number;
      stock?: number;
      attributeValueIds: string[];
    }>
  >([]);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProductsData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');
      if (search) params.append('search', search);
      if (brandFilter) params.append('brandId', brandFilter);
      if (categoryFilter) params.append('categoryId', categoryFilter);

      const [prodRes, brandRes, catRes, mediaRes, attrRes] = await Promise.all([
        apiClient.get(`/products?${params.toString()}`),
        apiClient.get('/brands?limit=100'),
        apiClient.get('/categories?limit=100'),
        apiClient.get('/media?limit=100'),
        apiClient.get('/attributes?limit=100'),
      ]);

      setProducts(prodRes.data.data || []);
      setTotalPages(prodRes.data.meta?.totalPages || 1);
      setBrands(brandRes.data.data || []);
      setCategories(catRes.data.data || []);
      setMediaList(mediaRes.data.data || []);
      setAttributes(attrRes.data.data || []);
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsData();
  }, [page, search, brandFilter, categoryFilter]);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setName('');
    setSku('');
    setSlug('');
    setHasVariants(false);
    setPrice(0);
    setSalePrice(undefined);
    setStock(10);
    setDescription('');
    setBrandId('');
    setSelectedCategoryIds([]);
    setSelectedMediaIds([]);
    setVariantsList([]);
    setActiveTab('details');
    setError(null);
    setShowModal(true);
  };

  const handleDeleteProduct = async (prod: Product) => {
    if (!window.confirm(`Are you sure you want to delete product "${prod.name}"?`)) return;

    try {
      await apiClient.delete(`/products/${prod.id}`);
      fetchProductsData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete product');
    }
  };

  const handleAddVariantRow = () => {
    setVariantsList((prev) => [
      ...prev,
      {
        sku: `${sku || 'SKU'}-VAR-${prev.length + 1}`,
        price: price || 0,
        stock: 10,
        attributeValueIds: [],
      },
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload: any = {
      name,
      sku,
      slug: slug || undefined,
      hasVariants,
      price: Number(price),
      salePrice: salePrice ? Number(salePrice) : undefined,
      stock: stock !== undefined ? Number(stock) : undefined,
      description,
      brandId: brandId || undefined,
      categoryIds: selectedCategoryIds,
      mediaAttachments: selectedMediaIds,
      variants: hasVariants ? variantsList : undefined,
    };

    try {
      if (editingProduct) {
        await apiClient.patch(`/products/${editingProduct.id}`, payload);
      } else {
        await apiClient.post('/products', payload);
      }

      setShowModal(false);
      fetchProductsData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCategorySelect = (id: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((cId) => cId !== id) : [...prev, id]
    );
  };

  const toggleMediaSelect = (mediaId: string, isThumbnail: boolean) => {
    setSelectedMediaIds((prev) => {
      const exists = prev.find((m) => m.mediaId === mediaId);
      if (exists) {
        return prev.filter((m) => m.mediaId !== mediaId);
      }

      if (isThumbnail) {
        const withoutThumb = prev.map((m) => ({ ...m, isThumbnail: false }));
        return [...withoutThumb, { mediaId, isThumbnail: true }];
      }

      return [...prev, { mediaId, isThumbnail: false }];
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Product Catalog</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Products, variants, SKUs, pricing, stock, and media attachments
          </p>
        </div>

        {hasPermission('product:create') && (
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={18} /> Create Product
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div
        className="card"
        style={{
          marginBottom: '1.5rem',
          display: 'grid',
          gridTemplateColumns: '1fr 200px 200px',
          gap: '1rem',
        }}
      >
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search products by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>

        <select className="form-control" value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}>
          <option value="">All Brands</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        <select className="form-control" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          Loading product catalog...
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Brand & Categories</th>
                <th>Price / Sale</th>
                <th>Stock</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const thumb = p.mediaAttachments?.find((m) => m.isThumbnail)?.media;
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {thumb?.thumbnailUrl ? (
                          <img
                            src={thumb.thumbnailUrl}
                            alt={p.name}
                            style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '6px',
                              background: 'rgba(99,102,241,0.15)',
                              color: '#6366f1',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Package size={20} />
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <code style={{ fontSize: '0.8rem', color: '#a5b4fc' }}>{p.sku}</code>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{p.brand?.name || 'No Brand'}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem', marginTop: '0.2rem' }}>
                        {p.categories?.map((c) => (
                          <span key={c.category.id} className="badge badge-info" style={{ fontSize: '0.65rem' }}>
                            {c.category.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>${p.price}</div>
                      {p.salePrice && <div style={{ fontSize: '0.75rem', color: '#10b981' }}>Sale: ${p.salePrice}</div>}
                    </td>
                    <td>
                      {p.stock !== undefined ? (
                        <span className={`badge ${p.stock > 0 ? 'badge-success' : 'badge-danger'}`}>
                          {p.stock} units
                        </span>
                      ) : (
                        <span className="badge badge-info">Variant stock</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${p.hasVariants ? 'badge-info' : 'badge-warning'}`}>
                        {p.hasVariants ? 'Variable' : 'Simple'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {hasPermission('product:delete') && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteProduct(p)}>
                            <Trash2 size={14} /> Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
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

      {/* Tabbed Product Creation Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '850px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Create New Product</h2>
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

            {/* Modal Tabs */}
            <div className="tabs-header">
              <button
                type="button"
                className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
                onClick={() => setActiveTab('details')}
              >
                1. Basic Details
              </button>
              <button
                type="button"
                className={`tab-btn ${activeTab === 'taxonomy' ? 'active' : ''}`}
                onClick={() => setActiveTab('taxonomy')}
              >
                2. Brand & Categories
              </button>
              <button
                type="button"
                className={`tab-btn ${activeTab === 'media' ? 'active' : ''}`}
                onClick={() => setActiveTab('media')}
              >
                3. Media & Thumbnail
              </button>
              {hasVariants && (
                <button
                  type="button"
                  className={`tab-btn ${activeTab === 'variants' ? 'active' : ''}`}
                  onClick={() => setActiveTab('variants')}
                >
                  4. Variant Combinations
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit}>
              {/* Tab 1: Details */}
              {activeTab === 'details' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Product Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Leather Jacket"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">SKU</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. JK-1001"
                        value={sku}
                        onChange={(e) => setSku(e.target.value)}
                        required
                      />
                    </div>
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

                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <input
                      type="checkbox"
                      id="hasVarCheck"
                      checked={hasVariants}
                      onChange={(e) => setHasVariants(e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: '#6366f1' }}
                    />
                    <label htmlFor="hasVarCheck" style={{ fontSize: '0.9rem', cursor: 'pointer', fontWeight: 600 }}>
                      This product has multiple variants (Size, Colour, etc.)
                    </label>
                  </div>

                  {!hasVariants && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">Regular Price ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control"
                          value={price}
                          onChange={(e) => setPrice(Number(e.target.value))}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Sale Price ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control"
                          placeholder="Optional"
                          value={salePrice ?? ''}
                          onChange={(e) => setSalePrice(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Stock Quantity</label>
                        <input
                          type="number"
                          className="form-control"
                          value={stock ?? ''}
                          onChange={(e) => setStock(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Product Description</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Tab 2: Taxonomy */}
              {activeTab === 'taxonomy' && (
                <div>
                  <div className="form-group">
                    <label className="form-label">Select Brand</label>
                    <select className="form-control" value={brandId} onChange={(e) => setBrandId(e.target.value)}>
                      <option value="">No Brand</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Select Categories</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
                      {categories.map((cat) => (
                        <label
                          key={cat.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem',
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-color)',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedCategoryIds.includes(cat.id)}
                            onChange={() => toggleCategorySelect(cat.id)}
                            style={{ accentColor: '#6366f1' }}
                          />
                          <span>{cat.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Media */}
              {activeTab === 'media' && (
                <div>
                  <label className="form-label" style={{ marginBottom: '0.75rem', display: 'block' }}>
                    Select Attachments from Media Library (Click image to attach; toggle thumbnail)
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem', maxHeight: '320px', overflowY: 'auto' }}>
                    {mediaList.map((m) => {
                      const selectedObj = selectedMediaIds.find((sm) => sm.mediaId === m.id);
                      const isSelected = !!selectedObj;
                      const isThumb = selectedObj?.isThumbnail || false;

                      return (
                        <div
                          key={m.id}
                          style={{
                            border: isSelected ? '2px solid #6366f1' : '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            padding: '0.4rem',
                            background: isSelected ? 'var(--accent-glow)' : 'rgba(0,0,0,0.2)',
                            position: 'relative',
                            cursor: 'pointer',
                          }}
                          onClick={() => toggleMediaSelect(m.id, false)}
                        >
                          <img
                            src={m.thumbnailUrl || m.url}
                            alt={m.originalName}
                            style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '4px' }}
                          />
                          <div style={{ fontSize: '0.7rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '0.2rem' }}>
                            {m.title || m.originalName}
                          </div>

                          {isSelected && (
                            <button
                              type="button"
                              className={`btn btn-sm ${isThumb ? 'btn-primary' : 'btn-secondary'}`}
                              style={{ width: '100%', marginTop: '0.3rem', fontSize: '0.65rem', padding: '2px' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleMediaSelect(m.id, true);
                              }}
                            >
                              {isThumb ? '★ Thumbnail' : 'Set Thumb'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab 4: Variants */}
              {activeTab === 'variants' && hasVariants && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <label className="form-label">Variant Combinations List</label>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddVariantRow}>
                      <Plus size={14} /> Add Variant Row
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '320px', overflowY: 'auto' }}>
                    {variantsList.map((variant, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1.2fr 1fr 1fr 1fr 2.5fr 36px',
                          gap: '0.5rem',
                          background: 'rgba(0,0,0,0.2)',
                          padding: '0.65rem',
                          borderRadius: 'var(--radius-md)',
                          alignItems: 'center',
                        }}
                      >
                        <input
                          type="text"
                          className="form-control"
                          placeholder="SKU"
                          value={variant.sku}
                          onChange={(e) => {
                            const val = e.target.value;
                            setVariantsList((prev) => prev.map((v, i) => (i === idx ? { ...v, sku: val } : v)));
                          }}
                        />

                        <input
                          type="number"
                          step="0.01"
                          className="form-control"
                          placeholder="Price"
                          value={variant.price}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setVariantsList((prev) => prev.map((v, i) => (i === idx ? { ...v, price: val } : v)));
                          }}
                        />

                        <input
                          type="number"
                          className="form-control"
                          placeholder="Stock"
                          value={variant.stock ?? ''}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setVariantsList((prev) => prev.map((v, i) => (i === idx ? { ...v, stock: val } : v)));
                          }}
                        />

                        <select
                          className="form-control"
                          onChange={(e) => {
                            const valId = e.target.value;
                            if (!valId) return;
                            setVariantsList((prev) =>
                              prev.map((v, i) =>
                                i === idx ? { ...v, attributeValueIds: Array.from(new Set([...v.attributeValueIds, valId])) } : v
                              )
                            );
                          }}
                        >
                          <option value="">Select Value...</option>
                          {attributes.flatMap((a) =>
                            a.values.map((v: any) => (
                              <option key={v.id} value={v.id}>
                                {a.name}: {v.name}
                              </option>
                            ))
                          )}
                        </select>

                        <div style={{ fontSize: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
                          {variant.attributeValueIds.map((vId) => (
                            <span key={vId} className="badge badge-info" style={{ fontSize: '0.65rem' }}>
                              {vId.substring(0, 8)}...
                            </span>
                          ))}
                        </div>

                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => setVariantsList((prev) => prev.filter((_, i) => i !== idx))}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating Product...' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
