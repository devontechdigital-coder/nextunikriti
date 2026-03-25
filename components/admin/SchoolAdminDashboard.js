'use client';
import { Row, Col, Card, Spinner, Table, Badge, Button, Alert } from 'react-bootstrap';
import { useGetSchoolAdminDashboardStatsQuery } from '@/redux/api/apiSlice';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import {
  FiUsers, FiUserCheck, FiLayers, FiCalendar,
  FiUserPlus, FiPlusCircle, FiClock, FiList
} from 'react-icons/fi';

const STATUS_COLORS = {
  active: 'success',
  lead: 'warning',
  trial: 'info',
  inactive: 'secondary',
  left: 'danger',
};

function MetricCard({ title, value, icon, color, subtitle }) {
  return (
    <Card className="border-0 shadow-sm h-100 rounded-3 overflow-hidden">
      <Card.Body className="p-4">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div className={`p-2 rounded-2 bg-${color} bg-opacity-10 text-${color} fs-5`}>
            {icon}
          </div>
        </div>
        <h2 className="fw-bold mb-1">{value}</h2>
        <div className="fw-semibold text-dark small">{title}</div>
        {subtitle && <div className="text-muted x-small mt-1">{subtitle}</div>}
      </Card.Body>
    </Card>
  );
}

export default function SchoolAdminDashboard() {
  const { user } = useSelector((state) => state.auth);
  const { data, isLoading, isError } = useGetSchoolAdminDashboardStatsQuery();

  const basePath = '/school';

  if (isLoading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">Loading your school dashboard...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="danger">
        Failed to load dashboard data. Please refresh the page.
      </Alert>
    );
  }

  const {
    totalStudents = 0,
    activeStudents = 0,
    totalInstructors = 0,
    activeBatches = 0,
    todayClasses = [],
    recentStudents = [],
  } = data?.data || {};

  const metrics = [
    { title: 'Total Students', value: totalStudents, icon: <FiUsers />, color: 'primary', subtitle: `${activeStudents} active` },
    { title: 'Active Students', value: activeStudents, icon: <FiUserCheck />, color: 'success' },
    { title: 'Total Instructors', value: totalInstructors, icon: <FiUserCheck />, color: 'info' },
    { title: 'Active Batches', value: activeBatches, icon: <FiLayers />, color: 'warning' },
  ];

  const quickActions = [
    { label: 'Add Student', href: `${basePath}/students`, icon: <FiUserPlus />, variant: 'primary' },
    { label: 'Create Batch', href: `${basePath}/batches`, icon: <FiPlusCircle />, variant: 'success' },
    { label: 'Add Instructor', href: `${basePath}/users`, icon: <FiUsers />, variant: 'info' },
    { label: 'View Timetable', href: `${basePath}/timetable`, icon: <FiCalendar />, variant: 'secondary' },
  ];

  return (
    <div className='p-4'>
      {/* Header */}
      <div className="mb-4">
        <h3 className="fw-bold text-dark mb-1">School Dashboard</h3>
        <p className="text-muted small">
          Welcome back, {user?.name}! Here's your school's daily snapshot.
        </p>
      </div>

      {/* Metric Cards */}
      <Row className="g-3 mb-4">
        {metrics.map((m, i) => (
          <Col key={i} xs={6} lg={3}>
            <MetricCard {...m} />
          </Col>
        ))}
      </Row>

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm rounded-3 mb-4">
        <Card.Body className="p-4">
          <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
            <FiList /> Quick Actions
          </h6>
          <div className="d-flex flex-wrap gap-2">
            {quickActions.map((action, i) => (
              <Link key={i} href={action.href} passHref legacyBehavior>
                <Button as="a" variant={action.variant} size="sm" className="d-flex align-items-center gap-2 px-3 py-2">
                  {action.icon}
                  {action.label}
                </Button>
              </Link>
            ))}
          </div>
        </Card.Body>
      </Card>

      {/* Today's Classes & Recent Students */}
      <Row className="g-4">
        <Col lg={7}>
          <Card className="border-0 shadow-sm rounded-3 h-100">
            <Card.Body className="p-4">
              <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                <FiClock /> Today&apos;s Classes
              </h6>
              {todayClasses.length === 0 ? (
                <div className="text-center text-muted py-4">
                  <FiCalendar size={32} className="mb-2 opacity-50" />
                  <p className="small mb-0">No classes scheduled for today.</p>
                </div>
              ) : (
                <Table responsive hover className="mb-0 small align-middle">
                  <thead className="bg-light">
                    <tr>
                      <th>Batch</th>
                      <th>Time</th>
                      <th>Teacher</th>
                      <th>Room</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayClasses.map((cls) => (
                      <tr key={cls._id}>
                        <td className="fw-semibold">
                          {cls.batchId?.batchName || '—'}
                        </td>
                        <td className="text-muted">
                          {cls.startTime} — {cls.endTime}
                        </td>
                        <td>{cls.teacherId?.name || '—'}</td>
                        <td>{cls.roomName || <span className="text-muted">—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={5}>
          <Card className="border-0 shadow-sm rounded-3 h-100">
            <Card.Body className="p-4">
              <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                <FiUserPlus /> Recent Students
              </h6>
              {recentStudents.length === 0 ? (
                <div className="text-center text-muted py-4">
                  <FiUsers size={32} className="mb-2 opacity-50" />
                  <p className="small mb-0">No students enrolled yet.</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {recentStudents.map((student) => (
                    <div
                      key={student._id}
                      className="d-flex justify-content-between align-items-center p-2 rounded-2"
                      style={{ background: '#f8f9fa' }}
                    >
                      <div>
                        <div className="fw-semibold small">
                          {student.student_name || student.name || '—'}
                        </div>
                        <div className="text-muted x-small">
                          #{student.enrolment_number || 'N/A'}
                        </div>
                      </div>
                      <Badge bg={STATUS_COLORS[student.status] || 'secondary'} className="text-capitalize">
                        {student.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 text-end">
                <Link href={`${basePath}/students`} className="text-primary small text-decoration-none">
                  View all students →
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <style jsx>{`
        .x-small { font-size: 0.75rem; }
      `}</style>
    </div>
  );
}
