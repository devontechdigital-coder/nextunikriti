import { Navbar, Container, Nav, Button, Dropdown } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAdminLogoutMutation } from '@/redux/api/apiSlice';
import { FiLogOut, FiUser, FiBell, FiMenu } from 'react-icons/fi';
import { useSelector, useDispatch } from 'react-redux';
import { logout as logoutAction } from '@/redux/slices/authSlice';

export default function AdminNavbar({ onToggleSidebar }) {
  const [isMounted, setIsMounted] = useState(false);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const router = useRouter();
  const pathname = usePathname();
  const isSchoolAdminView = pathname?.startsWith('/school');
  const [logout] = useAdminLogoutMutation();
  const dispatch = useDispatch();

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      dispatch(logoutAction());
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if API fails, clear local state and redirect
      dispatch(logoutAction());
      router.push('/login');
    }
  };

  return (
    <Navbar bg="white" className="border-bottom py-2 shadow-sm" sticky="top">
      <Container fluid>
        <div className="d-flex align-items-center gap-3">
          <Button 
            variant="light" 
            className="d-md-none border-0 bg-transparent text-dark" 
            onClick={onToggleSidebar}
          >
            <FiMenu size={24} />
          </Button>
          <Navbar.Brand className="fw-bold text-primary mb-0 d-md-none">
            {isSchoolAdminView ? 'School Admin' : 'NextLMS Admin'}
          </Navbar.Brand>
        </div>

        <Nav className="ms-auto align-items-center">
          <Nav.Link className="text-muted mx-2 d-none d-sm-block">
            <FiBell size={20} />
          </Nav.Link>
          
          <Dropdown align="end" className="ms-2">
            <Dropdown.Toggle variant="light" className="d-flex align-items-center gap-2 border-0 bg-transparent">
              <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '32px', height: '32px' }}>
                <FiUser />
              </div>
              <span className="d-none d-sm-inline fw-semibold text-dark">
                {isMounted && user?.name ? user.name : 'Admin'}
              </span>
            </Dropdown.Toggle>

            <Dropdown.Menu className="shadow border-0 mt-2 py-2">
              <Dropdown.Header className="text-uppercase small fw-bold text-muted">Account Settings</Dropdown.Header>
              <Dropdown.Item href={isSchoolAdminView ? '/school/settings' : '/admin/settings'} className="py-2">
                {isSchoolAdminView ? 'School Profile' : 'Admin Profile'}
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item onClick={handleLogout} className="text-danger d-flex align-items-center gap-2 py-2">
                <FiLogOut /> Logout Session
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Nav>
      </Container>
    </Navbar>
  );
}
