'use client';
import { Container } from 'react-bootstrap';

export default function AdminPaymentsPage() {
  return (
    <Container className="py-5">
      <h2 className="fw-bold mb-4">Payment Management</h2>
      <div className="bg-white rounded shadow-sm p-5 text-center">
        <p className="text-muted mb-0">Track transactions, manage payouts, and configure payment gateway settings.</p>
      </div>
    </Container>
  );
}
