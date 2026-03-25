'use client';
import { Container, Row, Col, Card, Spinner, Table, Badge } from 'react-bootstrap';
import { useGetAdminDashboardStatsQuery } from '@/redux/api/apiSlice';
import { useSelector } from 'react-redux';
import { FiUsers, FiBook, FiDollarSign, FiActivity, FiArrowUpRight } from 'react-icons/fi';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';
import SchoolAdminDashboard from '@/components/admin/SchoolAdminDashboard';

export default function AdminDashboardPage() {
  const { user } = useSelector((state) => state.auth);
  
  if (user?.role === 'school_admin') {
    return <SchoolAdminDashboard />;
  }

  const { data, isLoading, isError } = useGetAdminDashboardStatsQuery();

  if (isLoading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center min-vh-50 py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">Gathering latest insights...</p>
      </div>
    );
  }

  const { stats, recentActivity, charts } = data?.data || {};

  const statCards = [
    { title: 'Total Users', value: stats?.totalUsers || 0, icon: <FiUsers />, color: 'primary', trend: '+12%' },
    { title: 'Total Courses', value: stats?.totalCourses || 0, icon: <FiBook />, color: 'success', trend: '+5%' },
    { title: 'Total Revenue', value: `$${stats?.totalRevenue || 0}`, icon: <FiDollarSign />, color: 'warning', trend: '+18%' },
    { title: 'Active Students', value: stats?.activeStudents || 0, icon: <FiActivity />, color: 'info', trend: '+8%' },
  ];

  return (
    <div>
      <div className="mb-4">
        <h3 className="fw-bold text-dark mb-1">Dashboard Overview</h3>
        <p className="text-muted small">Welcome back! Here's what's happening with your platform today.</p>
      </div>

      {/* Stats Cards */}
      <Row className="g-4 mb-4">
        {statCards.map((stat, idx) => (
          <Col key={idx} sm={6} lg={3}>
            <Card className="border-0 shadow-sm h-100 rounded-3 overflow-hidden">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className={`p-2 rounded-2 bg-${stat.color} bg-opacity-10 text-${stat.color}`}>
                    {stat.icon}
                  </div>
                  <Badge bg="success" className="bg-opacity-10 text-success border-0">
                    <FiArrowUpRight className="me-1" /> {stat.trend}
                  </Badge>
                </div>
                <h3 className="fw-bold mb-1">{stat.value}</h3>
                <span className="text-muted small fw-medium">{stat.title}</span>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Charts Section */}
      <Row className="g-4 mb-4">
        <Col lg={7}>
          <Card className="border-0 shadow-sm rounded-3">
            <Card.Body className="p-4">
              <h6 className="fw-bold mb-4">User Registration Growth</h6>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <AreaChart data={charts?.userGrowth}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0d6efd" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#0d6efd" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Area type="monotone" dataKey="users" stroke="#0d6efd" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={5}>
          <Card className="border-0 shadow-sm rounded-3">
            <Card.Body className="p-4">
              <h6 className="fw-bold mb-4">Sales Revenue ($)</h6>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={charts?.salesGrowth}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} />
                    <Tooltip 
                       cursor={{fill: '#f8f9fa'}}
                       contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="revenue" fill="#198754" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Activity */}
      <Row className="g-4">
        <Col lg={6}>
          <Card className="border-0 shadow-sm rounded-3">
            <Card.Body className="p-4 text-center text-md-start">
              <h6 className="fw-bold mb-4">Recent Registrations</h6>
              <Table hover responsive className="mb-0 overflow-hidden">
                <thead className="bg-light small">
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody className="small">
                  {recentActivity?.users?.map(user => (
                    <tr key={user._id}>
                      <td>
                        <div className="fw-bold">{user.name}</div>
                        <div className="text-muted x-small">{user.email}</div>
                      </td>
                      <td>
                        <Badge bg={user.role === 'admin' ? 'danger' : user.role === 'instructor' ? 'primary' : 'info'} size="sm">
                          {user.role}
                        </Badge>
                      </td>
                      <td className="text-muted">{new Date(user.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={6}>
          <Card className="border-0 shadow-sm rounded-3">
            <Card.Body className="p-4 text-center text-md-start">
              <h6 className="fw-bold mb-4">Recent Payments</h6>
              <Table hover responsive className="mb-0 overflow-hidden">
                <thead className="bg-light small">
                  <tr>
                    <th>User</th>
                    <th>Course</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody className="small">
                  {recentActivity?.payments?.map(payment => (
                    <tr key={payment._id}>
                      <td className="fw-bold">{payment.userId?.name || 'Deleted User'}</td>
                      <td className="text-truncate" style={{ maxWidth: '150px' }}>{payment.courseId?.title || 'Deleted Course'}</td>
                      <td className="text-success fw-bold">${payment.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
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
