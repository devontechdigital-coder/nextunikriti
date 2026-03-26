'use client';

import { useState, useEffect } from 'react';
import { Container, Table, Badge, Button, Form, Spinner, Row, Col, Card } from 'react-bootstrap';
import axios from 'axios';
import toast from 'react-hot-toast';
import { MdSearch, MdFilterList, MdCheckCircle, MdCancel, MdPayment } from 'react-icons/md';

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [courseFilter, setCourseFilter] = useState('');

    const fetchOrders = async () => {
        try {
            const res = await axios.get('/api/admin/orders');
            if (res.data.success) {
                setOrders(res.data.data);
            }
        } catch (error) {
            toast.error('Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleAction = async (id, action) => {
        setActionLoading(id);
        try {
            const res = await axios.patch('/api/admin/orders', { enrollmentId: id, action });
            if (res.data.success) {
                toast.success(`Succesfully performed: ${action}`);
                fetchOrders();
            }
        } catch (error) {
            toast.error(error.response?.data?.error || 'Action failed');
        } finally {
            setActionLoading(null);
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = 
            order.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.courseId?.title?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === '' || order.status === statusFilter;
        const matchesCourse = courseFilter === '' || order.courseId?._id === courseFilter;
        
        return matchesSearch && matchesStatus && matchesCourse;
    });

    const getStatusBadge = (status) => {
        switch (status) {
            case 'active': return <Badge bg="success">Active</Badge>;
            case 'pending_payment': return <Badge bg="warning" text="dark">Pending Payment</Badge>;
            case 'suspended': return <Badge bg="danger">Rejected / Suspended</Badge>;
            default: return <Badge bg="secondary">{status}</Badge>;
        }
    };

    const getPaymentBadge = (status) => {
        switch (status) {
            case 'paid': return <Badge bg="success">✅ Paid</Badge>;
            case 'pending': return <Badge bg="warning" text="dark">🕒 Pending</Badge>;
            default: return <Badge bg="secondary">{status}</Badge>;
        }
    };

    // Unique courses list for filter dropdown
    const uniqueCourses = [...new Set(orders.map(o => o.courseId).filter(Boolean).map(c => JSON.stringify({id: c._id, title: c.title})))].map(s => JSON.parse(s));

    if (loading) {
        return <div className="p-5 text-center"><Spinner animation="border" variant="primary" /></div>;
    }

    return (
        <Container fluid className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="fw-bold mb-0">Course Enrollment Orders</h4>
                <div className="text-muted small">Total Orders: {orders.length}</div>
            </div>

            <Card className="shadow-sm border-0 mb-4">
                <Card.Body className="p-3">
                    <Row className="g-3 align-items-end">
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label className="small fw-bold">Search</Form.Label>
                                <div className="input-group">
                                    <span className="input-group-text bg-white border-end-0"><MdSearch /></span>
                                    <Form.Control 
                                        placeholder="User name, email or course..." 
                                        className="border-start-0"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label className="small fw-bold">Enrollment Status</Form.Label>
                                <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                    <option value="">All Statuses</option>
                                    <option value="active">Active</option>
                                    <option value="pending_payment">Pending Payment</option>
                                    <option value="suspended">Rejected</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label className="small fw-bold">Filter by Course</Form.Label>
                                <Form.Select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
                                    <option value="">All Courses</option>
                                    {uniqueCourses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Button variant="light" className="w-100 fw-bold border" onClick={() => {setSearchTerm(''); setStatusFilter(''); setCourseFilter('');}}>
                                Reset
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <div className="bg-white rounded-3 shadow-sm border overflow-hidden">
                <Table responsive hover className="mb-0 align-middle">
                    <thead className="bg-light">
                        <tr>
                            <th className="px-4 py-3">Student</th>
                            <th>Course / Plan</th>
                            <th>Status (Enroll)</th>
                            <th>Payment</th>
                            <th>Purchase Date</th>
                            <th className="text-end px-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.length > 0 ? filteredOrders.map((order) => (
                            <tr key={order._id}>
                                <td className="px-4 py-3">
                                    <div className="fw-bold">{order.userId?.name || 'Unknown'}</div>
                                    <div className="small text-muted">{order.userId?.email || order.userId?.phone}</div>
                                </td>
                                <td>
                                    <div className="fw-semibold">{order.courseId?.title || 'Unknown Course'}</div>
                                    <div className="small text-primary">{order.packageId?.name || 'No Plan'} — ₹{order.packageId?.price?.toLocaleString() || 0}</div>
                                </td>
                                <td>{getStatusBadge(order.status)}</td>
                                <td>
                                    {getPaymentBadge(order.paymentStatus)}
                                    <div className="x-small text-muted mt-1">Mode: {order.paymentId?.gateway === 'pay_later' ? 'Pay Later 🕒' : order.paymentId?.gateway || 'N/A'}</div>
                                </td>
                                <td>
                                    <div className="small">{new Date(order.createdAt).toLocaleDateString()}</div>
                                    <div className="very-small text-muted">{new Date(order.createdAt).toLocaleTimeString()}</div>
                                </td>
                                <td className="text-end px-4">
                                    <div className="d-flex justify-content-end gap-2">
                                        {order.status === 'pending_payment' && (
                                            <>
                                                <Button 
                                                    variant="success" 
                                                    size="sm" 
                                                    onClick={() => handleAction(order._id, 'approve')}
                                                    disabled={actionLoading === order._id}
                                                >
                                                    <MdCheckCircle className="me-1" /> Approve
                                                </Button>
                                                <Button 
                                                    variant="outline-danger" 
                                                    size="sm" 
                                                    onClick={() => handleAction(order._id, 'reject')}
                                                    disabled={actionLoading === order._id}
                                                >
                                                    <MdCancel className="me-1" /> Reject
                                                </Button>
                                            </>
                                        )}
                                        {order.paymentStatus === 'pending' && order.status === 'active' && (
                                            <Button 
                                                variant="outline-primary" 
                                                size="sm" 
                                                onClick={() => handleAction(order._id, 'mark_paid')}
                                                disabled={actionLoading === order._id}
                                            >
                                                <MdPayment className="me-1" /> Mark Paid
                                            </Button>
                                        )}
                                        {actionLoading === order._id && <Spinner size="sm" animation="border" />}
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="6" className="text-center py-5 text-muted">No matching orders found.</td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </div>
            <style jsx>{`
                .x-small { font-size: 0.75rem; }
                .very-small { font-size: 0.7rem; }
            `}</style>
        </Container>
    );
}
