'use client';

import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Table, Modal, Form, Nav, Tab, Row, Col, Badge } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaBars, FaSave, FaChevronRight, FaChevronDown, FaHeading, FaLink, FaList } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Sortable Item Component ---
const SortableItem = ({ item, level = 0, onEdit, onDelete, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : 'auto',
    opacity: isDragging ? 0.5 : 1,
    marginLeft: `${level * 30}px`
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-2">
      <Card className={`border-1 shadow-sm ${item.isActive ? '' : 'opacity-75 bg-light'}`}>
        <Card.Body className="py-2 px-3 d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-3 flex-grow-1">
            <div {...attributes} {...listeners} className="cursor-grab text-muted">
              <FaBars />
            </div>
            <div>
              <div className="fw-bold d-flex align-items-center gap-2">
                {item.icon && <span className="me-1">{item.icon}</span>}
                {item.title}
                {!item.isActive && <Badge bg="secondary" className="small">Disabled</Badge>}
              </div>
              <div className="small text-muted d-flex gap-2">
                <span className="font-monospace">{item.url}</span>
                {item.metaText && <span className="opacity-75">• {item.metaText}</span>}
              </div>
            </div>
          </div>
          <div className="d-flex gap-2">
            <Button variant="link" size="sm" className="text-primary p-1" onClick={() => onEdit(item)}>
              <FaEdit />
            </Button>
            <Button variant="link" size="sm" className="text-danger p-1" onClick={() => onDelete(item._id)}>
              <FaTrash />
            </Button>
          </div>
        </Card.Body>
      </Card>
      {children}
    </div>
  );
};

// --- Main Page Component ---
const MenuManagement = () => {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('header');
  const [showModal, setShowModal] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    parentId: '',
    type: 'header',
    footerSection: 'Quick Links',
    isActive: true,
    icon: '',
    metaText: ''
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    try {
      const res = await fetch('/api/admin/menus');
      const data = await res.json();
      if (data.success) {
        setMenus(data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch menus');
    } finally {
      setLoading(false);
    }
  };

  const handleShowModal = (menu = null) => {
    if (menu) {
      setEditingMenu(menu);
      setFormData({
        title: menu.title,
        url: menu.url,
        parentId: menu.parentId || '',
        type: menu.type,
        footerSection: menu.footerSection || 'Quick Links',
        isActive: menu.isActive,
        icon: menu.icon || '',
        metaText: menu.metaText || ''
      });
    } else {
      setEditingMenu(null);
      setFormData({
        title: '',
        url: '',
        parentId: '',
        type: activeTab,
        footerSection: 'Quick Links',
        isActive: true,
        icon: '',
        metaText: ''
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingMenu ? `/api/admin/menus/${editingMenu._id}` : '/api/admin/menus';
    const method = editingMenu ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editingMenu ? 'Menu updated' : 'Menu created');
        fetchMenus();
        setShowModal(false);
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this menu item and all its submenus?')) return;
    try {
      const res = await fetch(`/api/admin/menus/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Deleted successfully');
        fetchMenus();
      }
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeItem = menus.find(m => m._id === active.id);
    const overItem = menus.find(m => m._id === over.id);

    if (!activeItem || !overItem) return;

    // If dragging an item "over" another item that is not its sibling, 
    // we can change its parentId to the overItem's parentId.
    const newParentId = overItem.parentId;
    
    // Create a new array with updated relationships
    let updatedMenus = menus.map(m => {
      if (m._id === active.id) {
        return { ...m, parentId: newParentId };
      }
      return m;
    });

    // Reorder among the new siblings
    const siblings = updatedMenus
      .filter(m => m.type === activeTab && m.parentId === newParentId)
      .sort((a, b) => a.order - b.order);
    
    const oldIndex = siblings.findIndex(m => m._id === active.id);
    const overIndex = siblings.findIndex(m => m._id === over.id);
    
    const reorderedSiblings = arrayMove(siblings, oldIndex, overIndex);
    
    updatedMenus = updatedMenus.map(m => {
      const reorderIdx = reorderedSiblings.findIndex(rs => rs._id === m._id);
      if (reorderIdx !== -1) {
        return { ...m, order: reorderIdx };
      }
      return m;
    });

    setMenus(updatedMenus);

    try {
      await fetch('/api/admin/menus/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          items: updatedMenus
            .filter(m => m.type === activeTab)
            .map(m => ({ _id: m._id, order: m.order, parentId: m.parentId })) 
        })
      });
      toast.success('Position updated');
    } catch (error) {
      toast.error('Sorting failed');
      fetchMenus();
    }
  };

  const renderMenus = (parentId = null, level = 0) => {
    const filtered = menus.filter(m => m.type === activeTab && m.parentId === parentId)
                         .sort((a,b) => a.order - b.order);

    return (
      <SortableContext 
        items={filtered.map(m => m._id)} 
        strategy={verticalListSortingStrategy}
      >
        {filtered.map(item => (
          <SortableItem 
            key={item._id} 
            item={item} 
            level={level}
            onEdit={handleShowModal}
            onDelete={handleDelete}
          >
            {renderMenus(item._id, level + 1)}
          </SortableItem>
        ))}
      </SortableContext>
    );
  };

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Menu Management</h2>
          <p className="text-muted">Manage Header and Footer navigation</p>
        </div>
        <Button variant="primary" onClick={() => handleShowModal()}>
          <FaPlus className="me-2" /> Add Menu Item
        </Button>
      </div>

      <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
        <Card className="border-0 shadow-sm overflow-hidden mb-4">
          <Card.Header className="bg-white border-bottom-0 pt-3 px-3">
            <Nav variant="tabs" className="admin-tabs">
              <Nav.Item>
                <Nav.Link eventKey="header" className="d-flex align-items-center gap-2">
                  <FaHeading /> Header Menu
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="footer" className="d-flex align-items-center gap-2">
                  <FaList /> Footer Menu
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </Card.Header>
          <Card.Body className="p-4 bg-light bg-opacity-25">
            <div style={{ minHeight: '400px' }}>
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                {renderMenus()}
              </DndContext>
              
              {!loading && menus.filter(m => m.type === activeTab).length === 0 && (
                <div className="text-center py-5">
                  <div className="display-1 text-muted mb-4 opacity-25">🗂️</div>
                  <h4 className="text-muted">No menu items found</h4>
                  <p>Start by adding a new item to your {activeTab} menu</p>
                </div>
              )}
            </div>
          </Card.Body>
        </Card>
      </Tab.Container>

      {/* Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingMenu ? 'Edit Menu Item' : 'Add Menu Item'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control 
                type="text" 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})}
                required 
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>URL / Path</Form.Label>
              <Form.Control 
                type="text" 
                value={formData.url} 
                onChange={e => setFormData({...formData, url: e.target.value})}
                placeholder="/courses or https://..."
                required 
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Icon (Emoji or Class)</Form.Label>
                  <Form.Control 
                    type="text" 
                    value={formData.icon} 
                    onChange={e => setFormData({...formData, icon: e.target.value})}
                    placeholder="e.g., 🎸 or fa-music"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Meta Text (Sub-description)</Form.Label>
                  <Form.Control 
                    type="text" 
                    value={formData.metaText} 
                    onChange={e => setFormData({...formData, metaText: e.target.value})}
                    placeholder="e.g., Beginner to Advanced"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Parent Item (Any Level)</Form.Label>
                  <Form.Select 
                    value={formData.parentId} 
                    onChange={e => setFormData({...formData, parentId: e.target.value})}
                  >
                    <option value="">None (Top Level)</option>
                    {(() => {
                      const options = [];
                      const buildOptions = (parentId = null, level = 0) => {
                        menus
                          .filter(m => m.type === activeTab && m.parentId === parentId && (!editingMenu || m._id !== editingMenu._id))
                          .sort((a, b) => a.order - b.order)
                          .forEach(m => {
                            options.push(
                              <option key={m._id} value={m._id}>
                                {'\u00A0'.repeat(level * 4)} {level > 0 ? '↳ ' : ''}{m.title}
                              </option>
                            );
                            buildOptions(m._id, level + 1);
                          });
                      };
                      buildOptions();
                      return options;
                    })()}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Type</Form.Label>
                  <Form.Select 
                    value={formData.type} 
                    onChange={e => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="header">Header</option>
                    <option value="footer">Footer</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            {formData.type === 'footer' && (
              <Form.Group className="mb-3">
                <Form.Label>Footer Section</Form.Label>
                <Form.Control 
                  type="text" 
                  value={formData.footerSection} 
                  onChange={e => setFormData({...formData, footerSection: e.target.value})}
                  placeholder="e.g., Quick Links, Programs"
                />
              </Form.Group>
            )}

            <Form.Check 
              type="switch"
              label="Active"
              checked={formData.isActive}
              onChange={e => setFormData({...formData, isActive: e.target.checked})}
              className="mt-3"
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Save Changes</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default MenuManagement;
