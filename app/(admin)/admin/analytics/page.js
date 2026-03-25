'use client';
import { Container } from 'react-bootstrap';

export default function AdminAnalyticsPage() {
  return (
    <Container className="py-5">
      <h2 className="fw-bold mb-4">Platform Analytics</h2>
      <div className="bg-white rounded shadow-sm p-5 text-center">
        <p className="text-muted mb-0">Detailed insights into user engagement, course popularity, and revenue growth.</p>
      </div>
    </Container>
  );
}
