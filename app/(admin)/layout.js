'use client';
import { useState, useEffect } from 'react';
import { Container, Row, Col, Nav, Offcanvas } from 'react-bootstrap';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AdminNavbar from '@/components/AdminNavbar';
import { useSelector } from 'react-redux';
import { FiUsers, FiLayers, FiCreditCard, FiSliders, FiHome, FiUserCheck, FiBox, FiImage, FiSettings, FiBarChart2, FiList, FiFileText, FiMusic, FiLink } from 'react-icons/fi';
import { FaCalendarAlt } from 'react-icons/fa';

export default function AdminLayout({ children }) {
  const [showSidebar, setShowSidebar] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const pathname = usePathname();
  const isSchoolAdmin = pathname?.startsWith('/school');

  const handleSidebarToggle = () => setShowSidebar(!showSidebar);

  const basePath = isSchoolAdmin ? '/school' : '/admin';

  const allSidebarLinks = [
    { name: 'Dashboard', href: `${basePath}/dashboard`, icon: <FiHome /> },
    { name: 'Users', href: `${basePath}/users`, icon: <FiUsers /> },
    { name: 'Instructors', href: `${basePath}/instructors`, icon: <FiUserCheck /> },
    { name: 'Schools', href: `${basePath}/schools`, icon: <FiUserCheck /> },
    { name: 'Students', href: `${basePath}/students`, icon: <FiUserCheck /> },
    { name: 'Batches', href: `${basePath}/batches`, icon: <FiUserCheck /> },
    { name: 'Instruments', href: `${basePath}/instruments`, icon: <FiMusic /> },
    { name: 'Timetable', href: `${basePath}/timetable`, icon: <FaCalendarAlt /> },
    { name: 'Attendance', href: `${basePath}/attendance`, icon: <FaCalendarAlt /> },
    { name: 'Courses', href: `${basePath}/courses`, icon: <FiLayers /> },
    { name: 'Packages', href: `${basePath}/packages`, icon: <FiLayers /> },
    { name: 'Categories', href: `${basePath}/categories`, icon: <FiBox /> },
    { name: 'Menus', href: `${basePath}/menus`, icon: <FiList /> },
    { name: 'Banners', href: `${basePath}/banners`, icon: <FiImage /> },
    { name: 'Pages', href: `${basePath}/pages`, icon: <FiFileText /> },
    { name: 'Gallery', href: `${basePath}/gallery`, icon: <FiImage /> },
    { name: 'Orders', href: `${basePath}/orders`, icon: <FiList /> },
    { name: 'Payments', href: `${basePath}/payments`, icon: <FiCreditCard /> },
    { name: 'Settings', href: `${basePath}/settings`, icon: <FiSettings /> },
    { name: 'Analytics', href: `${basePath}/analytics`, icon: <FiBarChart2 /> },
  ];

  const schoolAdminLinks = ['Dashboard', 'Instructors', 'Students', 'Batches', 'Timetable', 'Attendance', 'Course Mappings', 'Analytics', 'Settings'];
  const sidebarLinks = allSidebarLinks.filter(link => {
    if (isSchoolAdmin) {
      return schoolAdminLinks.includes(link.name);
    }
    return link.name !== 'Schosols';
  });

  const SidebarContent = () => (
    <>
      <div className="p-4 border-bottom border-secondary d-flex align-items-center gap-2 " >
        <div className="bg-primary rounded-1 p-1">
          <FiLayers className="text-white" size={20} />
        </div>
        <h5 className="mb-0 fw-bold text-white tracking-tight">
          {isSchoolAdmin ? 'School Portal' : 'NextLMS'}
        </h5>
      </div>
      <Nav className="flex-column p-3">
        {sidebarLinks.map((link) => (
          <Nav.Link
            key={link.href}
            as={Link}
            href={link.href}
            onClick={() => setShowSidebar(false)}
            className="text-white-50 mb-1 py-1 px-3 rounded-2 transition-all d-flex align-items-center gap-3 sidebar-link"
          >
            <span className="fs-5">{link.icon}</span>
            <span className="fw-medium">{link.name}</span>
          </Nav.Link>
        ))}
      </Nav>
    </>
  );

  return (
    <>
      <div className="d-flex " >
        {/* Desktop Sidebar (Fixed) */}
        <div
          className="bg-dark text-white min-vh-100 position-fixed d-none d-md-block shadow overflow-auto"
          style={{ width: '250px', zIndex: 1000, height: '100vh' }}
        >
          <SidebarContent />
        </div>

        {/* Mobile Sidebar (Offcanvas) */}
        <Offcanvas
          show={showSidebar}
          onHide={() => setShowSidebar(false)}
          className="bg-dark text-white"
          style={{ width: '280px' }}
        >
          <Offcanvas.Header closeButton closeVariant="white">
          </Offcanvas.Header>
          <Offcanvas.Body className="p-0">
            <SidebarContent />
          </Offcanvas.Body>
        </Offcanvas>

        {/* Main Content */}
        <div
          className="flex-grow-1 min-vh-100 bg-light-gray"
          style={{
            marginLeft: '250px',
            width: 'calc(100% - 250px)' // Fix desktop overflow
          }}
          id="admin-main-content"
        >
          <AdminNavbar onToggleSidebar={handleSidebarToggle} />
          <Container fluid className="p-4 p-lg-5">
            {children}
          </Container>
        </div>
      </div>

      <style jsx global>{`
        .bg-light-gray { background-color: #f8f9fa; }
        .sidebar-link:hover {
          background-color: rgba(255, 255, 255, 0.05);
          color: white !important;
          opacity: 1;
        }
        .sidebar-link.active {
          background-color: var(--bs-primary);
          color: white !important;
        }
        .transition-all { transition: all 0.2s ease-in-out; }
        
        @media (max-width: 767.98px) {
          #admin-main-content {
            margin-left: 0 !important;
            width: 100% !important;
          }
        }
      `}</style>
    </>
  );
}
