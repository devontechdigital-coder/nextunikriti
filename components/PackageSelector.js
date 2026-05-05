'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, Badge, Spinner, Modal, Row, Col, Form, InputGroup } from 'react-bootstrap';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useSelector, useDispatch } from 'react-redux';
import { setCredentials } from '@/redux/slices/authSlice';
import { FaCheckCircle, FaStar, FaBolt, FaCrown, FaCreditCard, FaClock, FaPhoneAlt, FaUser, FaEnvelope, FaDesktop, FaSchool, FaMapMarkerAlt, FaLaptop, FaChalkboardTeacher } from 'react-icons/fa';
import { buildPackagePricingOptions, getPackageDisplayDurationDays, getPackageDisplayPrice, getPackageOriginalPrice, resolvePackagePriceOption } from '@/lib/packagePricing';
import { mergeGradeOptions, normalizeGradeName, packageMatchesGrade } from '@/lib/gradeUtils';
import { DEFAULT_PHONE_COUNTRY, formatPhoneDisplay, formatPhoneInput, normalizePhoneNumber, PHONE_COUNTRY_OPTIONS } from '@/lib/phone';
import { normalizeSchoolSchedule } from '@/lib/schoolSchedule';
import GooglePlaceSelect from '@/components/common/GooglePlaceSelect';

const AUTH_STEP = { PHONE: 'phone', OTP: 'otp', DETAILS: 'details' };
const DETAIL_STEP = { BASIC: 0, ADDRESS: 1, FAMILY: 2 };
const ENROLLMENT_DAY_OPTIONS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const ENROLLMENT_TIME_SUGGESTIONS = ['7:00 AM - 9:00 AM', '10:00 AM - 12:00 PM', '1:00 PM - 3:00 PM', '4:00 PM - 6:00 PM', '6:00 PM - 8:00 PM'];

const normalizeModeLabel = (mode) => (mode || 'Online').trim();
const modeRequiresSchool = (mode) => normalizeModeLabel(mode).toLowerCase() !== 'online';
const buildSchoolSlotValue = (slot = {}) => `${slot.startTime || ''} - ${slot.endTime || ''}`.trim();
const formatScheduleTime = (value) => {
    if (!value || !String(value).includes(':')) return value || '';
    const [hoursString, minutesString] = String(value).split(':');
    const hours = Number(hoursString);
    const minutes = Number(minutesString);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return value;
    const suffix = hours >= 12 ? 'PM' : 'AM';
    const twelveHour = hours % 12 || 12;
    return `${twelveHour}:${String(minutes).padStart(2, '0')} ${suffix}`;
};
const buildSchoolSlotLabel = (slot = {}) => `${formatScheduleTime(slot.startTime)} - ${formatScheduleTime(slot.endTime)}`;
const getScheduleTimeSlots = (schedule, dayOfWeek) => (
    schedule.find((entry) => entry.dayOfWeek === dayOfWeek)?.timeSlots || []
);
const buildPreferredSchedulePayload = (schedule) => (
    schedule
        .map((entry) => ({
            dayOfWeek: entry.dayOfWeek,
            timeSlots: Array.isArray(entry.timeSlots) ? entry.timeSlots.filter(Boolean) : [],
        }))
        .filter((entry) => entry.dayOfWeek && entry.timeSlots.length)
);
const flattenScheduleSlots = (schedule) => (
    buildPreferredSchedulePayload(schedule).flatMap((entry) => (
        entry.timeSlots.map((slot) => `${entry.dayOfWeek}: ${slot}`)
    ))
);
const createInitialStudentProfile = () => ({
    joiningYear: '',
    dateOfJoining: '',
    studentName: '',
    onBoard: false,
    time: '',
    enrolledFor: '',
    location: '',
    dateOfBirth: '',
    gender: 'male',
    address1: '',
    address2: '',
    street: '',
    pinCode: '',
    cityDistrict: '',
    state: '',
    nationality: 'Indian',
    motherName: '',
    motherMobile: '',
    motherEmail: '',
    fatherName: '',
    fatherMobile: '',
    fatherEmail: '',
    homePhone: '',
    emergencyDetails: '',
    relationship: '',
    emergencyPhoneNo: '',
    bloodGroup: '',
    allergies: '',
    medicalCondition: '',
    dateOfLeaving: '',
    status: 'lead',
    profilePhoto: '',
});

const getModeIcon = (mode) => {
    const m = (mode || '').toLowerCase();
    if (m.includes('online')) return <FaLaptop size={28} />;
    if (m.includes('school') || m.includes('offline')) return <FaChalkboardTeacher size={28} />;
    if (m.includes('hybrid')) return <FaDesktop size={28} />;
    return <FaMapMarkerAlt size={28} />;
};

const getModeDescription = (mode) => {
    const m = (mode || '').toLowerCase();
    if (m.includes('online')) return 'Learn from anywhere with live virtual classes';
    if (m.includes('school') || m.includes('offline')) return 'In-person classes at our partner schools';
    if (m.includes('hybrid')) return 'Blend of online and in-person sessions';
    return 'Flexible learning options available';
};

export default function PackageSelector({ courseId, courseMode = 'Online', courseLevelName = '', availableGrades = [], initialPackages = [] }) {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    const [selectedPkgId, setSelectedPkgId] = useState(null);
    const [selectedPkgPriceKey, setSelectedPkgPriceKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [activePackageMode, setActivePackageMode] = useState(null);
    const [activeGrade, setActiveGrade] = useState('');
    const [showModeSelectionError, setShowModeSelectionError] = useState(false);
    const [showGradeSelectionError, setShowGradeSelectionError] = useState(false);

    const [settings, setSettings] = useState({ payOnline: true, payLater: false, showTestOtp: false });
    const [selectedMode, setSelectedMode] = useState('pay_online');

    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authStep, setAuthStep] = useState(AUTH_STEP.PHONE);
    const [phoneCountry, setPhoneCountry] = useState(DEFAULT_PHONE_COUNTRY);
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [otpHash, setOtpHash] = useState('');
    const [submittedPhone, setSubmittedPhone] = useState('');
    const [pendingUser, setPendingUser] = useState(null);
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [studentProfile, setStudentProfile] = useState(createInitialStudentProfile());
    const [detailStep, setDetailStep] = useState(DETAIL_STEP.BASIC);
    const [authLoading, setAuthLoading] = useState(false);
    const modeSelectionRef = useRef(null);

    const [showConfirm, setShowConfirm] = useState(false);
    const [schools, setSchools] = useState([]);
    const [schoolsLoading, setSchoolsLoading] = useState(false);
    const [selectedSchoolId, setSelectedSchoolId] = useState('');
    const [preferredDays, setPreferredDays] = useState([]);
    const [preferredSchedule, setPreferredSchedule] = useState([]);
    const preferredTimes = useMemo(() => flattenScheduleSlots(preferredSchedule), [preferredSchedule]);
    const [preferredTimeInputs, setPreferredTimeInputs] = useState({});
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponLoading, setCouponLoading] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const normalizedPhone = normalizePhoneNumber(phone, phoneCountry);

    useEffect(() => {
        axios.get('/api/settings/payment-modes').then(res => {
            if (res.data.success) {
                setSettings(res.data);
                setSelectedMode(res.data.payOnline ? 'pay_online' : 'pay_later');
            }
        }).catch(() => {});
    }, []);

    useEffect(() => {
        let isMounted = true;
        const fetchSchools = async () => {
            setSchoolsLoading(true);
            try {
                const res = await axios.get('/api/schools');
                if (!isMounted || !res.data?.success) return;
                setSchools(res.data.schools || []);
            } catch (error) {
                if (isMounted) setSchools([]);
            } finally {
                if (isMounted) setSchoolsLoading(false);
            }
        };
        fetchSchools();
        return () => { isMounted = false; };
    }, []);

    const packageModes = [...new Set(
        (initialPackages || []).map((pkg) => normalizeModeLabel(pkg.mode))
    )];
    const gradeOptions = useMemo(() => (
        mergeGradeOptions(
            availableGrades,
            (initialPackages || []).map((pkg) => normalizeGradeName(pkg.gradeName))
        )
    ), [availableGrades, initialPackages]);
    const defaultPackageMode = packageModes.includes(normalizeModeLabel(courseMode))
        ? normalizeModeLabel(courseMode)
        : (packageModes[0] || normalizeModeLabel(courseMode));
    const shouldRequireModeSelection = packageModes.length > 1;
    const shouldRequireGradeSelection = gradeOptions.length > 0;
    const displayedPackages = useMemo(() => (
        activePackageMode
            ? (initialPackages || []).filter((pkg) => normalizeModeLabel(pkg.mode) === activePackageMode && packageMatchesGrade(pkg, activeGrade))
            : (initialPackages || []).filter((pkg) => packageMatchesGrade(pkg, activeGrade))
    ), [activeGrade, activePackageMode, initialPackages]);
    const selectedPkg = selectedPkgId ? initialPackages.find((item) => item._id === selectedPkgId) : null;
    const selectedPkgOption = selectedPkg ? resolvePackagePriceOption(selectedPkg, selectedPkgPriceKey) : null;
    const selectedPackageMode = normalizeModeLabel(selectedPkg?.mode || activePackageMode || courseMode);
    const requiresSchoolSelection = modeRequiresSchool(selectedPackageMode);
    const selectedSchool = schools.find((school) => school._id === selectedSchoolId) || null;
    const selectedSchoolSchedule = useMemo(() => (
        selectedSchool ? normalizeSchoolSchedule(selectedSchool.weeklySchedule || []) : []
    ), [selectedSchool]);
    const availableSchoolDays = useMemo(() => (
        selectedSchoolSchedule.filter((entry) => (
            entry.isOpen && Array.isArray(entry.slots) && entry.slots.some((slot) => slot.startTime && slot.endTime)
        ))
    ), [selectedSchoolSchedule]);
    const slotsBySelectedDay = useMemo(() => {
        const selectedDays = new Set(preferredDays);
        return availableSchoolDays
            .filter((entry) => selectedDays.has(entry.dayOfWeek))
            .map((entry) => ({
                dayOfWeek: entry.dayOfWeek,
                slots: (entry.slots || []).filter((slot) => slot.startTime && slot.endTime),
            }));
    }, [availableSchoolDays, preferredDays]);

    useEffect(() => {
        setActivePackageMode(shouldRequireModeSelection ? null : defaultPackageMode);
        setShowModeSelectionError(false);
    }, [defaultPackageMode, shouldRequireModeSelection]);

    useEffect(() => {
        setActiveGrade((prev) => (
            prev && gradeOptions.some((grade) => grade.toLowerCase() === prev.toLowerCase()) ? prev : ''
        ));
        setShowGradeSelectionError(false);
    }, [gradeOptions]);

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

    useEffect(() => {
        if (!requiresSchoolSelection) setSelectedSchoolId('');
    }, [requiresSchoolSelection]);

    useEffect(() => {
        setAppliedCoupon(null);
        setCouponCode('');
    }, [selectedPkgId, selectedPkgPriceKey, activeGrade]);

    useEffect(() => {
        if (!requiresSchoolSelection) return;
        if (!selectedSchoolId && schools.length === 1) { setSelectedSchoolId(schools[0]._id); return; }
        if (selectedSchoolId && !schools.some((school) => school._id === selectedSchoolId)) setSelectedSchoolId('');
    }, [requiresSchoolSelection, schools, selectedSchoolId]);

    useEffect(() => {
        if (!requiresSchoolSelection) return;
        const availableDayNames = availableSchoolDays.map((entry) => entry.dayOfWeek);
        setPreferredDays((prev) => prev.filter((day) => availableDayNames.includes(day)));
        setPreferredSchedule((prev) => prev.filter((entry) => availableDayNames.includes(entry.dayOfWeek)));
    }, [availableSchoolDays, requiresSchoolSelection]);

    useEffect(() => {
        if (!requiresSchoolSelection) return;
        const availableSlotsByDay = new Map(
            availableSchoolDays.map((entry) => [
                entry.dayOfWeek,
                new Set((entry.slots || []).map((slot) => buildSchoolSlotValue(slot)).filter((slotValue) => slotValue && slotValue !== '-')),
            ])
        );
        setPreferredSchedule((prev) => prev
            .map((entry) => ({
                ...entry,
                timeSlots: getScheduleTimeSlots(prev, entry.dayOfWeek)
                    .filter((slotValue) => availableSlotsByDay.get(entry.dayOfWeek)?.has(slotValue)),
            }))
            .filter((entry) => entry.timeSlots.length || preferredDays.includes(entry.dayOfWeek)));
    }, [availableSchoolDays, preferredDays, requiresSchoolSelection]);

    const updateStudentProfileField = (field, value) => {
        setStudentProfile((prev) => ({ ...prev, [field]: value }));
    };

    const handleStudentLocationSelect = (place) => {
        setStudentProfile((prev) => ({
            ...prev,
            address1: place?.label || prev.address1,
            cityDistrict: place?.city || prev.cityDistrict,
            state: place?.state || prev.state,
            nationality: place?.country || prev.nationality,
            location: place?.label || prev.location,
        }));
    };

    const togglePreferredDay = (dayOfWeek) => {
        setPreferredDays((prev) => prev.includes(dayOfWeek) ? prev.filter((item) => item !== dayOfWeek) : [...prev, dayOfWeek]);
        setPreferredSchedule((prev) => {
            const next = prev.some((entry) => entry.dayOfWeek === dayOfWeek)
                ? prev.filter((entry) => entry.dayOfWeek !== dayOfWeek)
                : [...prev, { dayOfWeek, timeSlots: [] }];
            return next;
        });
    };

    const addPreferredTime = (dayOfWeek, rawValue = preferredTimeInputs[dayOfWeek] || '') => {
        const value = rawValue.trim();
        if (!value) return;
        setPreferredSchedule((prev) => {
            const schedule = prev.some((entry) => entry.dayOfWeek === dayOfWeek)
                ? prev
                : [...prev, { dayOfWeek, timeSlots: [] }];
            const next = schedule.map((entry) => {
                if (entry.dayOfWeek !== dayOfWeek) return entry;
                const timeSlots = Array.isArray(entry.timeSlots) ? entry.timeSlots : [];
                return {
                    ...entry,
                    timeSlots: timeSlots.some((item) => item.toLowerCase() === value.toLowerCase()) ? timeSlots : [...timeSlots, value],
                };
            });
            return next;
        });
        setPreferredTimeInputs((prev) => ({ ...prev, [dayOfWeek]: '' }));
    };

    const removePreferredTime = (dayOfWeek, value) => {
        setPreferredSchedule((prev) => {
            const next = prev.map((entry) => (
                entry.dayOfWeek === dayOfWeek
                    ? { ...entry, timeSlots: (entry.timeSlots || []).filter((item) => item !== value) }
                    : entry
            ));
            return next;
        });
    };

    const togglePreferredTime = (dayOfWeek, rawValue) => {
        const value = String(rawValue || '').trim();
        if (!value) return;
        setPreferredSchedule((prev) => {
            const schedule = prev.some((entry) => entry.dayOfWeek === dayOfWeek)
                ? prev
                : [...prev, { dayOfWeek, timeSlots: [] }];
            const next = schedule.map((entry) => {
                if (entry.dayOfWeek !== dayOfWeek) return entry;
                const timeSlots = Array.isArray(entry.timeSlots) ? entry.timeSlots : [];
                return {
                    ...entry,
                    timeSlots: timeSlots.some((item) => item.toLowerCase() === value.toLowerCase())
                        ? timeSlots.filter((item) => item.toLowerCase() !== value.toLowerCase())
                        : [...timeSlots, value],
                };
            });
            return next;
        });
    };

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) { toast.error('Please enter a coupon code'); return; }
        if (!selectedPkgId) { toast.error('Please select a package first'); return; }
        setCouponLoading(true);
        try {
            const res = await axios.post('/api/coupons/validate', {
                code: couponCode.trim(),
                package_id: selectedPkgId,
                package_price_key: selectedPkgPriceKey,
                course_id: courseId,
            });
            if (res.data.success) {
                setAppliedCoupon(res.data.coupon);
                setCouponCode(res.data.coupon?.code || couponCode.trim().toUpperCase());
                toast.success(res.data.message || 'Coupon applied');
            }
        } catch (error) {
            setAppliedCoupon(null);
            toast.error(error.response?.data?.error || 'Invalid coupon code');
        } finally {
            setCouponLoading(false);
        }
    };

    const handleRemoveCoupon = () => { setAppliedCoupon(null); setCouponCode(''); };

    const validateDetailStep = () => {
        if (detailStep === DETAIL_STEP.BASIC) {
            if (!userName.trim()) { toast.error('Please enter your full name'); return false; }
            if (!studentProfile.gender) { toast.error('Please select gender'); return false; }
        }
        return true;
    };

    const handleDetailStepContinue = async () => {
        if (!validateDetailStep()) return;
        if (detailStep < DETAIL_STEP.FAMILY) { setDetailStep((prev) => prev + 1); return; }
        await handleSaveDetails();
    };

    const handleProceed = () => {
        if (shouldRequireModeSelection && !activePackageMode) {
            setShowModeSelectionError(true);
            modeSelectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            toast.error('Please choose a mode before enrolling');
            return;
        }
        if (shouldRequireGradeSelection && !activeGrade) {
            setShowGradeSelectionError(true);
            toast.error('Please select a grade before enrolling');
            return;
        }
        if (!selectedPkgId) { toast.error('Please select a package first'); return; }
        if (!user) {
            setAuthStep(AUTH_STEP.PHONE);
            setPhoneCountry(DEFAULT_PHONE_COUNTRY);
            setPhone(''); setOtp(''); setOtpHash(''); setSubmittedPhone(''); setPendingUser(null); setUserName(''); setUserEmail('');
            setStudentProfile(createInitialStudentProfile());
            setDetailStep(DETAIL_STEP.BASIC);
            setShowAuthModal(true);
        } else {
            setShowConfirm(true);
        }
    };

    const handleSendOtp = async () => {
        if (!normalizedPhone) { toast.error('Enter a valid phone number for the selected country'); return; }
        setAuthLoading(true);
        try {
            const res = await axios.post('/api/auth/send-otp', { phone: normalizedPhone, country: phoneCountry });
            if (res.data.success) {
                const { hash, otpCode, phone: verifiedPhone } = res.data.data;
                setOtpHash(hash);
                setSubmittedPhone(verifiedPhone || normalizedPhone);
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

    const handleVerifyOtp = async () => {
        if (!otp || otp.length !== 6) { toast.error('Enter the 6-digit OTP'); return; }
        setAuthLoading(true);
        try {
            const res = await axios.post('/api/auth/verify-otp', {
                phone: submittedPhone || normalizedPhone,
                hash: otpHash,
                otp,
                country: phoneCountry,
            });
            if (res.data.success) {
                const userData = res.data.data;
                setPendingUser(userData);
                if (!userData.name || userData.name === 'Student') {
                    setUserName('');
                    setUserEmail(userData.email || '');
                    setStudentProfile((prev) => ({
                        ...createInitialStudentProfile(),
                        ...prev,
                        studentName: prev.studentName || '',
                    }));
                    setDetailStep(DETAIL_STEP.BASIC);
                    setAuthStep(AUTH_STEP.DETAILS);
                } else {
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

    const handleSaveDetails = async () => {
        if (!userName.trim()) { toast.error('Please enter your full name'); return; }
        setAuthLoading(true);
        try {
            const studentPayload = {
                ...studentProfile,
                studentName: studentProfile.studentName.trim() || userName.trim(),
            };
            await axios.post('/api/auth/update-profile', {
                phone: submittedPhone || normalizedPhone,
                name: userName.trim(),
                email: userEmail.trim() || undefined,
                studentProfile: studentPayload,
                country: phoneCountry,
            });
            const updatedUser = { ...pendingUser, name: userName.trim(), email: userEmail.trim() || pendingUser?.email };
            dispatch(setCredentials(updatedUser));
            setShowAuthModal(false);
            toast.success(`Welcome, ${userName.trim()}! 🎉`);
            setTimeout(() => setShowConfirm(true), 100);
        } catch (err) {
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

    const handlePurchase = async () => {
        if (!selectedPkgId) { toast.error('Please select a package first'); return; }
        if (!termsAccepted) { toast.error('Please agree to the terms and conditions'); return; }
        const finalPreferredDays = requiresSchoolSelection ? preferredDays : preferredDays;
        const finalPreferredSchedule = buildPreferredSchedulePayload(preferredSchedule);
        const finalPreferredTimes = flattenScheduleSlots(finalPreferredSchedule);
        if (requiresSchoolSelection && !selectedSchoolId) { toast.error('Please choose a school first'); return; }
        if (!finalPreferredDays.length) { toast.error(requiresSchoolSelection ? 'Please choose an preferred day' : 'Please choose at least one preferred day'); return; }
        if (!finalPreferredTimes.length) { toast.error(requiresSchoolSelection ? 'Please choose an preferred time slot' : 'Please add at least one preferred time'); return; }
        if (finalPreferredSchedule.length < finalPreferredDays.length) { toast.error('Please choose at least one preferred time for every selected day'); return; }
        setLoading(true);
        try {
            const body = { package_id: selectedPkgId };
            if (selectedPkgPriceKey) body.package_price_key = selectedPkgPriceKey;
            if (activeGrade) body.selected_grade_name = activeGrade;
            if (selectedMode === 'pay_later') body.payment_mode = 'pay_later';
            if (appliedCoupon?.code) body.coupon_code = appliedCoupon.code;
            body.preferred_days = finalPreferredDays;
            body.preferred_times = finalPreferredTimes;
            body.preferred_schedule = finalPreferredSchedule;
            if (selectedSchoolId) body.school_id = selectedSchoolId;
            if (pendingUser || userName.trim() || studentProfile.studentName.trim()) {
                body.student_profile = {
                    ...studentProfile,
                    studentName: studentProfile.studentName.trim() || user?.name || userName.trim(),
                    enrolledFor: studentProfile.enrolledFor.trim() || selectedPkg?.name || '',
                    time: finalPreferredTimes.join(', '),
                    location: studentProfile.location.trim() || selectedSchool?.schoolName || activePackageMode || courseMode || '',
                };
            }
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
            <div className="ps-empty-state mt-4">
                <div className="ps-empty-icon">📦</div>
                <h5>No enrollment packages available yet</h5>
                <p>Please check back soon or contact support.</p>
            </div>
        );
    }

    const getIcon = (name) => {
        const n = name.toLowerCase();
        if (n.includes('pro') || n.includes('plus')) return <FaBolt className="pkg-icon-svg text-warning" size={22} />;
        if (n.includes('premium') || n.includes('gold') || n.includes('master')) return <FaCrown className="pkg-icon-svg" size={22} />;
        return <FaStar className="pkg-icon-svg" size={22} />;
    };

    const bothModesEnabled = settings.payOnline && settings.payLater;
    const selectedPackageAmount = Number(selectedPkgOption?.price || getPackageDisplayPrice(selectedPkg || {}));
    const couponDiscountAmount = Number(appliedCoupon?.discountAmount || 0);
    const payableAmount = Math.max(0, selectedPackageAmount - couponDiscountAmount);

    return (
        <div className="ps-root mt-4">
            <h3 className="ps-section-title">Choose Your Plan</h3>

            {/* ===== MODE SELECTION — CARD UI ===== */}
            {packageModes.length > 1 && (
                <div className="mb-5" ref={modeSelectionRef}>
                    <p className="ps-label mb-3">Select your learning mode to view available packages</p>
                    <div className="ps-mode-grid">
                        {packageModes.map((mode) => {
                            const isActive = activePackageMode === mode;
                            return (
                                <div
                                    key={mode}
                                    className={`ps-mode-card ${isActive ? 'ps-mode-card--active' : ''}`}
                                    onClick={() => {
                                        setActivePackageMode(mode);
                                        setShowModeSelectionError(false);
                                    }}
                                >
                                    <div className="ps-mode-card__icon">
                                        {getModeIcon(mode)}
                                    </div>
                                    <div className="ps-mode-card__name">{mode}</div>
                                    <div className="ps-mode-card__desc">{getModeDescription(mode)}</div>
                                    {isActive && (
                                        <div className="ps-mode-card__check">
                                            <FaCheckCircle size={16} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    {showModeSelectionError && (
                        <div className="ps-error-msg mt-2">
                            ⚠ Please choose a learning mode to view available packages.
                        </div>
                    )}
                </div>
            )}

            {/* ===== PACKAGES GRID ===== */}
            {(!shouldRequireModeSelection || activePackageMode) ? (
                <>
                    {displayedPackages.length > 0 ? (
                        <Row className="g-3">
                            {displayedPackages.map((pkg) => {
                                const isSelected = selectedPkgId === pkg._id;
                                const pricingOptions = buildPackagePricingOptions(pkg).filter((option) => option.isActive);
                                const visiblePricingOptions = pricingOptions.length ? pricingOptions : buildPackagePricingOptions(pkg);
                                const selectedOption = resolvePackagePriceOption(pkg, isSelected ? selectedPkgPriceKey : '');
                                const originalPrice = getPackageOriginalPrice(pkg, isSelected ? selectedPkgPriceKey : selectedOption?.key);
                                return (
                                    <Col lg={4} md={6} key={pkg._id}>
                                        <div
                                            className={`ps-pkg-card ${isSelected ? 'ps-pkg-card--selected' : ''}`}
                                            onClick={() => {
                                                setSelectedPkgId(pkg._id);
                                                setSelectedPkgPriceKey(selectedOption?.key || '');
                                            }}
                                        >
                                            {/* {isSelected && <div className="ps-pkg-badge">RECOMMENDED</div>} */}
                                            <div className="ps-pkg-icon-wrap">{getIcon(pkg.name)}</div>
                                            <h4 className="ps-pkg-name">{pkg.name}</h4>
                                            {pkg.gradeName && (
                                                <div className="ps-pkg-grade">Grade: {pkg.gradeName}</div>
                                            )}
                                            <div className="ps-pkg-price">
                                                {originalPrice > Number(selectedOption?.price || getPackageDisplayPrice(pkg)) && (
                                                    <div className="ps-pkg-original">₹{originalPrice.toLocaleString()}</div>
                                                )}
                                                <span className="ps-pkg-currency">₹</span>
                                                <span className="ps-pkg-amount">{Number(selectedOption?.price || getPackageDisplayPrice(pkg)).toLocaleString()}</span>
                                            </div>

                                            {pkg.features?.length > 0 && (
                                                <div className="ps-features">
                                                    {pkg.features.map((feat, i) => (
                                                        <div key={i} className="ps-feature-item">
                                                            <FaCheckCircle className="ps-feature-check" size={13} />
                                                            <span>{feat}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {pkg.description && (
                                                <p className="ps-pkg-desc">{pkg.description}</p>
                                            )}

                                            {visiblePricingOptions.length > 0 && (
                                                <div className="ps-pricing-wrap">
                                                    {gradeOptions.length > 0 && (
                                                        <div className="mb-3">
                                                            <div className="ps-input-label">Choose your grade</div>
                                                            <Form.Select
                                                                value={activeGrade}
                                                                onChange={(event) => {
                                                                    event.stopPropagation();
                                                                    setActiveGrade(event.target.value);
                                                                    setShowGradeSelectionError(false);
                                                                }}
                                                                className="ps-select"
                                                                onClick={(event) => event.stopPropagation()}
                                                            >
                                                                <option value="">Select Grade</option>
                                                                {gradeOptions.map((grade) => (
                                                                    <option key={grade} value={grade}>{grade}</option>
                                                                ))}
                                                            </Form.Select>
                                                            {showGradeSelectionError && !activeGrade && (
                                                                <div className="ps-error-msg mt-1">Please choose your grade.</div>
                                                            )}
                                                        </div>
                                                    )}
                                                    <div className="ps-input-label">Pricing options</div>
                                                    <div className="ps-options-list">
                                                        {visiblePricingOptions.map((option) => {
                                                            const isOptionSelected = isSelected && selectedPkgPriceKey === option.key;
                                                            return (
                                                                <button
                                                                    key={option.key}
                                                                    type="button"
                                                                    className={`ps-option-btn ${isOptionSelected ? 'ps-option-btn--active' : ''}`}
                                                                    onClick={(event) => {
                                                                        event.stopPropagation();
                                                                        setSelectedPkgId(pkg._id);
                                                                        setSelectedPkgPriceKey(option.key);
                                                                    }}
                                                                >
                                                                    <div className="ps-option-meta">{option.paymentType} · {option.durationDays} days</div>
                                                                    <div className="ps-option-price">
                                                                        ₹{Number(option.price || 0).toLocaleString()}
                                                                        {Number(option.discountAmount || 0) > 0 && (
                                                                            <span className="ps-option-struck">
                                                                                ₹{Number((option.price || 0) + (option.discountAmount || 0)).toLocaleString()}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="ps-option-fee">
                                                                        Admission Fee: {option.adminFee > 0 ? `₹${option.adminFee}` : 'Free'}{' '}
                                                                        <span className="ps-option-fee-note">(one time per year)</span>
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="ps-pkg-action">
                                                {isSelected ? (
                                                    <button className="ps-btn ps-btn--selected">
                                                        <FaCheckCircle size={14} /> Selected
                                                    </button>
                                                ) : (
                                                    <button className="ps-btn ps-btn--outline">Select Plan</button>
                                                )}
                                            </div>
                                        </div>
                                    </Col>
                                );
                            })}
                        </Row>
                    ) : (
                        <div className="ps-empty-state">
                            <div className="ps-empty-icon">🔍</div>
                            <h5>{`No packages available${activePackageMode ? ` for ${activePackageMode} mode` : ''}.`}</h5>
                        </div>
                    )}
                </>
            ) : (
                /* Placeholder when no mode selected */
                <div className="ps-mode-placeholder">
                    <div className="ps-mode-placeholder__icon">↑</div>
                    <div className="ps-mode-placeholder__text">Select a learning mode above to view available packages</div>
                </div>
            )}

            {/* ===== CTA ===== */}
            <div className="ps-cta mt-5">
                <button
                    className={`ps-cta-btn ${(!selectedPkgId || loading) ? 'ps-cta-btn--disabled' : ''}`}
                    disabled={!selectedPkgId || loading}
                    onClick={handleProceed}
                >
                    {loading && <Spinner size="sm" className="me-2" />}
                    {selectedPkgId ? 'Proceed to Enroll →' : 'Please Select a Plan'}
                </button>
                <p className="ps-cta-note">
                    <FaBolt className="me-1" style={{ color: '#f59e0b' }} />
                    Secure enrollment &amp; instant activation
                </p>
            </div>

            {/* ===== AUTH MODAL ===== */}
            <Modal
                show={showAuthModal}
                onHide={() => setShowAuthModal(false)}
                centered
                size={authStep === AUTH_STEP.DETAILS ? 'lg' : undefined}
                className="ps-auth-modal"
            >
                <Modal.Header closeButton className="ps-modal-header">
                    <div className="ps-modal-brand">
                        {authStep === AUTH_STEP.PHONE && (
                            <>
                                <div className="ps-modal-brand__icon">
                                    <FaPhoneAlt size={18} />
                                </div>
                                <div>
                                    <div className="ps-modal-brand__title">Sign in to Enroll</div>
                                    <div className="ps-modal-brand__sub">We&apos;ll send you a one-time password</div>
                                </div>
                            </>
                        )}
                        {authStep === AUTH_STEP.OTP && (
                            <>
                                <div className="ps-modal-brand__icon ps-modal-brand__icon--otp">
                                    <span style={{ fontSize: 20 }}>🔒</span>
                                </div>
                                <div>
                                    <div className="ps-modal-brand__title">Enter OTP</div>
                                    <div className="ps-modal-brand__sub">Check your phone for the code</div>
                                </div>
                            </>
                        )}
                        {authStep === AUTH_STEP.DETAILS && (
                            <>
                                <div className="ps-modal-brand__icon ps-modal-brand__icon--details">
                                    <FaUser size={18} />
                                </div>
                                <div>
                                    <div className="ps-modal-brand__title">Complete Your Profile</div>
                                    <div className="ps-modal-brand__sub">Step {detailStep + 1} of 3</div>
                                </div>
                            </>
                        )}
                    </div>
                </Modal.Header>

                <Modal.Body className="ps-modal-body">
                    {/* PHONE STEP */}
                    {authStep === AUTH_STEP.PHONE && (
                        <div className="ps-auth-step">
                            <div className="ps-auth-field-group">
                                <label className="ps-field-label">Mobile Number</label>
                                <div className="ps-phone-row">
                                    <Form.Select
                                        value={phoneCountry}
                                        onChange={e => setPhoneCountry(e.target.value)}
                                        className="ps-country-select"
                                    >
                                        {PHONE_COUNTRY_OPTIONS.map((option) => (
                                            <option key={option.code} value={option.code}>{option.label}</option>
                                        ))}
                                    </Form.Select>
                                    <Form.Control
                                        type="tel"
                                        placeholder="Enter mobile number"
                                        value={phone}
                                        onChange={e => setPhone(formatPhoneInput(e.target.value, phoneCountry))}
                                        onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                                        className="ps-phone-input"
                                        autoFocus
                                    />
                                </div>
                                <div className="ps-field-hint">Number will be validated for the selected country.</div>
                            </div>
                            <button
                                className={`ps-auth-btn ${(authLoading || !normalizedPhone) ? 'ps-auth-btn--disabled' : ''}`}
                                onClick={handleSendOtp}
                                disabled={authLoading || !normalizedPhone}
                            >
                                {authLoading ? <Spinner size="sm" /> : <>Send OTP <span className="ms-1">→</span></>}
                            </button>
                        </div>
                    )}

                    {/* OTP STEP */}
                    {authStep === AUTH_STEP.OTP && (
                        <div className="ps-auth-step">
                            <div className="ps-otp-sent-info">
                                <span>OTP sent to</span>
                                <strong>{formatPhoneDisplay(submittedPhone || normalizedPhone)}</strong>
                                <span className="ps-otp-validity">Valid for 5 minutes</span>
                            </div>
                            <div className="ps-auth-field-group">
                                <label className="ps-field-label">One-Time Password</label>
                                <input
                                    type="text"
                                    maxLength={6}
                                    placeholder="• • • • • •"
                                    value={otp}
                                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                                    onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
                                    className="ps-otp-input"
                                    autoFocus
                                />
                                <div className="ps-otp-dots">
                                    {[0,1,2,3,4,5].map(i => (
                                        <div key={i} className={`ps-otp-dot ${otp.length > i ? 'ps-otp-dot--filled' : ''}`} />
                                    ))}
                                </div>
                            </div>
                            <button
                                className={`ps-auth-btn ${(authLoading || otp.length !== 6) ? 'ps-auth-btn--disabled' : ''}`}
                                onClick={handleVerifyOtp}
                                disabled={authLoading || otp.length !== 6}
                            >
                                {authLoading ? <Spinner size="sm" /> : <>Verify OTP <span className="ms-1">→</span></>}
                            </button>
                            <button
                                className="ps-auth-back"
                                onClick={() => { setAuthStep(AUTH_STEP.PHONE); setOtp(''); setSubmittedPhone(''); }}
                            >
                                ← Change number
                            </button>
                        </div>
                    )}

                    {/* DETAILS STEP */}
                    {authStep === AUTH_STEP.DETAILS && (
                        <div className="ps-auth-step">
                            {/* Progress Bar */}
                            <div className="ps-progress-bar">
                                {['Basic Info', 'Address', 'Family'].map((label, idx) => (
                                    <div key={idx} className={`ps-progress-step ${detailStep === idx ? 'active' : ''} ${detailStep > idx ? 'done' : ''}`}>
                                        <div className="ps-progress-step__dot">
                                            {detailStep > idx ? <FaCheckCircle size={14} /> : <span>{idx + 1}</span>}
                                        </div>
                                        <span className="ps-progress-step__label">{label}</span>
                                    </div>
                                ))}
                            </div>

                            {detailStep === DETAIL_STEP.BASIC && (
                                <Row className="g-3 mt-1">
                                    <Col md={6}>
                                        <label className="ps-field-label">Full Name *</label>
                                        <div className="ps-input-icon-wrap">
                                            <FaUser className="ps-input-icon" size={12} />
                                            <Form.Control
                                                type="text"
                                                placeholder="Your full name"
                                                value={userName}
                                                onChange={e => setUserName(e.target.value)}
                                                className="ps-form-input ps-form-input--icon"
                                                autoFocus
                                            />
                                        </div>
                                    </Col>
                                    <Col md={6}>
                                        <label className="ps-field-label">Email Address</label>
                                        <div className="ps-input-icon-wrap">
                                            <FaEnvelope className="ps-input-icon" size={12} />
                                            <Form.Control
                                                type="email"
                                                placeholder="Email address"
                                                value={userEmail}
                                                onChange={e => setUserEmail(e.target.value)}
                                                className="ps-form-input ps-form-input--icon"
                                            />
                                        </div>
                                    </Col>
                                    <Col md={6}>
                                        <label className="ps-field-label">Student Name</label>
                                        <Form.Control value={studentProfile.studentName} onChange={(e) => updateStudentProfileField('studentName', e.target.value)} className="ps-form-input" />
                                    </Col>
                                    <Col md={6}>
                                        <label className="ps-field-label">Gender</label>
                                        <Form.Select value={studentProfile.gender} onChange={(e) => updateStudentProfileField('gender', e.target.value)} className="ps-form-input">
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </Form.Select>
                                    </Col>
                                    <Col md={6}>
                                        <label className="ps-field-label">Date of Birth</label>
                                        <Form.Control type="date" value={studentProfile.dateOfBirth} onChange={(e) => updateStudentProfileField('dateOfBirth', e.target.value)} className="ps-form-input" />
                                    </Col>
                                    <Col md={6}>
                                        <label className="ps-field-label">Joining Year</label>
                                        <Form.Control value={studentProfile.joiningYear} onChange={(e) => updateStudentProfileField('joiningYear', e.target.value)} placeholder="2026" className="ps-form-input" />
                                    </Col>
                                    <Col md={6}>
                                        <label className="ps-field-label">Date of Joining</label>
                                        <Form.Control type="date" value={studentProfile.dateOfJoining} onChange={(e) => updateStudentProfileField('dateOfJoining', e.target.value)} className="ps-form-input" />
                                    </Col>
                                    <Col md={6}>
                                        <label className="ps-field-label">Blood Group</label>
                                        <Form.Control value={studentProfile.bloodGroup} onChange={(e) => updateStudentProfileField('bloodGroup', e.target.value)} className="ps-form-input" />
                                    </Col>
                                    <Col md={6}>
                                        <label className="ps-field-label">Nationality</label>
                                        <Form.Control value={studentProfile.nationality} onChange={(e) => updateStudentProfileField('nationality', e.target.value)} className="ps-form-input" />
                                    </Col>
                                    <Col md={6}>
                                        <label className="ps-field-label">Profile Photo URL</label>
                                        <Form.Control value={studentProfile.profilePhoto} onChange={(e) => updateStudentProfileField('profilePhoto', e.target.value)} className="ps-form-input" />
                                    </Col>
                                </Row>
                            )}

                            {detailStep === DETAIL_STEP.ADDRESS && (
                                <Row className="g-3 mt-1">
                                    <Col xs={12}>
                                        <label className="ps-field-label">Search Address</label>
                                        <GooglePlaceSelect
                                            value={studentProfile.address1 ? { label: studentProfile.address1, value: studentProfile.address1 } : null}
                                            onChange={handleStudentLocationSelect}
                                        />
                                    </Col>
                                    <Col md={6}>
                                        <label className="ps-field-label">Address 1</label>
                                        <Form.Control value={studentProfile.address1} onChange={(e) => updateStudentProfileField('address1', e.target.value)} className="ps-form-input" />
                                    </Col>
                                    <Col md={6}>
                                        <label className="ps-field-label">Address 2</label>
                                        <Form.Control value={studentProfile.address2} onChange={(e) => updateStudentProfileField('address2', e.target.value)} className="ps-form-input" />
                                    </Col>
                                    <Col md={6}>
                                        <label className="ps-field-label">Street / Area</label>
                                        <Form.Control value={studentProfile.street} onChange={(e) => updateStudentProfileField('street', e.target.value)} className="ps-form-input" />
                                    </Col>
                                    <Col md={6}>
                                        <label className="ps-field-label">City / District</label>
                                        <Form.Control value={studentProfile.cityDistrict} onChange={(e) => updateStudentProfileField('cityDistrict', e.target.value)} className="ps-form-input" />
                                    </Col>
                                    <Col md={4}>
                                        <label className="ps-field-label">State</label>
                                        <Form.Control value={studentProfile.state} onChange={(e) => updateStudentProfileField('state', e.target.value)} className="ps-form-input" />
                                    </Col>
                                    <Col md={4}>
                                        <label className="ps-field-label">PIN Code</label>
                                        <Form.Control value={studentProfile.pinCode} onChange={(e) => updateStudentProfileField('pinCode', e.target.value)} className="ps-form-input" />
                                    </Col>
                                    <Col md={4}>
                                        <label className="ps-field-label">Location</label>
                                        <Form.Control value={studentProfile.location} onChange={(e) => updateStudentProfileField('location', e.target.value)} placeholder="Online / City" className="ps-form-input" />
                                    </Col>
                                </Row>
                            )}

                            {detailStep === DETAIL_STEP.FAMILY && (
                                <Row className="g-3 mt-1">
                                    <Col md={4}>
                                        <label className="ps-field-label">Mother Name</label>
                                        <Form.Control value={studentProfile.motherName} onChange={(e) => updateStudentProfileField('motherName', e.target.value)} className="ps-form-input" />
                                    </Col>
                                    <Col md={4}>
                                        <label className="ps-field-label">Mother Mobile</label>
                                        <Form.Control value={studentProfile.motherMobile} onChange={(e) => updateStudentProfileField('motherMobile', e.target.value)} className="ps-form-input" />
                                    </Col>
                                    <Col md={4}>
                                        <label className="ps-field-label">Mother Email</label>
                                        <Form.Control type="email" value={studentProfile.motherEmail} onChange={(e) => updateStudentProfileField('motherEmail', e.target.value)} className="ps-form-input" />
                                    </Col>
                                    <Col md={4}>
                                        <label className="ps-field-label">Father Name</label>
                                        <Form.Control value={studentProfile.fatherName} onChange={(e) => updateStudentProfileField('fatherName', e.target.value)} className="ps-form-input" />
                                    </Col>
                                    <Col md={4}>
                                        <label className="ps-field-label">Father Mobile</label>
                                        <Form.Control value={studentProfile.fatherMobile} onChange={(e) => updateStudentProfileField('fatherMobile', e.target.value)} className="ps-form-input" />
                                    </Col>
                                    <Col md={4}>
                                        <label className="ps-field-label">Father Email</label>
                                        <Form.Control type="email" value={studentProfile.fatherEmail} onChange={(e) => updateStudentProfileField('fatherEmail', e.target.value)} className="ps-form-input" />
                                    </Col>
                                    <Col md={4}>
                                        <label className="ps-field-label">Home Phone</label>
                                        <Form.Control value={studentProfile.homePhone} onChange={(e) => updateStudentProfileField('homePhone', e.target.value)} className="ps-form-input" />
                                    </Col>
                                    <Col md={4}>
                                        <label className="ps-field-label">Emergency Contact</label>
                                        <Form.Control value={studentProfile.emergencyDetails} onChange={(e) => updateStudentProfileField('emergencyDetails', e.target.value)} className="ps-form-input" />
                                    </Col>
                                    <Col md={4}>
                                        <label className="ps-field-label">Relationship</label>
                                        <Form.Control value={studentProfile.relationship} onChange={(e) => updateStudentProfileField('relationship', e.target.value)} className="ps-form-input" />
                                    </Col>
                                    <Col md={6}>
                                        <label className="ps-field-label">Emergency Phone No</label>
                                        <Form.Control value={studentProfile.emergencyPhoneNo} onChange={(e) => updateStudentProfileField('emergencyPhoneNo', e.target.value)} className="ps-form-input" />
                                    </Col>
                                    <Col md={6}>
                                        <label className="ps-field-label">Allergies</label>
                                        <Form.Control value={studentProfile.allergies} onChange={(e) => updateStudentProfileField('allergies', e.target.value)} className="ps-form-input" />
                                    </Col>
                                    <Col xs={12}>
                                        <label className="ps-field-label">Medical Condition</label>
                                        <Form.Control as="textarea" rows={2} value={studentProfile.medicalCondition} onChange={(e) => updateStudentProfileField('medicalCondition', e.target.value)} className="ps-form-input" />
                                    </Col>
                                </Row>
                            )}

                            <div className="ps-details-footer">
                                <button
                                    className="ps-auth-back-btn"
                                    onClick={() => {
                                        if (detailStep === DETAIL_STEP.BASIC) { setAuthStep(AUTH_STEP.OTP); return; }
                                        setDetailStep((prev) => Math.max(DETAIL_STEP.BASIC, prev - 1));
                                    }}
                                    disabled={authLoading}
                                >
                                    ← Back
                                </button>
                                <button
                                    className={`ps-auth-btn ps-auth-btn--inline ${(authLoading || !userName.trim()) ? 'ps-auth-btn--disabled' : ''}`}
                                    onClick={handleDetailStepContinue}
                                    disabled={authLoading || !userName.trim()}
                                >
                                    {authLoading ? <Spinner size="sm" /> : (detailStep === DETAIL_STEP.FAMILY ? 'Continue to Enrollment →' : 'Next →')}
                                </button>
                            </div>
                        </div>
                    )}
                </Modal.Body>
            </Modal>

            {/* ===== CONFIRM + PAYMENT MODE MODAL ===== */}
            <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered className="ps-confirm-modal">
                <Modal.Header closeButton className="ps-modal-header">
                    <Modal.Title className="ps-modal-confirm-title">Confirm Enrollment</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    {selectedPkg && (
                        <div className="ps-confirm-summary">
                            <div className="ps-confirm-pkg-name">{selectedPkg.name}</div>
                            {(activeGrade || selectedPkg.gradeName) && (
                                <div className="ps-confirm-pkg-meta">Grade: {activeGrade || selectedPkg.gradeName}</div>
                            )}
                            {selectedPkgOption?.label && (
                                <div className="ps-confirm-pkg-meta">{selectedPkgOption.label}</div>
                            )}
                            {getPackageOriginalPrice(selectedPkg, selectedPkgPriceKey) > Number(selectedPkgOption?.price || getPackageDisplayPrice(selectedPkg)) && (
                                <div className="ps-confirm-original">₹{getPackageOriginalPrice(selectedPkg, selectedPkgPriceKey).toLocaleString()}</div>
                            )}
                            <div className="ps-confirm-price">₹{selectedPackageAmount.toLocaleString()}</div>
                            {appliedCoupon && (
                                <div className="ps-confirm-coupon-applied">
                                    <span className="ps-coupon-tag">✓ {appliedCoupon.code}</span>
                                    <span> –₹{couponDiscountAmount.toLocaleString()}</span>
                                    <div className="ps-confirm-payable">Payable: ₹{payableAmount.toLocaleString()}</div>
                                </div>
                            )}
                            {selectedPkg.description && <div className="ps-confirm-pkg-desc">{selectedPkg.description}</div>}
                        </div>
                    )}

                    <div className="ps-confirm-section">
                        <div className="ps-confirm-section__title">Coupon Code</div>
                        <div className="ps-coupon-row">
                            <Form.Control
                                placeholder="Enter coupon code"
                                value={couponCode}
                                onChange={(event) => {
                                    setCouponCode(event.target.value.toUpperCase());
                                    if (appliedCoupon) setAppliedCoupon(null);
                                }}
                                className="ps-form-input"
                            />
                            {appliedCoupon ? (
                                <button className="ps-coupon-btn ps-coupon-btn--remove" onClick={handleRemoveCoupon}>Remove</button>
                            ) : (
                                <button className="ps-coupon-btn" onClick={handleApplyCoupon} disabled={couponLoading}>
                                    {couponLoading ? <Spinner size="sm" /> : 'Apply'}
                                </button>
                            )}
                        </div>
                        <div className="ps-field-hint mt-1">
                            {appliedCoupon
                                ? `${appliedCoupon.code} gives you ₹${couponDiscountAmount.toLocaleString()} off on this package.`
                                : null }
                        </div>
                    </div>

                    {requiresSchoolSelection ? (
                        <div className="ps-confirm-section">
                            <div className="ps-confirm-section__title">Choose School</div>
                            <Form.Select
                                value={selectedSchoolId}
                                onChange={(event) => {
                                    setSelectedSchoolId(event.target.value);
                                    setPreferredDays([]);
                                    setPreferredSchedule([]);
                                    setPreferredTimeInputs({});
                                }}
                                disabled={schoolsLoading}
                                className="ps-form-input"
                            >
                                <option value="">Select a school</option>
                                {schools.map((school) => (
                                    <option key={school._id} value={school._id}>
                                        {school.schoolName}{school.city ? `, ${school.city}` : ''}{school.state ? `, ${school.state}` : ''}
                                    </option>
                                ))}
                            </Form.Select>
                            <div className="ps-field-hint mt-1">
                                {schoolsLoading ? 'Loading school schedules...' : 'Choose a school to view available days and time slots.'}
                            </div>
                        </div>
                    ) : (
                        <div className="ps-confirm-section">
                            <div className="ps-confirm-section__title">Preferred Day</div>
                            <div className="ps-day-chips">
                                {ENROLLMENT_DAY_OPTIONS.map((day) => (
                                    <button
                                        key={day}
                                        type="button"
                                        className={`ps-chip ${preferredDays.includes(day) ? 'ps-chip--active' : ''}`}
                                        onClick={() => togglePreferredDay(day)}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>
                            <div className="ps-field-hint mt-2">Select one or more days for your preferred class schedule.</div>
                        </div>
                    )}

                    {requiresSchoolSelection && (
                        <>
                            <div className="ps-confirm-section">
                                <div className="ps-confirm-section__title">Preferred Day</div>
                                {selectedSchoolId ? (
                                    availableSchoolDays.length > 0 ? (
                                        <>
                                            <div className="ps-day-chips">
                                                {availableSchoolDays.map((entry) => (
                                                    <button
                                                        key={entry.dayOfWeek}
                                                        type="button"
                                                        className={`ps-chip ${preferredDays.includes(entry.dayOfWeek) ? 'ps-chip--active' : ''}`}
                                                        onClick={() => togglePreferredDay(entry.dayOfWeek)}
                                                    >
                                                        {entry.dayOfWeek}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="ps-field-hint mt-2">Select one or more school days.</div>
                                        </>
                                    ) : (
                                        <div className="ps-field-hint">This school does not have active timings yet.</div>
                                    )
                                ) : (
                                    <div className="ps-field-hint">Choose a school first to view available days.</div>
                                )}
                            </div>

                            <div className="ps-confirm-section">
                                <div className="ps-confirm-section__title">Preferred Time Slots</div>
                                {preferredDays.length > 0 ? (
                                    slotsBySelectedDay.length > 0 ? (
                                        <div className="ps-day-slot-list">
                                            {slotsBySelectedDay.map((entry) => (
                                                <div key={entry.dayOfWeek} className="ps-day-slot-group">
                                                    <div className="ps-day-slot-title">{entry.dayOfWeek}</div>
                                                    {entry.slots.length > 0 ? (
                                                        <div className="ps-day-chips">
                                                            {entry.slots.map((slot) => {
                                                                const slotValue = buildSchoolSlotValue(slot);
                                                                return (
                                                                    <button
                                                                        key={`${entry.dayOfWeek}-${slotValue}`}
                                                                        type="button"
                                                                        className={`ps-chip ${getScheduleTimeSlots(preferredSchedule, entry.dayOfWeek).includes(slotValue) ? 'ps-chip--active' : ''}`}
                                                                        onClick={() => togglePreferredTime(entry.dayOfWeek, slotValue)}
                                                                    >
                                                                        {buildSchoolSlotLabel(slot)}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <div className="ps-field-hint">No time slot available for {entry.dayOfWeek}.</div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="ps-field-hint">No time slot available for the selected day.</div>
                                    )
                                ) : (
                                    <div className="ps-field-hint">Choose a day to view time slots.</div>
                                )}
                            </div>
                        </>
                    )}

                    {!requiresSchoolSelection && (
                        <div className="ps-confirm-section">
                            <div className="ps-confirm-section__title">Preferred Time Slots</div>
                            {preferredDays.length > 0 ? (
                                <div className="ps-day-slot-list">
                                    {preferredDays.map((day) => (
                                        <div key={day} className="ps-day-slot-group">
                                            <div className="ps-day-slot-title">{day}</div>
                                            <div className="ps-coupon-row mb-2">
                                                <Form.Control
                                                    placeholder={`Add time for ${day}`}
                                                    value={preferredTimeInputs[day] || ''}
                                                    onChange={(e) => setPreferredTimeInputs((prev) => ({ ...prev, [day]: e.target.value }))}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPreferredTime(day); } }}
                                                    className="ps-form-input"
                                                />
                                                <button className="ps-coupon-btn" onClick={() => addPreferredTime(day)}>Add</button>
                                            </div>
                                            <div className="ps-day-chips mb-2">
                                {ENROLLMENT_TIME_SUGGESTIONS.map((slot) => (
                                    <button
                                                        key={`${day}-${slot}`}
                                        type="button"
                                                        className={`ps-chip ${getScheduleTimeSlots(preferredSchedule, day).some((item) => item.toLowerCase() === slot.toLowerCase()) ? 'ps-chip--active' : ''}`}
                                                        onClick={() => togglePreferredTime(day, slot)}
                                    >
                                        {slot}
                                    </button>
                                ))}
                            </div>
                                            {getScheduleTimeSlots(preferredSchedule, day).length > 0 && (
                                <div className="ps-time-chips">
                                                    {getScheduleTimeSlots(preferredSchedule, day).map((slot) => (
                                                        <span key={`${day}-${slot}`} className="ps-time-chip">
                                            {slot}
                                                            <button type="button" className="ps-time-chip__remove" onClick={() => removePreferredTime(day, slot)}>×</button>
                                        </span>
                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="ps-field-hint">Choose a day to add time slots.</div>
                            )}
                        </div>
                    )}

                    {bothModesEnabled && (
                        <div className="ps-confirm-section">
                            <div className="ps-confirm-section__title">Payment Method</div>
                            <div className="ps-pay-options">
                                {[
                                    { mode: 'pay_online', icon: <FaCreditCard size={20} />, label: 'Pay Online', sub: 'Secure instant payment via gateway' },
                                    { mode: 'pay_later', icon: <FaClock size={20} />, label: 'Pay Later', sub: 'Reserve now, our team will contact you' },
                                ].map(({ mode, icon, label, sub }) => (
                                    <div
                                        key={mode}
                                        className={`ps-pay-option ${selectedMode === mode ? 'ps-pay-option--active' : ''}`}
                                        onClick={() => setSelectedMode(mode)}
                                    >
                                        <div className="ps-pay-option__icon">{icon}</div>
                                        <div className="ps-pay-option__text">
                                            <div className="ps-pay-option__label">{label}</div>
                                            <div className="ps-pay-option__sub">{sub}</div>
                                        </div>
                                        {selectedMode === mode && <FaCheckCircle className="ps-pay-option__check" size={16} />}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!bothModesEnabled && settings.payLater && !settings.payOnline && (
                        <div className="ps-pay-later-notice">
                            <FaClock />
                            <span>You&apos;ll reserve this course now. Our team will contact you to arrange payment.</span>
                        </div>
                    )}

                    <div className="ps-confirm-section">
                        <Form.Check
                            type="checkbox"
                            id="enrollment-terms"
                            checked={termsAccepted}
                            onChange={(event) => setTermsAccepted(event.target.checked)}
                            label="I agree to the terms and conditions."
                            required
                        />
                    </div>

                </Modal.Body>
                <Modal.Footer className="ps-confirm-footer">
                    <button className="ps-back-link" onClick={() => setShowConfirm(false)}>Go Back</button>
                    <button
                        className={`ps-confirm-btn ${loading ? 'ps-confirm-btn--loading' : ''}`}
                        onClick={handlePurchase}
                        disabled={loading || !termsAccepted}
                    >
                        {loading ? <Spinner size="sm" /> : (selectedMode === 'pay_later' ? '📋 Reserve Enrollment' : '💳 Confirm & Pay')}
                    </button>
                </Modal.Footer>
            </Modal>
 
        </div>
    );
}
