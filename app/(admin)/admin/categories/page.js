'use client';
import { useState, useMemo } from 'react';
import { Container, Button, Modal, Form, Spinner, Alert, Badge, Card, ListGroup, InputGroup, Nav, Row, Col } from 'react-bootstrap';
import { 
  useGetAdminCategoriesQuery, 
  useCreateAdminCategoryMutation, 
  useUpdateAdminCategoryMutation, 
  useDeleteAdminCategoryMutation 
} from '@/redux/api/apiSlice';
import { FaEdit, FaTrash, FaPlus, FaCheckCircle, FaTag, FaLink, FaChevronRight, FaChevronDown, FaFolder, FaFolderOpen, FaSearch, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';

// Recursive Category Node Component
const CategoryNode = ({ category, level = 0, onEdit, onDelete, onAdd }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div className="category-node-wrapper">
      <div 
        className="d-flex align-items-center p-2 rounded hover-bg border-bottom"
        style={{ marginLeft: `${level * 24}px` }}
      >
        <div className="d-flex align-items-center flex-grow-1 gap-2">
          {hasChildren ? (
            <div 
              className="cursor-pointer text-muted px-1" 
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
            </div>
          ) : (
            <div style={{ width: '20px' }} />
          )}

          <div className="category-icon text-primary bg-light rounded p-2 border d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
            {hasChildren ? (isExpanded ? <FaFolderOpen /> : <FaFolder />) : <FaTag />}
          </div>

          <div className="ms-2">
            <div className="fw-bold text-dark d-flex align-items-center gap-2">
              {category.name}
              {category.icon && <Badge bg="info" className="small fw-normal">{category.icon}</Badge>}
            </div>
            <div className="text-muted small d-flex align-items-center gap-1">
              <FaLink size={10} /> {category.slug}
            </div>
          </div>
        </div>

        <div className="d-flex gap-2 text-nowrap align-items-center">
          <Button 
            variant="link" 
            size="sm" 
            className="text-success p-1" 
            title="Add Sub-category"
            onClick={() => onAdd(category._id)}
          >
            <FaPlus />
          </Button>
          <Button variant="link" size="sm" className="text-primary p-1" onClick={() => onEdit(category)}>
            <FaEdit />
          </Button>
          <Button variant="link" size="sm" className="text-danger p-1" onClick={() => onDelete(category)}>
            <FaTrash />
          </Button>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="category-children">
          {category.children.map((child, index) => (
            <CategoryNode 
              key={`${child._id}-${index}`} 
              category={child} 
              level={level + 1} 
              onEdit={onEdit} 
              onDelete={onDelete} 
              onAdd={onAdd}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function AdminCategoriesPage() {
  const { data, isLoading, isError, error } = useGetAdminCategoriesQuery();
  const [createCategory, { isLoading: isCreating }] = useCreateAdminCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateAdminCategoryMutation();
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteAdminCategoryMutation();

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [parentSearch, setParentSearch] = useState('');

  const [formData, setFormData] = useState({ 
    name: '', 
    slug: '', 
    icon: '', 
    image: '',
    parentId: null,
    description: '',
    shortDescription: '',
    highlights: [],
    faq: [],
    metaTitle: '',
    metaDescription: '',
    metaKeywords: ''
  });

  const [descEditorMode, setDescEditorMode] = useState('text'); // 'text' | 'code'
  const [activeTab, setActiveTab] = useState('basic');

  const addFaqItem = () => setFormData(f => ({ ...f, faq: [...f.faq, { question: '', answer: '' }] }));
  const removeFaqItem = (idx) => setFormData(f => ({ ...f, faq: f.faq.filter((_, i) => i !== idx) }));
  const updateFaqItem = (idx, field, value) => setFormData(f => {
    const updated = [...f.faq];
    updated[idx] = { ...updated[idx], [field]: value };
    return { ...f, faq: updated };
  });
  
  const addHighlight = () => setFormData(f => ({ ...f, highlights: [...f.highlights, ''] }));
  const removeHighlight = (idx) => setFormData(f => ({ ...f, highlights: f.highlights.filter((_, i) => i !== idx) }));
  const updateHighlight = (idx, value) => setFormData(f => {
    const updated = [...f.highlights];
    updated[idx] = value;
    return { ...f, highlights: updated };
  });

  // Transform flat categories into a tree (nodes can repeat if they have multiple parents)
  const categoryTree = useMemo(() => {
    if (!data?.data) return [];
    const categories = data.data;
    
    const buildTree = (parentId = null) => {
      return categories
        .filter(cat => {
          if (parentId === null) {
            return !cat.parentId;
          }
          return cat.parentId === parentId;
        })
        .map(cat => ({
          ...cat,
          children: buildTree(cat._id)
        }));
    };

    return buildTree();
  }, [data]);

  const handleOpenModal = (category = null, defaultParentId = null) => {
    setParentSearch('');
    if (category) {
      setEditingCategory(category);
      setFormData({ 
        name: category.name || '', 
        slug: category.slug || '', 
        icon: category.icon || '', 
        image: category.image || '',
        parentId: category.parentId || null,
        description: category.description || '',
        shortDescription: category.shortDescription || '',
        highlights: Array.isArray(category.highlights) ? category.highlights : [],
        faq: Array.isArray(category.faq) ? category.faq : [],
        metaTitle: category.metaTitle || '',
        metaDescription: category.metaDescription || '',
        metaKeywords: category.metaKeywords || ''
      });
    } else {
      setEditingCategory(null);
      setFormData({ 
        name: '', 
        slug: '', 
        icon: '', 
        image: '', 
        parentId: defaultParentId || null,
        description: '',
        shortDescription: '',
        highlights: [],
        faq: [],
        metaTitle: '',
        metaDescription: '',
        metaKeywords: ''
      });
    }
    setShowModal(true);
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    setFormData({ ...formData, name, slug });
  };

  const setParent = (catId) => {
    setFormData({ ...formData, parentId: catId === formData.parentId ? null : catId });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await updateCategory({ id: editingCategory._id, ...formData }).unwrap();
        toast.success('Category updated successfully!');
      } else {
        await createCategory(formData).unwrap();
        toast.success('Category created successfully!');
      }
      setShowModal(false);
    } catch (err) {
      toast.error(err?.data?.error || 'Failed to save category');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCategory(categoryToDelete._id).unwrap();
      toast.success('Category deleted successfully!');
      setShowDeleteModal(false);
    } catch (err) {
      toast.error('Failed to delete category');
    }
  };

  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Loading categories...</p>
      </Container>
    );
  }

  const allCategories = data?.data || [];

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Category Management</h2>
          <p className="text-muted small mb-0">Organize your platform with a hierarchical category structure.</p>
        </div>
        <Button variant="primary" className="d-flex align-items-center gap-2 shadow-sm" onClick={() => handleOpenModal()}>
          <FaPlus /> Add Category
        </Button>
      </div>

      {isError && (
        <Alert variant="danger" className="mb-4 shadow-sm border-0">
          <p className="mb-0">Failed to load categories: {error?.data?.error || 'Unknown error'}</p>
        </Alert>
      )}

      <Card className="shadow-sm border-0">
        <Card.Header className="bg-white py-3 border-bottom">
          <div className="fw-bold flex-grow-1">Category Tree Visualization</div>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="category-tree-container p-3">
            {categoryTree.length > 0 ? (
              categoryTree.map((rootNode, idx) => (
                <CategoryNode 
                  key={`${rootNode._id}-${idx}`} 
                  category={rootNode} 
                  onEdit={handleOpenModal} 
                  onDelete={(cat) => { setCategoryToDelete(cat); setShowDeleteModal(true); }} 
                  onAdd={(pid) => handleOpenModal(null, pid)}
                />
              ))
            ) : (
              <div className="text-center py-5 text-muted">
                No categories found. Start by adding one!
              </div>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* Create/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">{editingCategory ? 'Edit Category' : 'Create Category'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="p-4 px-lg-5">
            <Nav variant="tabs" className="mb-3" activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
              <Nav.Item>
                <Nav.Link eventKey="basic" className="fw-bold small text-uppercase">Basic Info</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="content" className="fw-bold small text-uppercase">Landing Content</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="faq" className="fw-bold small text-uppercase">FAQ</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="seo" className="fw-bold small text-uppercase">SEO</Nav.Link>
              </Nav.Item>
            </Nav>

            <div className={activeTab === 'basic' ? '' : 'd-none'}>
              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold small text-muted text-uppercase">Name</Form.Label>
                    <Form.Control 
                      type="text" 
                      placeholder="e.g., Web Development"
                      required 
                      value={formData.name}
                      onChange={handleNameChange}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold small text-muted text-uppercase">Slug</Form.Label>
                    <Form.Control 
                      type="text" 
                      required 
                      value={formData.slug}
                      onChange={(e) => setFormData({...formData, slug: e.target.value})}
                    />
                  </Form.Group>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <Form.Group>
                        <Form.Label className="fw-bold small text-muted text-uppercase">Icon</Form.Label>
                        <Form.Control 
                          type="text" 
                          placeholder="FaCode"
                          value={formData.icon}
                          onChange={(e) => setFormData({...formData, icon: e.target.value})}
                        />
                      </Form.Group>
                    </div>
                    <div className="col-md-6 mb-3">
                      <Form.Group>
                        <Form.Label className="fw-bold small text-muted text-uppercase">Image URL</Form.Label>
                        <Form.Control 
                          type="text" 
                          placeholder="https://..."
                          value={formData.image}
                          onChange={(e) => setFormData({...formData, image: e.target.value})}
                        />
                      </Form.Group>
                    </div>
                  </div>
                </div>

                <div className="col-md-6 border-start ps-md-4">
                  <Form.Label className="fw-bold small text-muted text-uppercase d-block mb-2">
                    Parent Selection
                  </Form.Label>
                  
                  {formData.parentId && (
                    <div className="mb-3">
                      {(() => {
                        const cat = allCategories.find(c => c._id.toString() === formData.parentId.toString());
                        return cat ? (
                          <Badge bg="primary" className="d-flex align-items-center gap-2 py-2 px-3 w-fit">
                            {cat.name}
                            <FaTimes className="cursor-pointer" onClick={() => setFormData({ ...formData, parentId: null })} />
                          </Badge>
                        ) : null;
                      })()}
                    </div>
                  )}

                  <InputGroup className="mb-2 shadow-sm">
                    <InputGroup.Text className="bg-white border-end-0">
                      <FaSearch className="text-muted" />
                    </InputGroup.Text>
                    <Form.Control
                      placeholder="Search tree..."
                      value={parentSearch}
                      onChange={(e) => setParentSearch(e.target.value)}
                      className="border-start-0"
                    />
                  </InputGroup>

                  <div className="border rounded bg-light p-2" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                     {(() => {
                        const TreeSelectorNode = ({ node, level = 0 }) => {
                          const isSelected = formData.parentId === node._id;
                          const isSelf = editingCategory && node._id === editingCategory._id;
                          const matchesSearch = node.name.toLowerCase().includes(parentSearch.toLowerCase());
                          const hasVisibleChildren = node.children && node.children.some(child => 
                            child.name.toLowerCase().includes(parentSearch.toLowerCase()) || 
                            (child.children && child.children.length > 0)
                          );

                          if (!matchesSearch && !hasVisibleChildren && parentSearch) return null;

                          return (
                            <div key={node._id}>
                              <div 
                                className={`d-flex align-items-center gap-2 p-1 rounded cursor-pointer ${isSelected ? 'bg-primary text-white' : 'hover-bg-light'} ${isSelf ? 'opacity-50' : ''}`}
                                style={{ marginLeft: `${level * 16}px` }}
                                onClick={() => !isSelf && setParent(node._id)}
                              >
                                <div className="d-flex align-items-center justify-content-center" style={{ width: '20px' }}>
                                  {isSelected ? <FaCheckCircle size={12} /> : <div className="border rounded-circle" style={{ width: '12px', height: '12px' }} />}
                                </div>
                                <span className="small">{node.name}</span>
                              </div>
                              {node.children && node.children.map(child => (
                                <TreeSelectorNode key={child._id} node={child} level={level + 1} />
                              ))}
                            </div>
                          );
                        };

                        return categoryTree.map((root, i) => <TreeSelectorNode key={`${root._id}-${i}`} node={root} />);
                     })()}
                  </div>
                </div>
              </div>
            </div>

            <div className={activeTab === 'content' ? '' : 'd-none'}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold small text-muted text-uppercase">Short Description</Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={2} 
                  placeholder="Brief summary for landing page..."
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({...formData, shortDescription: e.target.value})}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <Form.Label className="fw-bold small text-muted text-uppercase mb-0">Full Description</Form.Label>
                  <Nav variant="pills" className="small" activeKey={descEditorMode} onSelect={(k) => setDescEditorMode(k)}>
                    <Nav.Item><Nav.Link eventKey="text" className="py-1 px-2">Text</Nav.Link></Nav.Item>
                    <Nav.Item><Nav.Link eventKey="code" className="py-1 px-2">Code</Nav.Link></Nav.Item>
                  </Nav>
                </div>
                <Form.Control 
                  as="textarea" 
                  rows={8} 
                  placeholder="Detailed program content (HTML supported)..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className={descEditorMode === 'code' ? 'font-monospace small bg-dark text-light border-0' : ''}
                />
              </Form.Group>

        <Form.Group className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <Form.Label className="fw-bold small text-muted text-uppercase mb-0">Program Highlights</Form.Label>
            <Button variant="outline-primary" size="sm" onClick={addHighlight}>
              <FaPlus className="me-1" /> Add Highlight
            </Button>
          </div>
          {formData.highlights.length === 0 ? (
            <div className="text-center py-3 bg-light rounded border border-dashed mb-3">
              <p className="text-muted extra-small mb-0">No highlights added yet.</p>
            </div>
          ) : (
            <div className="mb-3">
              {formData.highlights.map((h, idx) => (
                <div key={idx} className="d-flex align-items-center gap-2 mb-2">
                  <Form.Control 
                    type="text" 
                    size="sm"
                    placeholder="e.g., Learn from expert instructors"
                    value={h}
                    onChange={(e) => updateHighlight(idx, e.target.value)}
                  />
                  <Button variant="outline-danger" size="sm" onClick={() => removeHighlight(idx)}>
                    <FaTimes />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Form.Group>
      </div>

            <div className={activeTab === 'faq' ? '' : 'd-none'}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold mb-0">Dynamic FAQ Section</h6>
                <Button variant="outline-primary" size="sm" onClick={addFaqItem}>
                  <FaPlus className="me-1" /> Add Question
                </Button>
              </div>
              {formData.faq.length === 0 ? (
                <div className="text-center py-4 bg-light rounded border border-dashed">
                  <p className="text-muted small mb-0">No FAQ items yet. Click add to start.</p>
                </div>
              ) : (
                formData.faq.map((item, idx) => (
                  <div key={idx} className="bg-light p-3 rounded mb-3 border relative">
                       <Button 
                         variant="link" 
                         className="text-danger position-absolute top-0 end-0 p-2" 
                         onClick={() => removeFaqItem(idx)}
                       >
                         <FaTrash size={12} />
                       </Button>
                       <Form.Group className="mb-2">
                         <Form.Label className="extra-small fw-bold text-muted text-uppercase">Question</Form.Label>
                         <Form.Control 
                           type="text" 
                           size="sm"
                           value={item.question}
                           onChange={(e) => updateFaqItem(idx, 'question', e.target.value)}
                         />
                       </Form.Group>
                       <Form.Group className="mb-0">
                         <Form.Label className="extra-small fw-bold text-muted text-uppercase">Answer</Form.Label>
                         <Form.Control 
                           as="textarea" 
                           rows={2}
                           size="sm"
                           value={item.answer}
                           onChange={(e) => updateFaqItem(idx, 'answer', e.target.value)}
                         />
                       </Form.Group>
                    </div>
                  ))
                )}
            </div>

            <div className={activeTab === 'seo' ? '' : 'd-none'}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold small text-muted text-uppercase">Meta Title</Form.Label>
                <Form.Control 
                  type="text" 
                  value={formData.metaTitle}
                  onChange={(e) => setFormData({...formData, metaTitle: e.target.value})}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold small text-muted text-uppercase">Meta Description</Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={3}
                  value={formData.metaDescription}
                  onChange={(e) => setFormData({...formData, metaDescription: e.target.value})}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold small text-muted text-uppercase">Meta Keywords</Form.Label>
                <Form.Control 
                  type="text" 
                  placeholder="keyword1, keyword2..."
                  value={formData.metaKeywords}
                  onChange={(e) => setFormData({...formData, metaKeywords: e.target.value})}
                />
              </Form.Group>
            </div>
          </Modal.Body>
          <Modal.Footer className="bg-light">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={isCreating || isUpdating} className="px-4">
              {isCreating || isUpdating ? <Spinner size="sm" /> : editingCategory ? 'Update' : 'Create'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered size="sm">
        <Modal.Body className="text-center p-4">
          <div className="text-danger mb-3">
            <FaTrash size={40} />
          </div>
          <h5 className="fw-bold">Delete Category?</h5>
          <p className="text-muted small">Are you sure you want to delete <strong>{categoryToDelete?.name}</strong>? This will remove it from the tree.</p>
          <div className="d-grid gap-2">
            <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? <Spinner size="sm" /> : 'Confirm Delete'}
            </Button>
            <Button variant="light" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          </div>
        </Modal.Body>
      </Modal>

      <style jsx global>{`
        .hover-bg:hover {
          background-color: #f8f9fa;
        }
        .cursor-pointer {
          cursor: pointer;
        }
        .hover-bg-light:hover {
          background-color: #e9ecef;
        }
        .category-children {
          border-left: 1px dashed #dee2e6;
          margin-left: 18px;
        }
        .w-fit {
          width: fit-content;
        }
        .extra-small {
          font-size: 0.7rem;
        }
        .relative {
          position: relative;
        }
      `}</style>
    </Container>
  );
}
