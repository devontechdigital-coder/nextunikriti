'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, Badge, Spinner, Modal, Row, Col, Form, InputGroup } from 'react-bootstrap';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useSelector, useDispatch } from 'react-redux';
import { setCredentials } from '@/redux/slices/authSlice';
import { FaCheckCircle, FaStar, FaBolt, FaCrown, FaCreditCard, FaClock, FaPhoneAlt, FaUser, FaEnvelope } from 'react-icons/fa';
import { buildPackagePricingOptions, getPackageDisplayDurationDays, getPackageDisplayPrice, getPackageOriginalPrice, resolvePackagePriceOption } from '@/lib/packagePricing';

const AUTH_STEP = { PHONE: 'phone', OTP: 'otp', DETAILS: 'details' };

const normalizeModeLabel = (mode) => (mode || 'Online').trim();

export default function PackageSelector({ courseId, courseMode = 'Online', initialPackages = [] }) {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    const [selectedPkgId, setSelectedPkgId] = useState(null);
    const [selectedPkgPriceKey, setSelectedPkgPriceKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [activePackageMode, setActivePackageMode] = useState(null);
    const [showModeSelectionError, setShowModeSelectionError] = useState(false);

    // Public settings (payment modes + showTestOtp)
    const [settings, setSettings] = useState({ payOnline: true, payLater: false, showTestOtp: false });
    const [selectedMode, setSelectedMode] = useState('pay_online');

    // Auth gate
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authStep, setAuthStep] = useState(AUTH_STEP.PHONE);
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [otpHash, setOtpHash] = useState('');
    const [pendingUser, setPendingUser] = useState(null); // stores user from OTP verify
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [authLoading, setAuthLoading] = useState(false);
    const modeSelectionRef = useRef(null);

    // Confirm modal
    const [showConfirm, setShowConfirm] = useState(false);

    // Fetch public settings once
    useEffect(() => {
        axios.get('/api/settings/payment-modes').then(res => {
            if (res.data.success) {
                setSettings(res.data);
                setSelectedMode(res.data.payOnline ? 'pay_online' : 'pay_later');
            }
        }).catch(() => {});
    }, []);

    const packageModes = [...new Set(
        (initialPackages || []).map((pkg) => normalizeModeLabel(pkg.mode))
    )];
    const defaultPackageMode = packageModes.includes(normalizeModeLabel(courseMode))
        ? normalizeModeLabel(courseMode)
        : (packageModes[0] || normalizeModeLabel(courseMode));
    const shouldRequireModeSelection = packageModes.length > 1;
    const displayedPackages = useMemo(() => (
        activePackageMode
            ? (initialPackages || []).filter((pkg) => normalizeModeLabel(pkg.mode) === activePackageMode)
            : (initialPackages || [])
    ), [activePackageMode, initialPackages]);

    useEffect(() => {
        setActivePackageMode(shouldRequireModeSelection ? null : defaultPackageMode);
        setShowModeSelectionError(false);
    }, [defaultPackageMode, shouldRequireModeSelection]);

    // Auto-select highest priced package for the current view
    useEffect(() => {
        if (displayedPackages.length > 0) {
            const hasSelectedVisiblePackage = displayedPackages.some((pkg) => pkg._id === selectedPkgId);
            if (hasSelectedVisiblePackage) {
                const activePackage = displayedPackages.find((pkg) => pkg._id === selectedPkgId);
                const activeOption = resolvePackagePriceOption(activePackage, selectedPkgPriceKey);
                if (activeOption?.key === selectedPkgPriceKey) return;
                setSelectedPkgPriceKey(activeOption?.key || '');
                return;
            }

            const sorted = [...displayedPackages].sort((a, b) => getPackageDisplayPrice(b) - getPackageDisplayPrice(a));
            setSelectedPkgId(sorted[0]._id);
            setSelectedPkgPriceKey(resolvePackagePriceOption(sorted[0])?.key || '');
            return;
        }

        setSelectedPkgId(null);
        setSelectedPkgPriceKey('');
    }, [displayedPackages, selectedPkgId, selectedPkgPriceKey]);

    // Called when "Proceed to Enroll" is clicked
    const handleProceed = () => {
        if (shouldRequireModeSelection && !activePackageMode) {
            setShowModeSelectionError(true);
            modeSelectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            toast.error('Please choose a mode before enrolling');
            return;
        }
        if (!selectedPkgId) { toast.error('Please select a package first'); return; }
        if (!user) {
            setAuthStep(AUTH_STEP.PHONE);
            setPhone(''); setOtp(''); setOtpHash(''); setPendingUser(null); setUserName(''); setUserEmail('');
            setShowAuthModal(true);
        } else {
            setShowConfirm(true);
        }
    };

    // Step 1 — Send OTP
    const handleSendOtp = async () => {
        if (!phone || phone.length < 10) { toast.error('Enter a valid 10-digit phone number'); return; }
        setAuthLoading(true);
        try {
            const res = await axios.post('/api/auth/send-otp', { phone: `+91${phone}` });
            if (res.data.success) {
                const { hash, otpCode } = res.data.data;
                setOtpHash(hash);
                // Show OTP as toast if admin has enabled it for testing
                if (settings.showTestOtp && otpCode) {
                    toast(`🔐 Test OTP: ${otpCode}`, { duration: 10000, icon: '🧪', style: { fontWeight: 'bold', fontSize: '1.1rem' } });
                }
                setAuthStep(AUTH_STEP.OTP);
                toast.success('OTP sent to your number!');
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to send OTP. Please try again.');
        } finally {
            setAuthLoading(false);
        }
    };

    // Step 2 — Verify OTP
    const handleVerifyOtp = async () => {
        if (!otp || otp.length !== 6) { toast.error('Enter the 6-digit OTP'); return; }
        setAuthLoading(true);
        try {
            const res = await axios.post('/api/auth/verify-otp', { phone: `+91${phone}`, hash: otpHash, otp });
            if (res.data.success) {
                const userData = res.data.data;
                setPendingUser(userData); // store for use in details step
                if (!userData.name || userData.name === 'Student') {
                    // New user — collect name
                    setAuthStep(AUTH_STEP.DETAILS);
                } else {
                    // Returning user — login & proceed
                    dispatch(setCredentials(userData));
                    setShowAuthModal(false);
                    toast.success(`Welcome back, ${userData.name}! 👋`);
                    setTimeout(() => setShowConfirm(true), 100);
                }
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Invalid OTP. Please try again.');
        } finally {
            setAuthLoading(false);
        }
    };

    // Step 3 — Save details and login (no second verify-otp needed — cookie already set in step 2)
    const handleSaveDetails = async () => {
        if (!userName.trim()) { toast.error('Please enter your full name'); return; }
        setAuthLoading(true);
        try {
            // Update name + email in DB
            await axios.post('/api/auth/update-profile', {
                phone: `+91${phone}`,
                name: userName.trim(),
                email: userEmail.trim() || undefined,
            });
            // Use the pendingUser we already have (cookie already set from step 2)
            const updatedUser = { ...pendingUser, name: userName.trim(), email: userEmail.trim() || pendingUser?.email };
            dispatch(setCredentials(updatedUser));
            setShowAuthModal(false);
            toast.success(`Welcome, ${userName.trim()}! 🎉`);
            setTimeout(() => setShowConfirm(true), 100);
        } catch (err) {
            // Profile update is non-critical — still log them in
            console.warn('Profile update failed:', err.response?.data?.error);
            const updatedUser = { ...pendingUser, name: userName.trim() };
            dispatch(setCredentials(updatedUser));
            setShowAuthModal(false);
            toast.success(`Welcome, ${userName.trim()}!`);
            setTimeout(() => setShowConfirm(true), 100);
        } finally {
            setAuthLoading(false);
        }
    };

    // Final purchase — cookie already set server-side from OTP verify
    const handlePurchase = async () => {
        if (!selectedPkgId) { toast.error('Please select a package first'); return; }
        setLoading(true);
        try {
            const body = { package_id: selectedPkgId };
            if (selectedPkgPriceKey) body.package_price_key = selectedPkgPriceKey;
            if (selectedMode === 'pay_later') body.payment_mode = 'pay_later';

            const res = await axios.post('/api/orders', body);
            if (res.data.success) {
                const { gateway, order, url, key, redirectUrl } = res.data;

                if (gateway === 'pay_later') {
                    toast.success('✅ Enrollment request submitted! Our team will contact you for payment.');
                    setShowConfirm(false);
                    setTimeout(() => { window.location.href = '/student/dashboard'; }, 1800);
                    return;
                }

                if (gateway === 'stripe' && url) {
                    window.location.href = url;
                } else if (gateway === 'icici' && redirectUrl) {
                    window.location.href = redirectUrl;
                } else if (gateway === 'razorpay' && order) {
                    const options = {
                        key,
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
                                    window.location.href = '/student/dashboard';
                                }
                            } catch (vErr) {
                                toast.error('Payment verification failed. Contact support.');
                            }
                        },
                        prefill: { name: user?.name || '', email: user?.email || '' },
                        theme: { color: '#000000' }
                    };
                    const rzp = new window.Razorpay(options);
                    rzp.open();
                }
            }
        } catch (error) {
            const msg = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to initiate purchase';
            console.error('Purchase error:', error.response?.data || error.message);
            toast.error(msg);
        } finally {
            setLoading(false);
            setShowConfirm(false);
        }
    };

    if (!initialPackages || initialPackages.length === 0) {
        return (
            <div className="u-card mt-4 p-5 text-center bg-light border-dashed">
                <h5 className="text-muted mb-0 fw-bold">No enrollment packages available yet.</h5>
                <p className="small text-muted mt-2">Please check back soon or contact support.</p>
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
        if (days >= 365) { const y = Math.floor(days / 365); return `${y} ${y === 1 ? 'Year' : 'Years'}`; }
        if (days >= 30) { const m = Math.floor(days / 30); return `${m} ${m === 1 ? 'Month' : 'Months'}`; }
        if (days >= 7) { const w = Math.floor(days / 7); return `${w} ${w === 1 ? 'Week' : 'Weeks'}`; }
        return `${days} ${days === 1 ? 'Day' : 'Days'}`;
    };

    const bothModesEnabled = settings.payOnline && settings.payLater;
    const selectedPkg = selectedPkgId ? initialPackages.find(x => x._id === selectedPkgId) : null;
    const selectedPkgOption = selectedPkg ? resolvePackagePriceOption(selectedPkg, selectedPkgPriceKey) : null;

    return (
        <div className="package-selector-container mt-4">
            <h3 className="u-sec-title mb-4">Choose Your Plan</h3>
            {packageModes.length > 1 && (
                <div className="mb-4" ref={modeSelectionRef}>
                    <div className="fw-semibold mb-2">Choose your mode</div>
                    <div className="d-flex flex-wrap gap-2">
                    {packageModes.map((mode) => {
                        const isActive = activePackageMode === mode;
                        return (
                            <Button
                                key={mode}
                                type="button"
                                variant={isActive ? 'dark' : 'outline-dark'}
                                className="rounded-pill px-4 py-2 fw-semibold"
                                onClick={() => {
                                    setActivePackageMode(mode);
                                    setShowModeSelectionError(false);
                                }}
                            >
                                {mode}
                            </Button>
                        );
                    })}
                    </div>
                    {showModeSelectionError && (
                        <div className="text-danger small mt-2 fw-medium">
                            Please choose a mode tab to continue with enrollment.
                        </div>
                    )}
                </div>
            )}
            <Row className="g-3">
                {displayedPackages.map((pkg) => {
                    const isSelected = selectedPkgId === pkg._id;
                    const pricingOptions = buildPackagePricingOptions(pkg).filter((option) => option.isActive);
                    const visiblePricingOptions = pricingOptions.length ? pricingOptions : buildPackagePricingOptions(pkg);
                    const selectedOption = resolvePackagePriceOption(pkg, isSelected ? selectedPkgPriceKey : '');
                    const originalPrice = getPackageOriginalPrice(pkg, isSelected ? selectedPkgPriceKey : selectedOption?.key);
                    return (
                        <Col lg={4} md={6} key={pkg._id}>
                            <Card
                                className={`u-package-card h-100 ${isSelected ? 'active' : ''}`}
                                onClick={() => {
                                    setSelectedPkgId(pkg._id);
                                    setSelectedPkgPriceKey(selectedOption?.key || '');
                                }}
                            >
                                <Card.Body className="p-4 d-flex flex-column text-center">
                                    <div className="pkg-icon-wrapper">{getIcon(pkg.name)}</div>
                                    <h4 className="fw-bold mb-1">{pkg.name}</h4>
                                    {formatDuration(selectedOption?.durationDays || getPackageDisplayDurationDays(pkg)) && (
                                        <div className="text-muted small mb-2 fw-medium text-uppercase">{formatDuration(selectedOption?.durationDays || getPackageDisplayDurationDays(pkg))} Program</div>
                                    )}
                                    <div className="pkg-price mb-3">
                                        {originalPrice > Number(selectedOption?.price || getPackageDisplayPrice(pkg)) && (
                                            <div className="pkg-original-price">₹{originalPrice.toLocaleString()}</div>
                                        )}
                                        <span className="currency">₹</span>
                                        <span className="amount">{Number(selectedOption?.price || getPackageDisplayPrice(pkg)).toLocaleString()}</span>
                                    </div>
                                    <p className="small text-muted mb-4 flex-grow-1">{pkg.description}</p>
                                    {visiblePricingOptions.length > 0 && (
                                        <div className="mb-3 text-start">
                                            <div className="small fw-semibold mb-2">Pricing options</div>
                                            <div className="d-flex flex-column gap-2">
                                                {visiblePricingOptions.map((option) => {
                                                    const isOptionSelected = isSelected && selectedPkgPriceKey === option.key;
                                                    return (
                                                        <button
                                                            key={option.key}
                                                            type="button"
                                                            className={`pkg-option-btn text-start ${isOptionSelected ? 'active' : ''}`}
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                setSelectedPkgId(pkg._id);
                                                                setSelectedPkgPriceKey(option.key);
                                                            }}
                                                        >
                                                            <div className="fw-semibold small">{option.label}</div>
                                                            <div className="small text-muted">{option.paymentType} • {option.durationDays} days</div>
                                                            <div className="small fw-bold text-dark">
                                                                ₹{Number(option.price || 0).toLocaleString()}
                                                                {Number(option.discountAmount || 0) > 0 && (
                                                                    <span className="text-muted text-decoration-line-through ms-2">
                                                                        ₹{Number((option.price || 0) + (option.discountAmount || 0)).toLocaleString()}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                    <div className="features-list text-start mb-4">
                                        {pkg.features?.map((feat, i) => (
                                            <div key={i} className="feature-item d-flex align-items-start gap-2 mb-2">
                                                <FaCheckCircle className="text-success mt-1" size={14} />
                                                <span className="small">{feat}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-auto">
                                        {isSelected
                                            ? <Button variant="dark" className="w-100 rounded-pill py-2 shadow-sm d-flex align-items-center justify-content-center gap-2"><FaCheckCircle /> Selected</Button>
                                            : <Button variant="outline-dark" className="w-100 rounded-pill py-2">Select Plan</Button>
                                        }
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    );
                })}
            </Row>

            {displayedPackages.length === 0 && (
                <div className="u-card mt-4 p-4 text-center bg-light border-dashed">
                    <h5 className="text-muted mb-0 fw-bold">No packages available for {activePackageMode} mode.</h5>
                </div>
            )}

            <div className="mt-5 d-grid">
                <Button variant="dark" size="lg" className="u-btn-purchase border-0 shadow-lg py-3" disabled={!selectedPkgId || loading} onClick={handleProceed}>
                    {loading && <Spinner size="sm" className="me-2" />}
                    {selectedPkgId ? 'Proceed to Enroll' : 'Please Select a Plan'}
                </Button>
                <p className="text-center mt-3 text-muted small">
                    <FaBolt className="text-warning me-1" /> Secure enrollment & instant activation
                </p>
            </div>

            {/* ===== AUTH GATE MODAL ===== */}
            <Modal show={showAuthModal} onHide={() => setShowAuthModal(false)} centered size="sm">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold fs-6">
                        {authStep === AUTH_STEP.PHONE && '📱 Login to Enroll'}
                        {authStep === AUTH_STEP.OTP && '🔒 Enter OTP'}
                        {authStep === AUTH_STEP.DETAILS && '👤 Your Details'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="px-4 pb-4">

                    {authStep === AUTH_STEP.PHONE && (
                        <>
                            <p className="text-muted small mb-3">Enter your mobile number. We&apos;ll send a one-time password.</p>
                            <InputGroup className="mb-3">
                                <InputGroup.Text className="fw-bold bg-light">+91</InputGroup.Text>
                                <Form.Control
                                    type="tel"
                                    maxLength={10}
                                    placeholder="10-digit mobile number"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                                    onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                                    autoFocus
                                />
                            </InputGroup>
                            <Button variant="dark" className="w-100 rounded-pill fw-bold" onClick={handleSendOtp} disabled={authLoading || phone.length < 10}>
                                {authLoading ? <Spinner size="sm" /> : 'Send OTP →'}
                            </Button>
                        </>
                    )}

                    {authStep === AUTH_STEP.OTP && (
                        <>
                            <p className="text-muted small mb-1">OTP sent to <strong>+91 {phone}</strong></p>
                            <p className="text-muted x-small mb-3">Valid for 5 minutes</p>
                            <Form.Control
                                type="text"
                                maxLength={6}
                                placeholder="• • • • • •"
                                value={otp}
                                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                                onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
                                className="text-center fw-bold fs-4 mb-3 otp-input"
                                autoFocus
                            />
                            <Button variant="dark" className="w-100 rounded-pill fw-bold mb-2" onClick={handleVerifyOtp} disabled={authLoading || otp.length !== 6}>
                                {authLoading ? <Spinner size="sm" /> : 'Verify OTP →'}
                            </Button>
                            <div className="text-center">
                                <Button variant="link" className="text-muted small text-decoration-none p-0" onClick={() => { setAuthStep(AUTH_STEP.PHONE); setOtp(''); }}>
                                    ← Change number
                                </Button>
                            </div>
                        </>
                    )}

                    {authStep === AUTH_STEP.DETAILS && (
                        <>
                            <p className="text-muted small mb-3">Just a few details to set up your account.</p>
                            <InputGroup className="mb-3">
                                <InputGroup.Text className="bg-light"><FaUser size={12} /></InputGroup.Text>
                                <Form.Control
                                    type="text"
                                    placeholder="Your full name *"
                                    value={userName}
                                    onChange={e => setUserName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSaveDetails()}
                                    autoFocus
                                />
                            </InputGroup>
                            <InputGroup className="mb-4">
                                <InputGroup.Text className="bg-light"><FaEnvelope size={12} /></InputGroup.Text>
                                <Form.Control
                                    type="email"
                                    placeholder="Email address (optional)"
                                    value={userEmail}
                                    onChange={e => setUserEmail(e.target.value)}
                                />
                            </InputGroup>
                            <Button variant="dark" className="w-100 rounded-pill fw-bold" onClick={handleSaveDetails} disabled={authLoading || !userName.trim()}>
                                {authLoading ? <Spinner size="sm" /> : 'Continue to Payment →'}
                            </Button>
                        </>
                    )}
                </Modal.Body>
            </Modal>

            {/* ===== CONFIRM + PAYMENT MODE MODAL ===== */}
            <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
                <Modal.Header closeButton className="border-0">
                    <Modal.Title className="fw-bold">Confirm Enrollment</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    {selectedPkg && (
                        <div className="bg-light p-4 rounded-4 border text-center mb-3">
                            <div className="text-uppercase small fw-bold text-muted mb-1">{selectedPkg.name}</div>
                            {selectedPkgOption?.label && <div className="small text-muted mb-1">{selectedPkgOption.label}</div>}
                            {getPackageOriginalPrice(selectedPkg, selectedPkgPriceKey) > Number(selectedPkgOption?.price || getPackageDisplayPrice(selectedPkg)) && (
                                <div className="small text-muted text-decoration-line-through mb-1">
                                    ₹{getPackageOriginalPrice(selectedPkg, selectedPkgPriceKey).toLocaleString()}
                                </div>
                            )}
                            <h3 className="fw-bold text-dark mb-1">₹{Number(selectedPkgOption?.price || getPackageDisplayPrice(selectedPkg)).toLocaleString()}</h3>
                            {selectedPkg.description && <div className="small text-muted">{selectedPkg.description}</div>}
                        </div>
                    )}

                    {/* Both modes — show choice */}
                    {bothModesEnabled && (
                        <div>
                            <p className="fw-semibold small mb-2">How would you like to pay?</p>
                            <div className="d-flex flex-column gap-2">
                                {[
                                    { mode: 'pay_online', icon: <FaCreditCard size={18} />, label: 'Pay Online', sub: 'Secure instant payment via gateway' },
                                    { mode: 'pay_later', icon: <FaClock size={18} />, label: 'Pay Later', sub: 'Reserve now, team will contact you' },
                                ].map(({ mode, icon, label, sub }) => (
                                    <div
                                        key={mode}
                                        className={`d-flex align-items-center gap-3 p-3 rounded-3 border ${selectedMode === mode ? 'border-dark bg-dark text-white' : 'bg-white'}`}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => setSelectedMode(mode)}
                                    >
                                        {icon}
                                        <div>
                                            <div className="fw-bold small">{label}</div>
                                            <div className={`x-small ${selectedMode === mode ? 'text-white-50' : 'text-muted'}`}>{sub}</div>
                                        </div>
                                        {selectedMode === mode && <FaCheckCircle className="ms-auto" />}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Pay later only */}
                    {!bothModesEnabled && settings.payLater && !settings.payOnline && (
                        <div className="p-3 bg-warning bg-opacity-10 border border-warning rounded-3 d-flex align-items-center gap-2">
                            <FaClock className="text-warning flex-shrink-0" />
                            <small>You&apos;ll reserve this course now. Our team will contact you to arrange payment.</small>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-0 pb-4 px-4">
                    <Button variant="link" className="text-decoration-none text-secondary" onClick={() => setShowConfirm(false)}>Go Back</Button>
                    <Button variant="dark" className="px-5 rounded-pill shadow-sm fw-bold" onClick={handlePurchase} disabled={loading}>
                        {loading ? <Spinner size="sm" /> : (selectedMode === 'pay_later' ? '📋 Reserve Enrollment' : '💳 Confirm & Pay')}
                    </Button>
                </Modal.Footer>
            </Modal>

            <style jsx>{`
                .u-package-card { border: 1px solid #e0e0e0; border-radius: 20px; transition: all 0.3s cubic-bezier(0.4,0,0.2,1); cursor: pointer; background: #fff; position: relative; overflow: hidden; }
                .u-package-card:hover { transform: translateY(-8px); box-shadow: 0 12px 30px rgba(0,0,0,0.08); border-color: #000; }
                .u-package-card.active { border-color: #000; border-width: 2px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
                .u-package-card.active::after { content: 'RECOMMENDED'; position: absolute; top: 12px; right: -32px; background: #000; color: #fff; font-size: 10px; font-weight: 800; padding: 4px 40px; transform: rotate(45deg); }
                .pkg-icon-wrapper { height: 60px; display: flex; align-items: center; justify-content: center; }
                .pkg-price .currency { font-size: 1.25rem; font-weight: 600; vertical-align: top; margin-right: 2px; }
                .pkg-price .amount { font-size: 2.5rem; font-weight: 800; letter-spacing: -1px; }
                .pkg-original-price { font-size: 0.95rem; color: #6c757d; text-decoration: line-through; margin-bottom: 2px; }
                .feature-item { line-height: 1.4; }
                .pkg-option-btn { border: 1px solid #e0e0e0; border-radius: 12px; background: #fff; padding: 10px 12px; width: 100%; transition: all 0.2s ease; }
                .pkg-option-btn.active { border-color: #000; background: #f8f9fa; }
                .u-btn-purchase { font-weight: 700; font-size: 1.1rem; border-radius: 14px; transition: all 0.2s ease; }
                .u-btn-purchase:active { transform: scale(0.98); }
                .border-dashed { border: 2px dashed #ddd !important; }
                .x-small { font-size: 0.75rem; }
                .otp-input { letter-spacing: 0.5rem; font-size: 1.5rem !important; }
            `}</style>
        </div>
    );
}
