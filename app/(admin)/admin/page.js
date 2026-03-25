'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { Spinner, Container } from 'react-bootstrap';

export default function AdminIndexPage() {
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user?.role === 'school_admin') {
      router.replace('/school/dashboard');
    } else {
      router.replace('/admin/dashboard');
    }
  }, [router, user]);

  return (
    <Container className="py-5 text-center">
      <Spinner animation="border" variant="primary" />
      <p className="mt-3 text-muted">Redirecting to administrator dashboard...</p>
    </Container>
  );
}
