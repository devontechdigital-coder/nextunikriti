'use client';

import { useState, useMemo } from 'react';
import { Container, Table, Spinner, Alert, Badge, Button, Modal, Form, Tabs, Tab, InputGroup } from 'react-bootstrap';
import {
  useGetAdminPagesQuery,
  useCreateAdminPageMutation,
  useUpdateAdminPageMutation,
  useDeleteAdminPageMutation
} from '@/redux/api/apiSlice';
import { FaEdit, FaTrash, FaPlus, FaSave, FaEye, FaSearch, FaGlobe, FaSearchPlus } from 'react-icons/fa';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

export default function AdminPagesPage() {
  const { data, isLoading, isError, error } = useGetAdminPagesQuery();
  const [createPage, { isLoading: isCreating }] = useCreateAdminPageMutation();
  const [updatePage, { isLoading: isUpdating }] = useUpdateAdminPageMutation();
  const [deletePage, { isLoading: isDeleting }] = useDeleteAdminPageMutation();

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pageToDelete, setPageToDelete] = useState(null);
  const [editingPage, setEditingPage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    status: 'draft',
    metaKeywords: '',
    customScripts: '',
    customCSS: '',
    customContent: '',
    isRawHTML: false
  });

  const handleOpenModal = (page = null) => {
    if (page) {
      setEditingPage(page);
      setFormData({
        title: page.title || '',
        slug: page.slug || '',
        content: page.content || '',
        status: page.status || 'draft',
        metaKeywords: page.metaKeywords || '',
        customScripts: page.customScripts || '',
        customCSS: page.customCSS || '',
        customContent: page.customContent || '',
        isRawHTML: !!page.isRawHTML
      });
    } else {
      setEditingPage(null);
      setFormData({
        title: '',
        slug: '',
        content: '',
        status: 'draft',
        metaKeywords: '',
        customScripts: '',
        customCSS: '',
        customContent: '',
        isRawHTML: false
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPage) {
        await updatePage({ id: editingPage._id, ...formData }).unwrap();
        toast.success('Page updated successfully!');
      } else {
        await createPage(formData).unwrap();
        toast.success('Page created successfully!');
      }
      setShowModal(false);
    } catch (err) {
      toast.error(err.data?.error || 'Failed to save page.');
    }
  };

  const handleDeleteClick = (page) => {
    setPageToDelete(page);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!pageToDelete) return;
    try {
      await deletePage(pageToDelete._id).unwrap();
      toast.success('Page deleted successfully!');
      setShowDeleteModal(false);
    } catch (err) {
      toast.error('Failed to delete page.');
    }
  };

  const generateSlug = () => {
    const slug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    setFormData({ ...formData, slug });
  };

  if (isLoading) return <Container className="py-5 text-center"><Spinner animation="border" /></Container>;

  const pages = data?.data || [];

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">Dynamic Pages</h2>
        <Button variant="primary" onClick={() => handleOpenModal()}>
          <FaPlus className="me-2" /> Add New Page
        </Button>
      </div>

      <div className="bg-white p-3 rounded shadow-sm mb-4">
        <div className="d-flex align-items-center gap-2" style={{ maxWidth: '400px' }}>
          <FaSearch className="text-muted" />
          <Form.Control
            type="text"
            placeholder="Search pages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded shadow-sm overflow-hidden">
        <Table hover responsive className="mb-0">
          <thead className="bg-light">
            <tr>
              <th className="ps-4">Title</th>
              <th>Slug</th>
              <th>Status</th>
              <th className="text-end pe-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(pages || []).filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase())).map((page) => (
              <tr key={page._id} className="align-middle">
                <td className="ps-4 fw-bold">{page.title}</td>
                <td><code>/{page.slug}</code></td>
                <td>
                  <Badge bg={page.status === 'published' ? 'success' : 'secondary'}>
                    {page.status}
                  </Badge>
                </td>
                <td className="text-end pe-4">
                  <div className="d-flex justify-content-end gap-2">
                    <Button variant="outline-primary" size="sm" onClick={() => handleOpenModal(page)}><FaEdit /></Button>
                    <Button variant="outline-danger" size="sm" onClick={() => handleDeleteClick(page)}><FaTrash /></Button>
                    {page.status === 'published' && (
                      <a href={`/${page.slug}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline-dark btn-sm">
                        <FaEye />
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        {pages.length === 0 && <div className="p-5 text-center text-muted">No pages found</div>}
      </div>

      {/* Create/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="xl" centered scrollable>
        <Modal.Header closeButton>
          <Modal.Title>{editingPage ? 'Edit Page' : 'Create New Page'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit} className='overflow-auto'>
          <Modal.Body className="p-0 " >
            <Tabs defaultActiveKey="content" className="custom-admin-tabs px-3 pt-2 bg-light border-bottom">
              <Tab eventKey="content" title="Content">
                <div className="p-4">
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <Form.Group>
                        <Form.Label className="fw-bold">Page Title</Form.Label>
                        <Form.Control
                          type="text"
                          required
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          onBlur={!editingPage ? generateSlug : undefined}
                        />
                      </Form.Group>
                    </div>
                    <div className="col-md-6">
                      <Form.Group>
                        <Form.Label className="fw-bold">Slug (URL path)</Form.Label>
                        <InputGroup>
                          <InputGroup.Text>/</InputGroup.Text>
                          <Form.Control
                            type="text"
                            required
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                          />
                        </InputGroup>
                      </Form.Group>
                    </div>
                    <div className="col-md-6">
                      <Form.Group>
                        <Form.Label className="fw-bold">Status</Form.Label>
                        <Form.Select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                        </Form.Select>
                      </Form.Group>
                    </div>
                  </div>

                  <Form.Group className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                       <Form.Label className="fw-bold mb-0">Page Content</Form.Label>
                       <Form.Check 
                          type="switch"
                          label="Use Raw HTML / Custom Code"
                          checked={formData.isRawHTML}
                          onChange={(e) => setFormData({ ...formData, isRawHTML: e.target.checked })}
                       />
                    </div>
                    {formData.isRawHTML ? (
                      <Form.Control
                        as="textarea"
                        rows={15}
                        className="font-monospace"
                        placeholder="Paste your custom HTML/JS/CSS code here..."
                        value={formData.customContent}
                        onChange={(e) => setFormData({ ...formData, customContent: e.target.value })}
                      />
                    ) : (
                      <div style={{ height: '400px', marginBottom: '50px' }}>
                        <ReactQuill
                          theme="snow"
                          value={formData.content}
                          onChange={val => setFormData({ ...formData, content: val })}
                          style={{ height: '350px' }}
                        />
                      </div>
                    )}
                  </Form.Group>
                </div>
              </Tab>
              <Tab eventKey="seo" title={<span><FaSearchPlus className="me-1" /> SEO Settings</span>}>
                <div className="p-4">
                  <Alert variant="info" className="small">
                    Optimize this page for search engines by providing specific meta information.
                  </Alert>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">Meta Title</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Custom browser title"
                      value={formData.metaTitle}
                      onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                    />
                    <Form.Text className="text-muted">Defaults to Page Title if left empty.</Form.Text>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">Meta Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Short summary for search results"
                      value={formData.metaDescription}
                      onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">Meta Keywords</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      placeholder="keyword1, keyword2, keyword3"
                      value={formData.metaKeywords}
                      onChange={(e) => setFormData({ ...formData, metaKeywords: e.target.value })}
                    />
                  </Form.Group>
                </div>
              </Tab>
              <Tab eventKey="advanced" title="Scripts & Styles">
                <div className="p-4">
                  <Alert variant="warning" className="small">
                    <FaGlobe className="me-2" />
                    Advanced: These fields allow you to inject custom code into this specific page. Be careful with what you paste here.
                  </Alert>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">Custom CSS</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={5}
                      placeholder="/* CSS code here (without <style> tags) */"
                      value={formData.customCSS}
                      onChange={(e) => setFormData({ ...formData, customCSS: e.target.value })}
                      className="font-monospace small"
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">Custom Scripts</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={5}
                      placeholder="// JavaScript code here (without <script> tags)"
                      value={formData.customScripts}
                      onChange={(e) => setFormData({ ...formData, customScripts: e.target.value })}
                      className="font-monospace small"
                    />
                  </Form.Group>
                </div>
              </Tab>
            </Tabs>
          </Modal.Body>
          <Modal.Footer className="bg-light">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={isCreating || isUpdating}>
              {(isCreating || isUpdating) ? <Spinner size="sm" /> : editingPage ? 'Update Page' : 'Create Page'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the page <strong>{pageToDelete?.title}</strong>? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleConfirmDelete} disabled={isDeleting}>
            {isDeleting ? <Spinner size="sm" /> : 'Delete Page'}
          </Button>
        </Modal.Footer>
      </Modal>

      <style jsx global>{`
        .custom-admin-tabs .nav-link {
          color: #495057;
          border: none;
          padding: 10px 20px;
          font-weight: 500;
        }
        .custom-admin-tabs .nav-link.active {
          color: #0d6efd;
          border-bottom: 3px solid #0d6efd;
          background: transparent;
        }
        .ql-container {
          height: 300px;
        }
      `}</style>
    </Container>
  );
}
