'use client';
import { useState, useRef } from 'react';
import { Container, Button, Modal, Form, Spinner, Alert, Card, Table, FormCheck, Badge, InputGroup } from 'react-bootstrap';
import { 
  useGetAdminBannersQuery, 
  useCreateAdminBannerMutation, 
  useUpdateAdminBannerMutation, 
  useDeleteAdminBannerMutation 
} from '@/redux/api/apiSlice';
import { FiPlus, FiEdit2, FiTrash2, FiLink, FiUpload, FiCheckCircle, FiImage, FiExternalLink } from 'react-icons/fi';
import axios from 'axios';

export default function AdminBannersPage() {
  const { data, isLoading, isError, error } = useGetAdminBannersQuery();
  const [createBanner, { isLoading: isCreating }] = useCreateAdminBannerMutation();
  const [updateBanner, { isLoading: isUpdating }] = useUpdateAdminBannerMutation();
  const [deleteBanner, { isLoading: isDeleting }] = useDeleteAdminBannerMutation();

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [bannerToDelete, setBannerToDelete] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    imageUrl: '',
    link: '',
    active: true,
    order: 0
  });

  const handleOpenModal = (banner = null) => {
    setErrorMsg('');
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        title: banner.title || '',
        subtitle: banner.subtitle || '',
        imageUrl: banner.imageUrl || '',
        link: banner.link || '',
        active: banner.active ?? true,
        order: banner.order || 0
      });
    } else {
      setEditingBanner(null);
      setFormData({
        title: '',
        subtitle: '',
        imageUrl: '',
        link: '',
        active: true,
        order: (data?.data?.length || 0)
      });
    }
    setShowModal(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select an image file.');
      return;
    }

    setUploading(true);
    setErrorMsg('');

    try {
      // 1. Get signed URL
      const { data: uploadRes } = await axios.post('/api/upload', {
        filename: file.name,
        contentType: file.type
      });

      if (!uploadRes.success) throw new Error(uploadRes.error);

      const { signedUrl, fileUrl } = uploadRes.data;

      // 2. Upload to GCS
      await axios.put(signedUrl, file, {
        headers: { 'Content-Type': file.type }
      });

      // 3. Update form data with the GCS path
      setFormData(prev => ({ ...prev, imageUrl: fileUrl }));
      setSuccessMsg('Image uploaded successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('File upload error:', err);
      setErrorMsg('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.imageUrl) {
      setErrorMsg('Banner image is required.');
      return;
    }

    try {
      if (editingBanner) {
        await updateBanner({ id: editingBanner._id, ...formData }).unwrap();
        setSuccessMsg('Banner updated successfully!');
      } else {
        await createBanner(formData).unwrap();
        setSuccessMsg('Banner created successfully!');
      }
      setShowModal(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err?.data?.error || 'Failed to save banner');
    }
  };

  const handleToggleActive = async (banner) => {
    try {
      await updateBanner({ id: banner._id, active: !banner.active }).unwrap();
    } catch (err) {
      alert('Failed to toggle banner status');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteBanner(bannerToDelete._id).unwrap();
      setSuccessMsg('Banner deleted successfully!');
      setShowDeleteModal(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert('Failed to delete banner');
    }
  };

  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Loading banners...</p>
      </Container>
    );
  }

  const banners = data?.data || [];

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Banner Management</h2>
          <p className="text-muted small mb-0">Manage promotional banners for the platform homepage.</p>
        </div>
        <Button variant="primary" className="d-flex align-items-center gap-2 shadow-sm" onClick={() => handleOpenModal()}>
          <FiPlus /> Add Banner
        </Button>
      </div>

      {successMsg && (
        <Alert variant="success" className="d-flex align-items-center gap-2 border-0 shadow-sm mb-4">
          <FiCheckCircle className="text-success" /> {successMsg}
        </Alert>
      )}

      {isError && (
        <Alert variant="danger" className="mb-4 shadow-sm border-0">
          <p className="mb-0">Failed to load banners: {error?.data?.error || 'Unknown error'}</p>
        </Alert>
      )}

      <Card className="shadow-sm border-0 overflow-hidden">
        <Table responsive hover className="mb-0">
          <thead className="bg-light">
            <tr>
              <th className="px-4 py-3 border-0">Order</th>
              <th className="py-3 border-0">Banner</th>
              <th className="py-3 border-0">Title</th>
              <th className="py-3 border-0">Status</th>
              <th className="py-3 border-0 text-end px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {banners.length > 0 ? (
              banners.map((banner) => (
                <tr key={banner._id} className="align-middle">
                  <td className="px-4 text-muted fw-medium">{banner.order}</td>
                  <td>
                    <div 
                      className="rounded bg-light d-flex align-items-center justify-content-center border" 
                      style={{ width: '120px', height: '60px', overflow: 'hidden' }}
                    >
                      {banner.imageUrl ? (
                        <img 
                          src={`/api/videos/stream?path=${encodeURIComponent(banner.imageUrl)}`} // Using existing video streaming proxy as a guess for secure access
                          alt={banner.title} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/120x60?text=No+Image';
                          }}
                        />
                      ) : (
                        <FiImage className="text-muted" size={24} />
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="fw-bold text-dark">{banner.title}</div>
                    <div className="text-muted small">{banner.subtitle || 'No subtitle'}</div>
                  </td>
                  <td>
                    <FormCheck 
                      type="switch"
                      id={`active-${banner._id}`}
                      checked={banner.active}
                      onChange={() => handleToggleActive(banner)}
                      label={banner.active ? <Badge bg="success">Active</Badge> : <Badge bg="secondary">Disabled</Badge>}
                    />
                  </td>
                  <td className="text-end px-4">
                    <div className="d-flex justify-content-end gap-2">
                      <Button variant="outline-primary" size="sm" onClick={() => handleOpenModal(banner)}>
                        <FiEdit2 />
                      </Button>
                      <Button variant="outline-danger" size="sm" onClick={() => { setBannerToDelete(banner); setShowDeleteModal(true); }}>
                        <FiTrash2 />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-5 text-muted">
                  No banners found. Start by adding one!
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card>

      {/* Create/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">{editingBanner ? 'Edit Banner' : 'Create Banner'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="p-4">
            {errorMsg && <Alert variant="danger" className="mb-3 small py-2">{errorMsg}</Alert>}
            
            <div className="row g-3">
              <div className="col-md-7">
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-muted text-uppercase">Title</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="e.g. Special Offer 50% Off"
                    required 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-muted text-uppercase">Subtitle</Form.Label>
                  <Form.Control 
                    as="textarea"
                    rows={2}
                    placeholder="Brief description for the banner"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({...formData, subtitle: e.target.value})}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-muted text-uppercase">Destination Link</Form.Label>
                  <InputGroup>
                    <InputGroup.Text className="bg-white border-end-0"><FiLink className="text-muted" /></InputGroup.Text>
                    <Form.Control 
                      type="text" 
                      placeholder="/courses/category-name"
                      className="border-start-0"
                      value={formData.link}
                      onChange={(e) => setFormData({...formData, link: e.target.value})}
                    />
                  </InputGroup>
                </Form.Group>

                <div className="row">
                  <div className="col-6">
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold text-muted text-uppercase">Display Order</Form.Label>
                      <Form.Control 
                        type="number" 
                        value={formData.order}
                        onChange={(e) => setFormData({...formData, order: parseInt(e.target.value) || 0})}
                      />
                    </Form.Group>
                  </div>
                  <div className="col-6 d-flex align-items-center mt-3">
                    <FormCheck 
                      type="switch"
                      id="active-switch"
                      label="Banner Active"
                      checked={formData.active}
                      onChange={(e) => setFormData({...formData, active: e.target.checked})}
                      className="fw-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="col-md-5">
                <Form.Label className="small fw-bold text-muted text-uppercase d-block mb-3">Banner Image</Form.Label>
                <div 
                  className="banner-preview rounded border d-flex flex-column align-items-center justify-content-center bg-light text-center p-3 cursor-pointer mb-2"
                  style={{ minHeight: '180px', position: 'relative' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? (
                    <div className="text-center">
                      <Spinner size="sm" className="mb-2" />
                      <div className="small text-muted text-uppercase fw-bold">Uploading...</div>
                    </div>
                  ) : formData.imageUrl ? (
                    <>
                      <img 
                        src={`/api/videos/stream?path=${encodeURIComponent(formData.imageUrl)}`}
                        alt="Preview" 
                        style={{ maxWidth: '100%', maxHeight: '150px', objectFit: 'contain' }}
                        className="rounded mb-2"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/200x100?text=Invalid+Image';
                        }}
                      />
                      <div className="small text-primary fw-bold"><FiUpload /> Change Image</div>
                    </>
                  ) : (
                    <>
                      <FiUpload size={32} className="text-muted mb-2" />
                      <div className="small text-muted fw-bold">Click to upload banner</div>
                      <div className="x-small text-muted mt-1">(Recommended 1200x400)</div>
                    </>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    hidden 
                    onChange={handleFileUpload}
                    accept="image/*"
                  />
                </div>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="light" onClick={() => setShowModal(false)} className="px-4">Cancel</Button>
            <Button variant="primary" type="submit" disabled={isCreating || isUpdating || uploading} className="px-5 shadow-sm">
              {(isCreating || isUpdating) ? <Spinner size="sm" /> : editingBanner ? 'Update Banner' : 'Create Banner'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered size="sm">
        <Modal.Body className="text-center p-4">
          <div className="text-danger mb-3">
            <FiTrash2 size={40} />
          </div>
          <h5 className="fw-bold">Delete Banner?</h5>
          <p className="text-muted small">Are you sure you want to delete <strong>{bannerToDelete?.title}</strong>? This action cannot be undone.</p>
          <div className="d-grid gap-2">
            <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? <Spinner size="sm" /> : 'Confirm Delete'}
            </Button>
            <Button variant="light" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          </div>
        </Modal.Body>
      </Modal>

      <style jsx>{`
        .cursor-pointer { cursor: pointer; }
        .banner-preview:hover { background-color: #e9ecef !important; border-color: #0d6efd !important; }
        .x-small { font-size: 0.7rem; }
      `}</style>
    </Container>
  );
}
