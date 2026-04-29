'use client';

import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Button, Modal, Form,
  Breadcrumb, Dropdown, Spinner, InputGroup
} from 'react-bootstrap';
import {
  FaFolder, FaFileImage, FaPlus, FaUpload, FaEllipsisV,
  FaTrash, FaEdit, FaExternalLinkAlt, FaCopy, FaArrowLeft, FaFolderPlus, FaArrowsAlt,
  FaFilePdf, FaFileAudio, FaFileVideo, FaFileAlt, FaFileArchive
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const ROOT_PREFIX = 'crm/';

const Gallery = () => {
  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) return { type: 'image', icon: FaFileImage, color: 'text-primary' };
    if (['mp4', 'webm', 'ogg', 'mov'].includes(ext)) return { type: 'video', icon: FaFileVideo, color: 'text-info' };
    if (['mp3', 'wav', 'aac'].includes(ext)) return { type: 'audio', icon: FaFileAudio, color: 'text-success' };
    if (ext === 'pdf') return { type: 'pdf', icon: FaFilePdf, color: 'text-danger' };
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return { type: 'archive', icon: FaFileArchive, color: 'text-warning' };
    return { type: 'file', icon: FaFileAlt, color: 'text-secondary' };
  };
  const [items, setItems] = useState({ files: [], folders: [] });
  const [loading, setLoading] = useState(true);
  const [prefix, setPrefix] = useState(ROOT_PREFIX);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [newName, setNewName] = useState('');
  const [movePath, setMovePath] = useState('');
  const [actionLoading, setActionLoading] = useState({
    delete: false, rename: false, move: false, folder: false, upload: false
  });
  const [activeUploads, setActiveUploads] = useState({});

  useEffect(() => {
    // Attempt to setup CORS automatically on load
    fetch('/api/admin/gallery/setup', { method: 'POST' }).catch(() => { });
    fetchGallery();
  }, [prefix]);

  const fetchGallery = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/gallery?prefix=${prefix}`);
      const data = await res.json();
      if (data.success) {
        setItems({ files: data.files, folders: data.folders });
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('Failed to fetch gallery');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!folderName) return;
    setActionLoading(prev => ({ ...prev, folder: true }));
    try {
      const folderPath = prefix ? `${prefix}${folderName}/` : `${folderName}/`;
      const res = await fetch('/api/admin/gallery/folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Folder created');
        setFolderName('');
        setShowFolderModal(false);
        fetchGallery();
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('Failed to create folder');
    } finally {
      setActionLoading(prev => ({ ...prev, folder: false }));
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const uploadPromises = files.map(async (file) => {
      const filename = prefix ? `${prefix}${file.name}` : file.name;

      try {
        const res = await fetch('/api/admin/gallery/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename, contentType: file.type })
        });
        const { url } = await res.json();

        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', url, true);
          xhr.setRequestHeader('Content-Type', file.type);

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100);
              setActiveUploads(prev => ({ ...prev, [file.name]: percent }));
            }
          };

          xhr.onload = () => {
            if (xhr.status === 200) {
              toast.success(`${file.name} uploaded`);
              setActiveUploads(prev => {
                const next = { ...prev };
                delete next[file.name];
                return next;
              });
              resolve();
            } else {
              reject(new Error('Upload failed'));
            }
          };

          xhr.onerror = () => reject(new Error('Upload failed'));
          xhr.send(file);
        });
      } catch (error) {
        toast.error(`Failed to upload ${file.name}`);
        setActiveUploads(prev => {
          const next = { ...prev };
          delete next[file.name];
          return next;
        });
      }
    });

    await Promise.all(uploadPromises);
    fetchGallery();
  };

  const handleDeleteTrigger = (name) => {
    setSelectedItem({ name });
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    const name = selectedItem.name;
    setActionLoading(prev => ({ ...prev, delete: true }));
    setShowDeleteModal(false);
    try {
      const res = await fetch(`/api/admin/gallery?name=${encodeURIComponent(name)}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Deleted');
        setTimeout(fetchGallery, 1000);
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('Delete failed');
    } finally {
      setActionLoading(prev => ({ ...prev, delete: false }));
    }
  };

  const handleRename = async (e) => {
    e.preventDefault();
    setActionLoading(prev => ({ ...prev, rename: true }));
    try {
      const oldName = selectedItem.name;
      // ... same logic for newFullName ...
      let newFullName = '';
      if (selectedItem.isFolder) {
        const parts = oldName.split('/').filter(p => p);
        parts[parts.length - 1] = newName;
        newFullName = parts.join('/') + '/';
      } else {
        const parts = oldName.split('/');
        parts[parts.length - 1] = newName;
        newFullName = parts.join('/');
      }

      const res = await fetch('/api/admin/gallery/rename', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldName, newName: newFullName })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Renamed');
        setShowRenameModal(false);
        setTimeout(fetchGallery, 1000);
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('Rename failed');
    } finally {
      setActionLoading(prev => ({ ...prev, rename: false }));
    }
  };

  const handleMove = async (e) => {
    e.preventDefault();
    setActionLoading(prev => ({ ...prev, move: true }));
    try {
      const oldName = selectedItem.name;
      const fileName = selectedItem.isFolder ? oldName.split('/').filter(p => p).pop() + '/' : oldName.split('/').pop();
      const targetPrefix = movePath.endsWith('/') || movePath === '' ? movePath : `${movePath}/`;
      const newFullName = `${targetPrefix}${fileName}`;

      const res = await fetch('/api/admin/gallery/rename', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldName, newName: newFullName })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Moved successfully');
        setShowMoveModal(false);
        fetchGallery();
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('Move failed');
    } finally {
      setActionLoading(prev => ({ ...prev, move: false }));
    }
  };

  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard');
  };

  const navigateToFolder = (folderPrefix) => {
    setPrefix(folderPrefix);
  };

  const goBack = () => {
    if (prefix === ROOT_PREFIX) return;
    const parts = prefix.split('/').filter(p => p);
    parts.pop();
    const newPrefix = parts.length > 0 ? parts.join('/') + '/' : '';
    setPrefix(newPrefix.startsWith(ROOT_PREFIX) ? newPrefix : ROOT_PREFIX);
  };

  const renderBreadcrumbs = () => {
    // Hide 'listmein' from parts to treat it as Root in UI
    const parts = prefix.replace(ROOT_PREFIX, '').split('/').filter(p => p);
    return (
      <Breadcrumb>
        <Breadcrumb.Item onClick={() => setPrefix(ROOT_PREFIX)} active={prefix === ROOT_PREFIX}>
          {ROOT_PREFIX.split('/').filter(p => p).join('/')} (Root)
        </Breadcrumb.Item>
        {parts.map((part, index) => {
          const currentPrefix = ROOT_PREFIX + parts.slice(0, index + 1).join('/') + '/';
          return (
            <Breadcrumb.Item
              key={currentPrefix}
              onClick={() => setPrefix(currentPrefix)}
              active={index === parts.length - 1}
            >
              {part}
            </Breadcrumb.Item>
          );
        })}
      </Breadcrumb>
    );
  };

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Gallery System</h2>
          <p className="text-muted">Manage your media assets on Google Cloud Storage</p>
        </div>
        <div className="d-flex gap-2">
          <Button
            variant="outline-primary"
            onClick={() => setShowFolderModal(true)}
            disabled={Object.values(actionLoading).some(v => v)}
          >
            <FaFolderPlus className="me-2" /> New Folder
          </Button>
          <label className={`btn btn-primary mb-0 ${Object.values(activeUploads).length > 0 ? 'disabled' : ''}`}>
            <FaUpload className="me-2" />
            {Object.values(activeUploads).length > 0 ? 'Uploading...' : 'Upload Files'}
            <input
              type="file"
              multiple
              hidden
              onChange={handleFileUpload}
              disabled={Object.values(activeUploads).length > 0}
            />
          </label>
        </div>
      </div>

      {Object.entries(activeUploads).length > 0 && (
        <Card className="border-0 shadow-sm mb-4 bg-primary bg-opacity-10">
          <Card.Body className="py-2">
            <div className="d-flex align-items-center gap-3 overflow-auto py-1" style={{ whiteSpace: 'nowrap' }}>
              <strong className="small text-primary">Uploading:</strong>
              {Object.entries(activeUploads).map(([name, progress]) => (
                <div key={name} className="bg-white px-2 py-1 rounded shadow-xs d-flex align-items-center gap-2 border">
                  <span className="small text-truncate" style={{ maxWidth: '150px' }}>{name}</span>
                  <div className="progress" style={{ width: '60px', height: '6px' }}>
                    <div
                      className="progress-bar progress-bar-striped progress-bar-animated"
                      role="progressbar"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <small className="text-primary fw-bold">{progress}%</small>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      )}

      <Card className="border-0 shadow-sm mb-4">
        <Card.Header className="bg-white py-3 border-0">
          <div className="d-flex align-items-center gap-3">
            {prefix !== ROOT_PREFIX && (
              <Button variant="light" size="sm" onClick={goBack}>
                <FaArrowLeft />
              </Button>
            )}
            {renderBreadcrumbs()}
          </div>
        </Card.Header>
        <Card.Body className="p-4 bg-light bg-opacity-25" style={{ minHeight: '500px' }}>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Loading assets...</p>
            </div>
          ) : (
            <Row>
              {items.folders.map(folder => (
                <Col key={folder} xs={6} md={3} lg={2} className="mb-4">
                  <div className="gallery-item text-center">
                    <div
                      className="folder-icon p-4 mb-2 bg-white rounded shadow-sm cursor-pointer " style={{ height: '120px' }}
                      onClick={() => navigateToFolder(folder)}
                    >
                      <FaFolder size={48} className="text-warning" />
                    </div>
                    <div className="d-flex align-items-center justify-content-center gap-1">
                      <span className="text-truncate small fw-bold" title={folder.split('/').filter(p => p).pop()}>
                        {folder.split('/').filter(p => p).pop()}
                      </span>
                      <Dropdown align="end">
                        <Dropdown.Toggle as="div" className="cursor-pointer text-muted px-1">
                          <FaEllipsisV size={12} />
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="shadow-sm border-0">
                          <Dropdown.Item onClick={() => {
                            setSelectedItem({ name: folder, isFolder: true });
                            setNewName(folder.split('/').filter(p => p).pop());
                            setShowRenameModal(true);
                          }}>
                            <FaEdit className="me-2" /> Rename
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => {
                            setSelectedItem({ name: folder, isFolder: true });
                            setMovePath('');
                            setShowMoveModal(true);
                          }}>
                            <FaArrowsAlt className="me-2" /> Move
                          </Dropdown.Item>
                          <Dropdown.Divider />
                          <Dropdown.Item className="text-danger" onClick={() => handleDeleteTrigger(folder)}>
                            <FaTrash className="me-2" /> Delete
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                  </div>
                </Col>
              ))}

              {items.files.map(file => (
                <Col key={file.name} xs={6} md={3} lg={2} className="mb-4">
                  <div className="gallery-item text-center">
                    <div className="file-thumbnail mb-2 bg-white rounded shadow-sm overflow-hidden position-relative group d-flex align-items-center justify-content-center" style={{ height: '120px' }}>
                      {(() => {
                        const fileInfo = getFileIcon(file.name);
                        if (fileInfo.type === 'image') {
                          return (
                            <img
                              src={file.url}
                              alt={file.name}
                              className="w-100 h-100 object-fit-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          );
                        }
                        return (
                          <div className={`w-100 h-100 d-flex align-items-center justify-content-center bg-light ${fileInfo.color}`}>
                            <fileInfo.icon size={48} />
                          </div>
                        );
                      })()}
                      {/* Technical fallback inside same div */}
                      <div className="w-100 h-100 d-none align-items-center justify-content-center bg-light position-absolute top-0 start-0">
                        <FaFileAlt size={48} className="text-secondary" />
                      </div>
                    </div>
                    <div className="d-flex align-items-center justify-content-center gap-1">
                      <span className="text-truncate small fw-bold" title={file.name.split('/').pop()}>
                        {file.name.split('/').pop()}
                      </span>
                      <Dropdown align="end">
                        <Dropdown.Toggle as="div" className="cursor-pointer text-muted px-1">
                          <FaEllipsisV size={12} />
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="shadow-sm border-0">
                          <Dropdown.Item onClick={() => copyToClipboard(file.url)}>
                            <FaCopy className="me-2" /> Copy URL
                          </Dropdown.Item>
                          <Dropdown.Item href={file.url} target="_blank">
                            <FaExternalLinkAlt className="me-2" /> Preview
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => {
                            setSelectedItem({ name: file.name, isFolder: false });
                            setNewName(file.name.split('/').pop());
                            setShowRenameModal(true);
                          }}>
                            <FaEdit className="me-2" /> Rename
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => {
                            setSelectedItem({ name: file.name, isFolder: false });
                            setMovePath('');
                            setShowMoveModal(true);
                          }}>
                            <FaArrowsAlt className="me-2" /> Move
                          </Dropdown.Item>
                          <Dropdown.Divider />
                          <Dropdown.Item className="text-danger" onClick={() => handleDeleteTrigger(file.name)}>
                            <FaTrash className="me-2" /> Delete
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                  </div>
                </Col>
              ))}

              {items.folders.length === 0 && items.files.length === 0 && (
                <Col xs={12}>
                  <div className="text-center py-5">
                    <div className="display-4 text-muted mb-4 opacity-25">📂</div>
                    <h5 className="text-muted">This folder is empty</h5>
                    <p>Upload a file or create a folder to get started</p>
                  </div>
                </Col>
              )}
            </Row>
          )}
        </Card.Body>
      </Card>

      {/* New Folder Modal */}
      <Modal show={showFolderModal} onHide={() => setShowFolderModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Create New Folder</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateFolder}>
          <Modal.Body>
            <Form.Group>
              <Form.Label>Folder Name</Form.Label>
              <Form.Control
                type="text"
                value={folderName}
                onChange={e => setFolderName(e.target.value)}
                placeholder="Enter folder name"
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowFolderModal(false)} disabled={actionLoading.folder}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={actionLoading.folder}>
              {actionLoading.folder ? <Spinner size="sm" className="me-2" /> : null}
              Create Folder
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Rename Modal */}
      <Modal show={showRenameModal} onHide={() => setShowRenameModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Rename {selectedItem?.isFolder ? 'Folder' : 'File'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleRename}>
          <Modal.Body>
            <Form.Group>
              <Form.Label>New Name</Form.Label>
              <Form.Control
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowRenameModal(false)} disabled={actionLoading.rename}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={actionLoading.rename}>
              {actionLoading.rename ? <Spinner size="sm" className="me-2" /> : null}
              Rename
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Move Modal */}
      <Modal show={showMoveModal} onHide={() => setShowMoveModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Move {selectedItem?.isFolder ? 'Folder' : 'File'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleMove}>
          <Modal.Body>
            <Form.Group>
              <Form.Label>Target Path</Form.Label>
              <Form.Control
                type="text"
                value={movePath}
                onChange={e => setMovePath(e.target.value)}
                placeholder="e.g., images/backup/ (leave empty for root)"
              />
              <Form.Text className="text-muted">
                Specify the target folder path. Use forward slashes.
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowMoveModal(false)} disabled={actionLoading.move}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={actionLoading.move}>
              {actionLoading.move ? <Spinner size="sm" className="me-2" /> : null}
              Move
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete Item</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete <strong>{selectedItem?.name}</strong>?
          <p className="text-danger mt-2 small">This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setShowDeleteModal(false)} disabled={actionLoading.delete}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete} disabled={actionLoading.delete}>
            {actionLoading.delete ? <Spinner size="sm" className="me-2" /> : null}
            Delete Permanently
          </Button>
        </Modal.Footer>
      </Modal>

      <style jsx>{`
        .cursor-pointer { cursor: pointer; }
        .gallery-item:hover .thumbnail-overlay { opacity: 1; }
        .folder-icon:hover { background-color: #f8f9fa !important; transform: translateY(-2px); transition: all 0.2s; }
        .file-thumbnail:hover { transform: translateY(-2px); transition: all 0.2s; }
      `}</style>
    </Container>
  );
};

export default Gallery;
