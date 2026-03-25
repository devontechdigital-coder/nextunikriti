'use client';
import { useState } from 'react';
import { Container, Row, Col, Nav, Offcanvas } from 'react-bootstrap';
import Link from 'next/link';
import InstructorNavbar from '@/components/InstructorNavbar';
import { FiVideo, FiBarChart, FiMessageSquare, FiDollarSign, FiHome, FiCalendar, FiUsers, FiClock } from 'react-icons/fi';

export default function InstructorLayout({ children }) {
  const [showSidebar, setShowSidebar] = useState(false);

  const handleSidebarToggle = () => setShowSidebar(!showSidebar);

  const sidebarLinks = [
    { name: 'My Courses', href: '/instructor/courses', icon: <FiVideo /> },
    { name: 'Students', href: '/instructor/students', icon: <FiUsers /> },
    { name: 'Timetable', href: '/instructor/timetable', icon: <FiClock /> },
    { name: 'Attendance', href: '/instructor/attendance', icon: <FiCalendar /> },
    // { name: 'Analytics', href: '/instructor/analytics', icon: <FiBarChart /> },
    // { name: 'Messages', href: '/instructor/messages', icon: <FiMessageSquare /> },
    // { name: 'Earnings', href: '/instructor/earnings', icon: <FiDollarSign /> },
  ];

  const SidebarContent = () => (
    <>
      <div className="p-4 border-bottom d-flex align-items-center gap-2">
        <div className="bg-success rounded-1 p-1">
          <FiHome className="text-white" size={20} />
        </div>
        <h5 className="mb-0 fw-bold tracking-tight text-dark text-md-white">Instructor</h5>
      </div>
      <Nav className="flex-column p-3">
        {sidebarLinks.map((link) => (
          <Nav.Link
            key={link.href}
            as={Link}
            href={link.href}
            onClick={() => setShowSidebar(false)}
            className="text-muted mb-1 py-3 px-3 rounded-2 hover-bg-light transition-all d-flex align-items-center gap-3 sidebar-link"
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
      <div className="d-flex bg-light min-vh-100">
        {/* Desktop Sidebar (Fixed) */}
        <div
          className="bg-white border-end min-vh-100 position-fixed d-none d-md-block shadow-sm"
          style={{ width: '250px', zIndex: 1000 }}
        >
          <SidebarContent />
        </div>

        {/* Mobile Sidebar (Offcanvas) */}
        <Offcanvas
          show={showSidebar}
          onHide={() => setShowSidebar(false)}
          className="bg-white"
          style={{ width: '280px' }}
        >
          <Offcanvas.Header closeButton>
            <Offcanvas.Title className="fw-bold">Menu</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body className="p-0">
            <SidebarContent />
          </Offcanvas.Body>
        </Offcanvas>

        {/* Main Content */}
        <div
          className="flex-grow-1 min-vh-100"
          style={{
            marginLeft: '250px',
            width: 'calc(100% - 250px)'
          }}
          id="instructor-main-content"
        >
          <InstructorNavbar onToggleSidebar={handleSidebarToggle} />
          <Container fluid className="p-4">
            {children}
          </Container>
        </div>
      </div>

      <style jsx global>{`
        .sidebar-link {
          color: #6c757d !important;
        }
        .sidebar-link:hover {
          background-color: #f8f9fa;
          color: var(--bs-success) !important;
        }
        .sidebar-link.active {
          background-color: #e9ecef;
          color: var(--bs-success) !important;
          font-weight: 600;
        }
        .transition-all { transition: all 0.2s ease-in-out; }
        
        @media (max-width: 767.98px) {
          #instructor-main-content {
            margin-left: 0 !important;
            width: 100% !important;
          }
           .text-md-white {
            color: black !important;
          }
        }
      `}</style>
    </>
  );
}
