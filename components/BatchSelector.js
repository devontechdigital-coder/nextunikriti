'use client';

import { useState } from 'react';
import { Button, Card, Badge, Spinner, Modal } from 'react-bootstrap';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaClock, FaCalendarAlt, FaUser, FaCheckCircle } from 'react-icons/fa';

export default function BatchSelector({ courseId, initialBatches = [] }) {
    const [selectedBatchId, setSelectedBatchId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handlePurchase = async () => {
        if (!selectedBatchId) {
            toast.error('Please select a batch first');
            return;
        }

        setLoading(true);
        try {
            const res = await axios.post('/api/orders', { batch_id: selectedBatchId });
            
            if (res.data.success) {
                const { gateway, order, url, id, key } = res.data;

                if (gateway === 'stripe' && url) {
                    window.location.href = url;
                } else if (gateway === 'razorpay' && order) {
                    const options = {
                        key: key,
                        amount: order.amount,
                        currency: order.currency,
                        name: 'Unikriti',
                        description: 'Batch Enrollment',
                        order_id: order.id,
                        handler: async function (response) {
                            try {
                                const verifyRes = await axios.post('/api/payments/verify', {
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature,
                                    paymentDbId: order.receipt
                                });
                                if (verifyRes.data.success) {
                                    toast.success('Enrollment successful!');
                                    window.location.href = '/student/my-courses';
                                }
                            } catch (err) {
                                toast.error('Payment verification failed');
                            }
                        },
                        prefill: {
                            name: '',
                            email: '',
                        },
                        theme: { color: '#000000' }
                    };
                    const rzp = new window.Razorpay(options);
                    rzp.open();
                }
            }
        } catch (error) {
            console.error('Purchase Error:', error);
            toast.error(error.response?.data?.message || 'Failed to initiate purchase');
        } finally {
            setLoading(false);
            setShowConfirm(false);
        }
    };

    if (!initialBatches || initialBatches.length === 0) {
        return (
            <div className="u-card mt-4 p-4 text-center">
                <h5 className="text-muted mb-0">No active batches available at the moment.</h5>
                <p className="small text-muted mt-2">Check back later or contact us for upcoming schedules.</p>
            </div>
        );
    }

    return (
        <div className="batch-selector-container mt-4">
            <h3 className="u-sec-title mb-3">Select Your Batch</h3>
            <div className="row g-3">
                {initialBatches.map((batch) => {
                    const isSelected = selectedBatchId === batch._id;
                    const isFull = batch.available_seats <= 0;

                    return (
                        <div className="col-12" key={batch._id}>
                            <div 
                                className={`u-batch-card ${isSelected ? 'selected' : ''} ${isFull ? 'disabled' : ''}`}
                                onClick={() => !isFull && setSelectedBatchId(batch._id)}
                            >
                                <div className="d-flex justify-content-between align-items-start h-100">
                                    <div className="flex-grow-1">
                                        <div className="d-flex align-items-center gap-2 mb-2">
                                            <h5 className="mb-0 fw-bold">{batch.batchName}</h5>
                                            {isFull ? (
                                                <Badge bg="danger">Batch Full</Badge>
                                            ) : batch.available_seats < 5 ? (
                                                <Badge bg="warning" text="dark">Only {batch.available_seats} seats left!</Badge>
                                            ) : (
                                                <Badge bg="success">{batch.available_seats} seats available</Badge>
                                            )}
                                        </div>
                                        
                                        <div className="u-batch-meta">
                                            <span><FaUser size={12} className="me-1" /> {batch.teacherId?.name || 'Instructor'}</span>
                                            <span><FaCalendarAlt size={12} className="me-1" /> Starts {new Date(batch.startDate).toLocaleDateString()}</span>
                                        </div>

                                        <div className="u-batch-timetable mt-2">
                                            {batch.timetable?.map((slot, i) => (
                                                <div key={i} className="small text-muted d-flex align-items-center gap-1">
                                                    <FaClock size={10} /> {slot.day}: {slot.time}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="text-end ms-3">
                                        <div className="u-batch-price">₹{batch.price.toLocaleString()}</div>
                                        {isSelected && <div className="text-primary mt-2"><FaCheckCircle size={24} /></div>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 d-grid">
                <Button 
                    variant="dark" 
                    size="lg" 
                    className="u-btn-enroll border-0 shadow-sm"
                    disabled={!selectedBatchId || loading}
                    onClick={() => setShowConfirm(true)}
                >
                    {loading ? <Spinner size="sm" className="me-2" /> : null}
                    {selectedBatchId ? 'Enroll in Selected Batch' : 'Select a Batch to Enroll'}
                </Button>
            </div>

            <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="fw-bold">Confirm Enrollment</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>You are about to enroll in the following batch:</p>
                    {selectedBatchId && (() => {
                        const b = initialBatches.find(x => x._id === selectedBatchId);
                        if (!b) return null;
                        return (
                            <div className="bg-light p-3 rounded border">
                                <h6 className="fw-bold mb-1">{b.batchName}</h6>
                                <div className="small text-muted">{b.teacherId?.name}</div>
                                <div className="mt-2 fw-bold text-primary">Total: ₹{b.price.toLocaleString()}</div>
                            </div>
                        );
                    })()}
                    <p className="mt-3 small text-muted">You will be redirected to the secure payment gateway to complete your request.</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={() => setShowConfirm(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handlePurchase} disabled={loading}>
                        {loading ? <Spinner size="sm" /> : 'Confirm & Pay'}
                    </Button>
                </Modal.Footer>
            </Modal>

            <style jsx>{`
                .u-batch-card {
                    border: 2px solid #eee;
                    border-radius: 12px;
                    padding: 20px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    background: #fff;
                }
                .u-batch-card:hover:not(.disabled) {
                    border-color: #ddd;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                }
                .u-batch-card.selected {
                    border-color: #0d6efd;
                    background-color: #f8fbff;
                }
                .u-batch-card.disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    background-color: #fafafa;
                }
                .u-batch-meta {
                    display: flex;
                    gap: 15px;
                    font-size: 0.85rem;
                    color: #666;
                }
                .u-batch-price {
                    font-size: 1.25rem;
                    font-weight: 800;
                    color: #000;
                }
                .u-btn-enroll {
                    background: #000;
                    padding: 16px;
                    font-weight: 700;
                    border-radius: 10px;
                }
                .u-btn-enroll:disabled {
                    background: #666;
                }
            `}</style>
        </div>
    );
}
