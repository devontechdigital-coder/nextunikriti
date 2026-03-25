'use client';

import { useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { Container, Table, Spinner, Alert, Form, Button, Modal, Badge, Row, Col } from 'react-bootstrap';
import { 
  useGetAdminBatchesQuery,
  useGetAdminSchoolsQuery,
  useGetAdminUsersQuery,
  useGetAdminInstrumentsQuery,
  useGetAdminLevelsQuery,
  useCreateAdminBatchMutation, 
  useDeleteAdminBatchMutation,
  useGetBatchCourseQuery,
  useAssignBatchCourseMutation,
  useGetAdminCoursesQuery,
  useGetCourseMappingsQuery
} from '@/redux/api/apiSlice';
import { FaEdit, FaTrash, FaPlus, FaCheckCircle, FaLayerGroup, FaSearch, FaFilter, FaCalendarAlt, FaUserTie } from 'react-icons/fa';
import Link from 'next/link';
import { useSelector } from 'react-redux';

export default function BatchesPage() {
  const [filters, setFilters] = useState({ 
    schoolId: (typeof window !== 'undefined' && JSON.parse(localStorage.getItem('auth_user') || '{}')?.role === 'school_admin') 
      ? (JSON.parse(localStorage.getItem('auth_user') || '{}')?.schoolId || JSON.parse(localStorage.getItem('auth_user') || '{}')?._id)
      : '', 
    teacherId: '', 
    programType: '' 
  });
  const { data, isLoading, isError, error } = useGetAdminBatchesQuery(filters);
  const { data: schoolData } = useGetAdminSchoolsQuery();
  const { data: userData } = useGetAdminUsersQuery({ role: 'instructor' });
  const { data: instrumentData } = useGetAdminInstrumentsQuery({ status: 'active' });
  const { data: coursesData } = useGetAdminCoursesQuery();
  
  const pathname = usePathname();
  const isSchoolAdminPath = useMemo(() => pathname.startsWith('/school'), [pathname]);

  const { user } = useSelector((state) => state.auth);
  const isSchoolAdmin = user?.role === 'school_admin' || isSchoolAdminPath;
  const schoolId = user?.schoolId || user?._id;

  const [createBatch, { isLoading: isCreating }] = useCreateAdminBatchMutation();
  const [deleteBatch, { isLoading: isDeleting }] = useDeleteAdminBatchMutation();

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentBatchId, setCurrentBatchId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedBatchForCourse, setSelectedBatchForCourse] = useState(null);
  const [batchToDelete, setBatchToDelete] = useState(null);
  
  const [formData, setFormData] = useState({ 
    batchName: '', schoolId: '', programType: 'in_school', 
    instrument: 'Keyboard', level: 'Foundation', teacherId: '', 
    maxStrength: 20, startDate: '', endDate: '', status: 'active',
    course_id: '', price: 0, timetable: [{ day: 'Monday', time: '10:00' }]
  });
  const [successMsg, setSuccessMsg] = useState('');

  const batches = data?.batches || [];
  const schools = schoolData?.schools || [];
  const teachers = userData?.data || [];
  const activeInstruments = instrumentData?.instruments || [];

  // Fetch levels for the selected instrument in the form
  const selectedInstrument = activeInstruments.find(i => i.name === formData.instrument);
  const { data: levelData } = useGetAdminLevelsQuery(
    { instrumentId: selectedInstrument?._id, status: 'active' }, 
    { skip: !selectedInstrument }
  );
  const availableLevels = levelData?.levels || [];
  
  // Ensure the current selection is always available in the list to avoid reset during loading
  const displayLevels = useMemo(() => {
    if (isEditing && formData.level && !availableLevels.find(l => l.levelName === formData.level)) {
      return [{ _id: 'temp', levelName: formData.level }, ...availableLevels];
    }
    return availableLevels;
  }, [availableLevels, isEditing, formData.level]);

  const displayInstruments = useMemo(() => {
    if (isEditing && formData.instrument && !activeInstruments.find(i => i.name === formData.instrument)) {
      return [{ _id: 'temp', name: formData.instrument }, ...activeInstruments];
    }
    return activeInstruments;
  }, [activeInstruments, isEditing, formData.instrument]);

  const [updateBatch, { isLoading: isUpdating }] = useAssignBatchCourseMutation(); // Reusing or better create a specific update mutation if available

  const normalizeTime = (timeStr) => {
    if (!timeStr) return '10:00';
    // If already in HH:mm format
    if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;
    // If in H:mm format, pad it
    if (/^\d{1}:\d{2}$/.test(timeStr)) return `0${timeStr}`;
    // If in AM/PM format
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (match) {
      let [_, hours, minutes, ampm] = match;
      hours = parseInt(hours);
      if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
      if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
      return `${hours.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    }
    return '10:00';
  };

  const handleOpenModal = (batch = null) => {
    if (batch) {
      setIsEditing(true);
      setCurrentBatchId(batch._id);
      setFormData({
        batchName: batch.batchName,
        schoolId: (batch.schoolId?._id || batch.schoolId || '').toString(),
        programType: batch.programType,
        instrument: batch.instrument,
        level: batch.level,
        teacherId: (batch.teacherId?._id || batch.teacherId || '').toString(),
        maxStrength: batch.maxStrength,
        startDate: batch.startDate ? new Date(batch.startDate).toISOString().split('T')[0] : '',
        endDate: batch.endDate ? new Date(batch.endDate).toISOString().split('T')[0] : '',
        status: batch.status,
        course_id: (batch.course_id?._id || batch.course_id || '').toString(),
        price: batch.price || 0,
        timetable: batch.timetable && batch.timetable.length > 0 
          ? batch.timetable.map(slot => ({ ...slot, time: normalizeTime(slot.time) }))
          : [{ day: 'Monday', time: '10:00' }]
      });
    } else {
      setIsEditing(false);
      setCurrentBatchId(null);
      setFormData({ 
        batchName: '', schoolId: isSchoolAdmin ? schoolId : '', programType: 'in_school', 
        instrument: 'Keyboard', level: 'Foundation', teacherId: '', 
        maxStrength: 20, startDate: '', endDate: '', status: 'active',
        course_id: '', price: 0, timetable: [{ day: 'Monday', time: '10:00' }]
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        // Logic for update (need to check if we have an updateBatch mutation)
        // For now using axios or better adding mutation to apiSlice
        const response = await fetch(`/api/admin/batches/${currentBatchId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        setSuccessMsg('Batch updated successfully!');
      } else {
        await createBatch(formData).unwrap();
        setSuccessMsg('Batch created successfully!');
      }
      setShowModal(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert(err?.data?.error || 'Failed to create batch.');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteBatch(batchToDelete._id).unwrap();
      setSuccessMsg('Batch deleted successfully!');
      setShowDeleteModal(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert('Failed to delete batch.');
    }
  };

  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-primary fw-bold">Loading batches...</p>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0 text-dark">Batch Management</h2>
          <p className="text-muted">Schedule classes, assign teachers, and manage capacity</p>
        </div>
        <Button variant="primary" className="d-flex align-items-center gap-2 px-4 shadow-sm" onClick={handleOpenModal}>
          <FaPlus /> Create New Batch
        </Button>
      </div>

      <div className="bg-white p-4 rounded shadow-sm mb-4 border">
        <Row className="g-3">
          {!isSchoolAdminPath && (
            <Col md={4}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted mb-1 d-flex align-items-center gap-1">
                  <FaFilter size={12} /> School
                </Form.Label>
                <Form.Select 
                  value={filters.schoolId}
                  onChange={(e) => setFilters({...filters, schoolId: e.target.value})}
                >
                  <option value="">All Schools</option>
                  {schools.map(s => (
                    <option key={s._id} value={s._id}>{s.schoolName}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          )}
          <Col md={isSchoolAdminPath ? 6 : 4}>
            <Form.Group>
              <Form.Label className="small fw-bold text-muted mb-1 d-flex align-items-center gap-1">
                <FaFilter size={12} /> Teacher
              </Form.Label>
              <Form.Select 
                value={filters.teacherId}
                onChange={(e) => setFilters({...filters, teacherId: e.target.value})}
              >
                <option value="">All Teachers</option>
                {teachers.map(t => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label className="small fw-bold text-muted mb-1 d-flex align-items-center gap-1">
                <FaFilter size={12} /> Program Type
              </Form.Label>
              <Form.Select 
                value={filters.programType}
                onChange={(e) => setFilters({...filters, programType: e.target.value})}
              >
                <option value="">All Programs</option>
                <option value="in_school">In School</option>
                <option value="after_school">After School</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
      </div>

      {successMsg && (
        <Alert variant="success" className="d-flex align-items-center gap-2 shadow-sm border-0 mb-4">
          <FaCheckCircle /> {successMsg}
        </Alert>
      )}

      <div className="bg-white rounded shadow-sm overflow-hidden mb-4 border">
        <Table hover responsive className="mb-0">
          <thead className="bg-light text-secondary text-uppercase small fw-bold">
            <tr>
              <th className="ps-4 py-3">Batch Name</th>
              <th className="py-3">Details</th>
              <th>{isSchoolAdminPath ? 'Teacher' : 'School / Teacher'}</th>
              <th className="py-3 text-center">Strength</th>
              <th className="py-3">Status</th>
              <th className="text-end pe-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((batch) => (
              <tr key={batch._id} className="align-middle">
                <td className="ps-4">
                  <div className="d-flex align-items-center gap-3 py-2">
                    <div className="bg-primary bg-opacity-10 p-2 rounded text-primary">
                      <FaLayerGroup size={18} />
                    </div>
                    <div>
                      <div className="fw-bold">{batch.batchName}</div>
                      <small className="text-muted d-block">{batch.instrument} - {batch.level}</small>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="small">
                    <Badge bg="light" text="dark" className="border mt-1 me-1">
                      {batch.programType?.replace('_', ' ').toUpperCase()}
                    </Badge>
                    {batch.course_id && (
                      <Badge bg="info" className="mt-1 me-1">
                        Course: {batch.course_id.title}
                      </Badge>
                    )}
                    {batch.price > 0 && (
                      <Badge bg="success" className="mt-1">
                        ₹{batch.price.toLocaleString()}
                      </Badge>
                    )}
                  </div>
                </td>
                <td>
                  <div className="small">
                    {isSchoolAdminPath ? (
                      // Render nothing or a specific message if it's a school admin path and school info is not needed
                      null
                    ) : (
                      <div className="fw-medium">{batch.schoolId?.schoolName || 'N/A'}</div>
                    )}
                    <div className="text-muted"><FaUserTie size={10} /> {batch.teacherId?.name || 'N/A'}</div>
                  </div>
                </td>
                <td className="text-center font-monospace">
                   <span className="fw-bold text-primary">?</span> / {batch.maxStrength}
                </td>
                <td>
                  <Badge pill bg={batch.status === 'active' ? 'success' : 'secondary'}>
                    {batch.status?.toUpperCase()}
                  </Badge>
                </td>
                <td className="text-end pe-4">
                  <Button 
                    variant="outline-info" 
                    size="sm" 
                    className="me-2 rounded-pill px-3"
                    onClick={() => { setSelectedBatchForCourse(batch); setShowAssignModal(true); }}
                  >
                    Course
                  </Button>
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    className="me-2 rounded-circle shadow-xs"
                    onClick={() => handleOpenModal(batch)}
                  >
                    <FaEdit size={12} />
                  </Button>
                  <Link href={`/admin/batches/${batch._id}`} passHref>
                    <Button variant="outline-primary" size="sm" className="me-2 rounded-pill px-3">
                      Manage
                    </Button>
                  </Link>
                  <Button variant="outline-danger" size="sm" className="rounded-circle shadow-xs" onClick={() => { setBatchToDelete(batch); setShowDeleteModal(true); }}>
                    <FaTrash size={12} />
                  </Button>
                </td>
              </tr>
            ))}
            {batches.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-5 text-muted">
                  No batches found matching selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {/* Create Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="fw-bold fs-5">
            {isEditing ? `Edit Batch: ${formData.batchName}` : 'Create New Academic Batch'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="p-4">
            <Row className="mb-4">
              <Col md={isSchoolAdminPath ? 12 : 6} className="mb-3">
                <Form.Label className="small fw-bold">Batch Name</Form.Label>
                <Form.Control required placeholder="e.g. MON-WED-A" value={formData.batchName} onChange={(e) => setFormData({...formData, batchName: e.target.value})} />
              </Col>
              {!isSchoolAdminPath && (
                <Col md={6} className="mb-3">
                  <Form.Label className="small fw-bold">School</Form.Label>
                  <Form.Select required value={formData.schoolId} onChange={(e) => setFormData({...formData, schoolId: e.target.value})}>
                    <option value="">Select School</option>
                    {schools.map(s => <option key={s._id.toString()} value={s._id.toString()}>{s.schoolName}</option>)}
                  </Form.Select>
                </Col>
              )}
              <Col md={4} className="mb-3">
                <Form.Label className="small fw-bold">Program Type</Form.Label>
                <Form.Select value={formData.programType} onChange={(e) => setFormData({...formData, programType: e.target.value})}>
                  <option value="in_school">In School</option>
                  <option value="after_school">After School</option>
                </Form.Select>
              </Col>
              <Col md={4} className="mb-3">
                <Form.Label className="small fw-bold">Instrument</Form.Label>
                <Form.Select 
                  value={formData.instrument} 
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData(prev => ({...prev, instrument: val, level: ''}));
                  }}
                >
                  <option value="">Select Instrument</option>
                  {displayInstruments.map(i => <option key={i._id} value={i.name}>{i.name}</option>)}
                </Form.Select>
              </Col>
              <Col md={4} className="mb-3">
                <Form.Label className="small fw-bold">Level</Form.Label>
                <Form.Select 
                  value={formData.level} 
                  onChange={(e) => setFormData({...formData, level: e.target.value})}
                  disabled={!formData.instrument}
                >
                  <option value="">Select Level</option>
                  {displayLevels.map(l => <option key={l._id} value={l.levelName}>{l.levelName}</option>)}
                </Form.Select>
              </Col>
              <Col md={6} className="mb-3">
                <Form.Label className="small fw-bold">Assigned Teacher</Form.Label>
                <Form.Select required value={formData.teacherId} onChange={(e) => setFormData({...formData, teacherId: e.target.value})}>
                  <option value="">Select Instructor</option>
                  {teachers.map(t => <option key={t._id.toString()} value={t._id.toString()}>{t.name}</option>)}
                </Form.Select>
              </Col>
              <Col md={6} className="mb-3">
                <Form.Label className="small fw-bold">Max Capacity</Form.Label>
                <Form.Control type="number" required min="1" value={formData.maxStrength} onChange={(e) => setFormData({...formData, maxStrength: e.target.value})} />
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-bold">Start Date</Form.Label>
                <Form.Control type="date" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} />
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-bold">End Date</Form.Label>
                <Form.Control type="date" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} />
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-bold">Status</Form.Label>
                <Form.Select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Form.Select>
              </Col>
              
              <Col md={12} className="border-top pt-4 mt-2">
                <h6 className="fw-bold mb-3">Course & Pricing</h6>
              </Col>

              <Col md={8} className="mb-3">
                <Form.Label className="small fw-bold">Link to Course</Form.Label>
                <Form.Select 
                  required 
                  value={formData.course_id} 
                  onChange={(e) => setFormData({...formData, course_id: e.target.value})}
                >
                  <option value="">-- Select Course --</option>
                  {coursesData?.data?.map(c => (
                    <option key={c._id.toString()} value={c._id.toString()}>{c.title}</option>
                  ))}
                </Form.Select>
              </Col>

              <Col md={4} className="mb-3">
                <Form.Label className="small fw-bold">Batch Price (₹)</Form.Label>
                <Form.Control 
                  type="number" 
                  value={formData.price} 
                  onChange={(e) => setFormData({...formData, price: e.target.value})} 
                />
              </Col>

              <Col md={12} className="border-top pt-4 mt-2">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold mb-0">Weekly Timetable</h6>
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    onClick={() => setFormData({
                      ...formData, 
                      timetable: [...formData.timetable, { day: 'Monday', time: '10:00' }]
                    })}
                  >
                    + Add Slot
                  </Button>
                </div>
                {formData.timetable.map((slot, idx) => (
                  <Row key={idx} className="mb-2 align-items-end">
                    <Col md={5}>
                      <Form.Label className="extra-small fw-bold">Day</Form.Label>
                      <Form.Select 
                        value={slot.day} 
                        onChange={(e) => {
                          const newTT = [...formData.timetable];
                          newTT[idx].day = e.target.value;
                          setFormData({...formData, timetable: newTT});
                        }}
                      >
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </Form.Select>
                    </Col>
                    <Col md={5}>
                      <Form.Label className="extra-small fw-bold">Time</Form.Label>
                      <Form.Control 
                        type="time" 
                        value={slot.time} 
                        onChange={(e) => {
                          const newTT = [...formData.timetable];
                          newTT[idx].time = e.target.value;
                          setFormData({...formData, timetable: newTT});
                        }} 
                      />
                    </Col>
                    <Col md={2}>
                      <Button 
                        variant="outline-danger" 
                        size="sm" 
                        onClick={() => {
                          const newTT = formData.timetable.filter((_, i) => i !== idx);
                          setFormData({...formData, timetable: newTT});
                        }}
                      >
                        <FaTrash />
                      </Button>
                    </Col>
                  </Row>
                ))}
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="bg-light">
            <Button variant="link" onClick={() => setShowModal(false)} className="text-secondary text-decoration-none">Cancel</Button>
            <Button variant="primary" type="submit" disabled={isCreating || isUpdating} className="px-5 shadow-sm rounded-pill">
              {isCreating || isUpdating ? <Spinner size="sm" /> : isEditing ? 'Update Batch' : 'Create Batch'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold text-danger">Delete Batch</Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-4">
          <p className="mb-0">Are you sure you want to delete batch <strong>{batchToDelete?.batchName}</strong>?</p>
          <p className="text-muted small mt-2">This will also remove all student enrollment records associated with this batch.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete} disabled={isDeleting} className="px-4">
            {isDeleting ? <Spinner size="sm" /> : 'Confirm Delete'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Assign Course Modal */}
      <AssignCourseModal 
        show={showAssignModal} 
        onHide={() => setShowAssignModal(false)} 
        batch={selectedBatchForCourse} 
      />
    </Container>
  );
}

function AssignCourseModal({ show, onHide, batch }) {
  const { data: batchCourseData, isLoading: isLoadingBatchCourse } = useGetBatchCourseQuery(batch?._id, { skip: !batch });
  const { data: coursesData } = useGetAdminCoursesQuery();
  const [assignCourse, { isLoading: isAssigning }] = useAssignBatchCourseMutation();
  
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const courses = coursesData?.data || [];

  const handleAssign = async () => {
    try {
      await assignCourse({ batchId: batch._id, courseId: selectedCourseId }).unwrap();
      alert('Course assigned successfully!');
      onHide();
    } catch (err) {
      alert(err?.data?.error || 'Failed to assign course');
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title className="fs-6 fw-bold">Assign Course - {batch?.batchName}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="py-4">
        {isLoadingBatchCourse ? (
          <Spinner animation="border" size="sm" />
        ) : (
          <>
            <div className="mb-4 bg-light p-3 rounded border">
              <div className="extra-small text-muted text-uppercase fw-bold mb-1">Current Assignment</div>
              {batchCourseData?.batchCourse ? (
                <div>
                  <div className="fw-bold">{batchCourseData.batchCourse.courseId?.title || batchCourseData.batchCourse.courseId?.batchName}</div>
                  <Badge bg={batchCourseData.source === 'auto' ? 'info' : 'success'}>
                    {batchCourseData.source === 'auto' ? 'Auto-mapped' : 'Manually assigned'}
                  </Badge>
                </div>
              ) : (
                <div className="text-muted small">No course currently assigned</div>
              )}
            </div>

            <Form.Group>
              <Form.Label className="small fw-bold">Select New Course</Form.Label>
              <Form.Select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)}>
                <option value="">-- Choose Course --</option>
                {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
              </Form.Select>
              <Form.Text className="text-muted extra-small">
                Manually assigning a course will override the auto-mapping based on instrument/level.
              </Form.Text>
            </Form.Group>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="light" onClick={onHide}>Close</Button>
        <Button variant="primary" onClick={handleAssign} disabled={isAssigning || !selectedCourseId} className="px-4">
          {isAssigning ? <Spinner size="sm" /> : 'Assign Course'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
