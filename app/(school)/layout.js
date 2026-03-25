'use client';

import { useState, useEffect } from 'react';
import { Container, Nav, Navbar, Button, Offcanvas, Dropdown } from 'react-bootstrap';
import {
  FiHome, FiUsers, FiLayers, FiCalendar, FiLogOut, FiMenu, FiSettings, FiUser, FiMoreVertical
} from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '@/redux/slices/authSlice';
import axios from 'axios';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function SchoolLayout({ children }) {
  const [showSidebar, setShowSidebar] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
      dispatch(logout());
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      dispatch(logout());
      router.push('/login');
    }
  };

  const sidebarLinks = [
    { name: 'Dashboard', href: '/school/dashboard', icon: <FiHome /> },
    { name: 'Instructors', href: '/school/instructors', icon: <FiUser /> },
    { name: 'Students', href: '/school/students', icon: <FiUsers /> },
    { name: 'Batches', href: '/school/batches', icon: <FiLayers /> },
    { name: 'Timetable', href: '/school/timetable', icon: <FiCalendar /> },
    { name: 'Attendance', href: '/school/attendance', icon: <FiCalendar /> },
  ];

  if (!isMounted) return null;

  return (
    <div className="min-vh-100 bg-light d-flex flex-column">
      {/* Top Navbar */}
      <Navbar bg="white" className="shadow-sm border-bottom py-3 sticky-top">
        <Container fluid className="px-4">
          <div className="d-flex align-items-center gap-3">
            <Button variant="link" className="p-0 text-dark d-lg-none" onClick={() => setShowSidebar(true)}>
              <FiMenu size={24} />
            </Button>
            <Navbar.Brand as={Link} href="/school/dashboard" className="fw-bold text-primary d-flex align-items-center gap-2">
              <div className="bg-primary bg-opacity-10 p-2 rounded-3">
                <FiLayers size={20} />
              </div>
              <span>School Portal</span>
            </Navbar.Brand>
          </div>

          <div className="ms-auto d-flex align-items-center gap-3">
            <Dropdown align="end">
              <Dropdown.Toggle variant="link" className="p-0 text-dark text-decoration-none d-flex align-items-center gap-2">
                <div className="bg-light p-2 rounded-circle border">
                  <FiUser size={18} />
                </div>
                <div className="text-start d-none d-sm-block">
                  <div className="fw-bold small">{user?.name || 'School Admin'}</div>
                  <div className="text-muted extra-small">Administrator</div>
                </div>
              </Dropdown.Toggle>
              <Dropdown.Menu className="shadow border-0 mt-2">
                <Dropdown.Item as={Link} href="/school/settings" className="py-2">
                  <FiSettings className="me-2" /> Settings
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={handleLogout} className="text-danger py-2">
                  <FiLogOut className="me-2" /> Sign Out
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </Container>
      </Navbar>

      <div className="d-flex flex-grow-1">
        {/* Desktop Sidebar */}
        <aside className="bg-white border-right d-none d-lg-block" style={{ width: '280px', minHeight: 'calc(100vh - 72px)' }}>
          <div className="p-4 d-flex flex-column h-100">
            <Nav className="flex-column gap-2 mb-auto">
              {sidebarLinks.map((link) => (
                <Nav.Link
                  key={link.name}
                  as={Link}
                  href={link.href}
                  className={`d-flex align-items-center gap-3 px-3 py-2 rounded-3 transition-all ${pathname.startsWith(link.href) ? 'bg-primary text-white shadow-sm' : 'text-secondary hover-bg-light'
                    }`}
                >
                  <span className="fs-5">{link.icon}</span>
                  <span className="fw-medium">{link.name}</span>
                </Nav.Link>
              ))}
            </Nav>

            <div className="mt-4 pt-4 border-top">
              <div className="bg-light p-3 rounded-3 mb-3">
                <div className="small fw-bold text-dark mb-1">Need Help?</div>
                <div className="text-muted extra-small">Contact support for issues.</div>
              </div>
              <Button variant="outline-danger" className="w-100 d-flex align-items-center justify-content-center gap-2 py-2" onClick={handleLogout}>
                <FiLogOut /> Logout
              </Button>
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar (Offcanvas) */}
        <Offcanvas show={showSidebar} onHide={() => setShowSidebar(false)} className="bg-white">
          <Offcanvas.Header closeButton className="border-bottom px-4">
            <Offcanvas.Title className="fw-bold text-primary d-flex align-items-center gap-2">
              <FiLayers /> School Portal
            </Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body className="p-4">
            <Nav className="flex-column gap-2 h-100">
              {sidebarLinks.map((link) => (
                <Nav.Link
                  key={link.name}
                  as={Link}
                  href={link.href}
                  onClick={() => setShowSidebar(false)}
                  className={`d-flex align-items-center gap-3 px-3 py-3 rounded-3 transition-all ${pathname.startsWith(link.href) ? 'bg-primary text-white shadow-sm' : 'text-secondary hover-bg-light'
                    }`}
                >
                  <span className="fs-5">{link.icon}</span>
                  <span className="fw-medium">{link.name}</span>
                </Nav.Link>
              ))}
              <div className="mt-auto pt-4">
                <Button variant="outline-danger" className="w-100 py-3" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </Nav>
          </Offcanvas.Body>
        </Offcanvas>

        {/* Main Content Area */}
        <main className="flex-grow-1 p-0 bg-light" style={{ overflowX: 'hidden' }}>
          {children}
        </main>
      </div>

      <style jsx>{`
        .transition-all { transition: all 0.2s ease; }
        .hover-bg-light:hover { background-color: rgba(0,0,0,0.03); color: var(--bs-primary) !important; }
        .extra-small { font-size: 0.75rem; }
      `}</style>
    </div>
  );
}
