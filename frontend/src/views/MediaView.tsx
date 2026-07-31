import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { Upload, FileText, Trash2, Edit2, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export interface MediaAsset {
  id: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  type?: string;
  size: number;
  width?: number;
  height?: number;
  url: string;
  thumbnailUrl?: string;
  altText?: string;
  title?: string;
  createdAt: string;
}

export const MediaView: React.FC = () => {
  const { hasPermission } = useAuth();
  const [mediaList, setMediaList] = useState<MediaAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Upload Modal
  const [search, setSearch] = useState('');
  const [mimeTypeFilter, setMimeTypeFilter] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Edit Modal
  const [editingMedia, setEditingMedia] = useState<MediaAsset | null>(null);
  const [altText, setAltText] = useState('');
  const [title, setTitle] = useState('');

  const fetchMedia = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('limit', '50');
      if (search) params.append('search', search);
      if (mimeTypeFilter) params.append('mimeType', mimeTypeFilter);

      const res = await apiClient.get(`/media?${params.toString()}`);
      setMediaList(res.data.data || []);
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [search, mimeTypeFilter]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFiles || selectedFiles.length === 0) return;

    setError(null);
    setUploadProgress(0);

    const formData = new FormData();
    if (selectedFiles.length === 1) {
      formData.append('file', selectedFiles[0]);
    } else {
      for (let i = 0; i < selectedFiles.length; i++) {
        formData.append('files', selectedFiles[i]);
      }
    }

    const endpoint = selectedFiles.length === 1 ? '/media/upload' : '/media/upload/multiple';

    try {
      await apiClient.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          }
        },
      });

      setShowUploadModal(false);
      setSelectedFiles(null);
      setUploadProgress(null);
      fetchMedia();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload file(s)');
      setUploadProgress(null);
    }
  };

  const handleSaveMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMedia) return;

    try {
      await apiClient.patch(`/media/${editingMedia.id}`, { altText, title });
      setEditingMedia(null);
      fetchMedia();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update metadata');
    }
  };

  const handleDeleteMedia = async (media: MediaAsset) => {
    if (!window.confirm(`Are you sure you want to delete media "${media.originalName}"?`)) return;

    try {
      await apiClient.delete(`/media/${media.id}`);
      fetchMedia();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete media');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Media Library</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Asset management, image uploads, thumbnails, and metadata
          </p>
        </div>

        {hasPermission('media:upload') && (
          <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
            <Upload size={18} /> Upload Files
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div
        className="card"
        style={{
          marginBottom: '1.5rem',
          display: 'grid',
          gridTemplateColumns: '1fr 200px',
          gap: '1rem',
        }}
      >
        <input
          type="text"
          className="form-control"
          placeholder="Search assets by title or filename..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="form-control"
          value={mimeTypeFilter}
          onChange={(e) => setMimeTypeFilter(e.target.value)}
        >
          <option value="">All Asset Types</option>
          <option value="image">Images Only</option>
          <option value="video">Videos Only</option>
          <option value="application">Documents Only</option>
        </select>
      </div>

      {isLoading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          Loading media library...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
          {mediaList.map((media) => (
            <div key={media.id} className="card" style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  height: '140px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(0, 0, 0, 0.4)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  marginBottom: '0.75rem',
                }}
              >
                {media.mimeType.startsWith('image/') ? (
                  <img
                    src={media.thumbnailUrl || media.url}
                    alt={media.altText || media.originalName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <FileText size={48} style={{ color: 'var(--text-muted)' }} />
                )}

                {media.width && media.height && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '6px',
                      right: '6px',
                      background: 'rgba(0,0,0,0.7)',
                      fontSize: '0.65rem',
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    {media.width}x{media.height}
                  </span>
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={media.title || media.originalName}
                >
                  {media.title || media.originalName}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {formatFileSize(media.size)} • {media.mimeType.split('/')[1]}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                {hasPermission('media:update') || hasPermission('media:write') ? (
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => {
                      setEditingMedia(media);
                      setAltText(media.altText || '');
                      setTitle(media.title || media.originalName);
                    }}
                  >
                    <Edit2 size={14} /> Edit
                  </button>
                ) : null}

                {hasPermission('media:delete') && (
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDeleteMedia(media)}
                    title="Delete Media"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Upload Media Files</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowUploadModal(false)}>
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="alert-banner alert-danger">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit}>
              <div className="form-group">
                <label className="form-label">Select File(s)</label>
                <input
                  type="file"
                  multiple
                  className="form-control"
                  onChange={(e) => setSelectedFiles(e.target.files)}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Supports JPEG, PNG, WEBP, GIF, SVG, PDF, CSV, DOCX (Max 10MB per file)
                </span>
              </div>

              {uploadProgress !== null && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${uploadProgress}%`,
                        background: 'var(--accent-primary)',
                        transition: 'width 0.2s ease',
                      }}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowUploadModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={uploadProgress !== null}>
                  {uploadProgress !== null ? 'Uploading...' : 'Start Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Metadata Modal */}
      {editingMedia && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Edit Asset Metadata</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditingMedia(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveMetadata}>
              <div className="form-group">
                <label className="form-label">Asset Title</label>
                <input
                  type="text"
                  className="form-control"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Alt Text (Accessibility & SEO)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Describe image for screen readers"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingMedia(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
