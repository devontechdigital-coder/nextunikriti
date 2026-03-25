'use client';

import { Navbar, Container, Nav, Button } from 'react-bootstrap';
import Link from 'next/link';

export default function Header() {
  return (
    <Navbar bg="white" expand="lg" className="shadow-sm py-3 sticky-top">
      <Container>
        <Navbar.Brand as={Link} href="/" className="fw-bold text-primary fs-4">
          <i className="bi bi-mortarboard-fill me-2"></i>NextLMS
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} href="/courses" className="fw-semibold mx-2">Explore Courses</Nav.Link>
            <Nav.Link as={Link} href="/student/dashboard" className="fw-semibold mx-2">My Learning</Nav.Link>
            <Nav.Link as={Link} href="/instructor/dashboard" className="fw-semibold mx-2">Instructor Hub</Nav.Link>
            <Nav.Link as={Link} href="/admin/dashboard" className="fw-semibold mx-2">Admin Panel</Nav.Link>
          </Nav>
          <Nav>
            {/* Real app would check Redux auth state here */}
            <Link href="/login" passHref>
                <Button variant="outline-dark" className="fw-bold px-4 rounded-pill">Sign In</Button>
            </Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
