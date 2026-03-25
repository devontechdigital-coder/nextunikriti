'use client';

import { useState, useEffect } from 'react';
import { Button, Card, Badge, Spinner, Modal, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaCheckCircle, FaRegCircle, FaStar, FaBolt, FaCrown } from 'react-icons/fa';

export default function PackageSelector({ courseId, initialPackages = [] }) {
    const [selectedPkgId, setSelectedPkgId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Auto-select highest priced package on mount
    useEffect(() => {
        if (initialPackages && initialPackages.length > 0) {
            const sorted = [...initialPackages].sort((a, b) => b.price - a.price);
            setSelectedPkgId(sorted[0]._id);
        }
    }, [initialPackages]);

    const handlePurchase = async () => {
        if (!selectedPkgId) {
            toast.error('Please select a package first');
            return;
        }

        setLoading(true);
        try {
            const res = await axios.post('/api/orders', { package_id: selectedPkgId });
            
            if (res.data.success) {
                const { gateway, order, url, key } = res.data;

                if (gateway === 'stripe' && url) {
                    window.location.href = url;
                } else if (gateway === 'razorpay' && order) {
                    const options = {
                        key: key,
                        amount: order.amount,
                        currency: order.currency,
                        name: 'Unikriti',
                        description: 'Course Enrollment',
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
            toast.error(error.response?.data?.error || 'Failed to initiate purchase');
        } finally {
            setLoading(false);
            setShowConfirm(false);
        }
    };

    if (!initialPackages || initialPackages.length === 0) {
        return (
            <div className="u-card mt-4 p-5 text-center bg-light border-dashed">
                <h5 className="text-muted mb-0 fw-bold">No enrollment packages available yet.</h5>
                <p className="small text-muted mt-2">Please check back soon or contact support for assistance.</p>
            </div>
        );
    }

    const getIcon = (name) => {
        const n = name.toLowerCase();
        if (n.includes('pro') || n.includes('plus')) return <FaBolt className="mb-2 text-warning" size={24} />;
        if (n.includes('premium') || n.includes('gold') || n.includes('master')) return <FaCrown className="mb-2 text-primary" size={24} />;
        return <FaStar className="mb-2 text-secondary" size={24} />;
    };

    const formatDuration = (days) => {
        if (!days) return null;
        if (days >= 365) {
            const years = Math.floor(days / 365);
            return `${years} ${years === 1 ? 'Year' : 'Years'}`;
        }
        if (days >= 30) {
            const months = Math.floor(days / 30);
            return `${months} ${months === 1 ? 'Month' : 'Months'}`;
        }
        if (days >= 7) {
            const weeks = Math.floor(days / 7);
            return `${weeks} ${weeks === 1 ? 'Week' : 'Weeks'}`;
        }
        return `${days} ${days === 1 ? 'Day' : 'Days'}`;
    };

    return (
        <div className="package-selector-container mt-4">
            <h3 className="u-sec-title mb-4">Choose Your Plan</h3>
            <Row className="g-3">
                {initialPackages.map((pkg) => {
                    const isSelected = selectedPkgId === pkg._id;
                    const durationText = formatDuration(pkg.days);

                    return (
                        <Col lg={4} md={6} key={pkg._id}>
                            <Card 
                                className={`u-package-card h-100 ${isSelected ? 'active' : ''}`}
                                onClick={() => setSelectedPkgId(pkg._id)}
                            >
                                <Card.Body className="p-4 d-flex flex-column text-center">
                                    <div className="pkg-icon-wrapper">
                                        {getIcon(pkg.name)}
                                    </div>
                                    <h4 className="fw-bold mb-1">{pkg.name}</h4>
                                    {durationText && (
                                        <div className="text-muted small mb-2 fw-medium text-uppercase tracking-wider">
                                            {durationText} Program
                                        </div>
                                    )}
                                    <div className="pkg-price mb-3">
                                        <span className="currency">₹</span>
                                        <span className="amount">{pkg.price.toLocaleString()}</span>
                                    </div>
                                    <p className="small text-muted mb-4 flex-grow-1">{pkg.description}</p>
                                    
                                    <div className="features-list text-start mb-4">
                                        {pkg.features?.map((feat, i) => (
                                            <div key={i} className="feature-item d-flex align-items-start gap-2 mb-2">
                                                <FaCheckCircle className="text-success mt-1" size={14} />
                                                <span className="small">{feat}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-auto">
                                        {isSelected ? (
                                            <Button variant="dark" className="w-100 rounded-pill py-2 shadow-sm d-flex align-items-center justify-content-center gap-2">
                                                <FaCheckCircle /> Selected
                                            </Button>
                                        ) : (
                                            <Button variant="outline-dark" className="w-100 rounded-pill py-2">
                                                Select Plan
                                            </Button>
                                        )}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    );
                })}
            </Row>

            <div className="mt-5 d-grid">
                <Button 
                    variant="primary" 
                    size="lg" 
                    className={`u-btn-purchase ${!selectedPkgId ? 'btn-secondary' : 'btn-dark'} border-0 shadow-lg py-3`}
                    disabled={!selectedPkgId || loading}
                    onClick={() => setShowConfirm(true)}
                >
                    {loading && <Spinner size="sm" className="me-2" />}
                    {selectedPkgId ? 'Proceed to Secure Checkout' : 'Please Select a Plan'}
                </Button>
                <p className="text-center mt-3 text-muted small">
                    <FaBolt className="text-warning me-1" /> Secure encryption & instant activation
                </p>
            </div>

            <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="fw-bold">Confirm Your Selection</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    <p>You have selected the following course package:</p>
                    {selectedPkgId && (() => {
                        const p = initialPackages.find(x => x._id === selectedPkgId);
                        if (!p) return null;
                        return (
                            <div className="bg-light p-4 rounded-4 border text-center my-3">
                                <div className="text-uppercase small fw-bold text-muted mb-1">{p.name}</div>
                                <h3 className="fw-bold text-dark mb-2">₹{p.price.toLocaleString()}</h3>
                                <div className="small text-muted">{p.description}</div>
                            </div>
                        );
                    })()}
                    <p className="mt-3 small text-muted text-center">
                        Upon confirmation, you will be redirected to our secure payment gateway to complete your enrollment.
                    </p>
                </Modal.Body>
                <Modal.Footer className="border-0 pb-4 px-4">
                    <Button variant="link" className="text-decoration-none text-secondary" onClick={() => setShowConfirm(false)}>Go Back</Button>
                    <Button variant="dark" className="px-5 rounded-pill shadow-sm" onClick={handlePurchase} disabled={loading}>
                        {loading ? <Spinner size="sm" /> : 'Confirm & Pay'}
                    </Button>
                </Modal.Footer>
            </Modal>

            <style jsx>{`
                .u-package-card {
                    border: 1px solid #e0e0e0;
                    border-radius: 20px;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    cursor: pointer;
                    background: #fff;
                    position: relative;
                    overflow: hidden;
                }
                .u-package-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 12px 30px rgba(0,0,0,0.08);
                    border-color: #000;
                }
                .u-package-card.active {
                    border-color: #000;
                    border-width: 2px;
                    background-color: #fff;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.05);
                }
                .u-package-card.active::after {
                    content: 'RECOMMENDED';
                    position: absolute;
                    top: 12px;
                    right: -32px;
                    background: #000;
                    color: #fff;
                    font-size: 10px;
                    font-weight: 800;
                    padding: 4px 40px;
                    transform: rotate(45deg);
                }
                .pkg-icon-wrapper {
                    height: 60px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .pkg-price .currency {
                    font-size: 1.25rem;
                    font-weight: 600;
                    vertical-align: top;
                    margin-right: 2px;
                }
                .pkg-price .amount {
                    font-size: 2.5rem;
                    font-weight: 800;
                    letter-spacing: -1px;
                }
                .feature-item {
                    line-height: 1.4;
                }
                .u-btn-purchase {
                    font-weight: 700;
                    font-size: 1.1rem;
                    border-radius: 14px;
                    transition: all 0.2s ease;
                }
                .u-btn-purchase:active {
                    transform: scale(0.98);
                }
                .border-dashed {
                    border: 2px dashed #ddd !important;
                }
            `}</style>
        </div>
    );
}
