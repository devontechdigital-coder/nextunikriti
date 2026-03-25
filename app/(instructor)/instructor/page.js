'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner, Container } from 'react-bootstrap';

export default function InstructorDashboard() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/instructor/courses');
  }, [router]);

  return (
    <Container className="py-5 text-center">
      <Spinner animation="border" variant="primary" />
      <p className="mt-3 text-muted">Redirecting to your courses...</p>
    </Container>
  );
}
