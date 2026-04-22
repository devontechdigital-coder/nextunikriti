'use client';
import { Container, Row, Col, Nav } from 'react-bootstrap';
import { FiBook, FiLogOut, FiUser } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { logout as logoutAction } from '@/redux/slices/authSlice';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';

export default function StudentLayout({ children }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    // Basic access control: Redirect non-students to their respective dashboards
    if (isAuthenticated && user?.role && user.role !== 'student') {
        const dashboardUrls = {
            admin: '/admin',
            instructor: '/instructor',
            school_admin: '/school/dashboard'
        };
        const target = dashboardUrls[user.role];
        if (target) router.push(target);
    }
  }, [user, isAuthenticated, router]);

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
      dispatch(logoutAction());
      router.push('/login');
    } catch (err) {
      console.error('Logout failed', err);
      dispatch(logoutAction());
      router.push('/login');
    }
  };

  return (
    <>
      <Container fluid className="bg-light min-vh-100">
        <Row>
          <Col md={3} lg={2} className="bg-dark text-white p-0 min-vh-100 position-fixed d-none d-md-block">
            <div className="p-4 border-bottom border-secondary">
              <h5 className="mb-0 text-truncate">Student Panel</h5>
            </div>
            <Nav className="flex-column p-3">
              <Nav.Link as={Link} href="/student/dashboard" className="text-white mb-2"><FiBook className="me-2"/> My Learning</Nav.Link>
              <Nav.Link as={Link} href="/student/profile" className="text-white mb-2"><FiUser className="me-2"/> My Profile</Nav.Link>
              <hr className="bg-secondary" />
              <Nav.Link onClick={handleLogout} className="text-danger mb-2" style={{ cursor: 'pointer' }}>
                <FiLogOut className="me-2"/> Logout
              </Nav.Link>
            </Nav>
          </Col>
          <Col md={{ span: 9, offset: 3 }} lg={{ span: 10, offset: 2 }} className="p-4">
            {children}
          </Col>
        </Row>
      </Container>
    </>
  );
}
