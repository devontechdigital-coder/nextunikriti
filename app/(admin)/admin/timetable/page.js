'use client';

import { useState, useMemo, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Container, Row, Col, Card, Form, Button, Modal, Badge, Spinner, Alert } from 'react-bootstrap';
import { 
  useGetAdminTimetablesQuery, 
  useCreateAdminTimetableMutation, 
  useUpdateAdminTimetableMutation, 
  useDeleteAdminTimetableMutation,
  useGetAdminBatchesQuery,
  useGetAdminSchoolsQuery,
  useGetAdminInstructorsQuery
} from '@/redux/api/apiSlice';
import { FaPlus, FaEdit, FaTrash, FaCheckCircle, FaExclamationTriangle, FaClock, FaChalkboardTeacher, FaBuilding } from 'react-icons/fa';
import { useSelector } from 'react-redux';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function TimetablePage() {
  const [filters, setFilters] = useState({ schoolId: '', teacherId: '', batchId: '' });
  const [view, setView] = useState('calendar'); // 'calendar' or 'list'
  
  const { 
    data: timetablesData, 
    isLoading: isLoadingTimetables, 
    isError: isErrorTimetables, 
    error: timetablesError, 
    refetch 
  } = useGetAdminTimetablesQuery(
    Object.keys(filters).reduce((acc, key) => {
      if (filters[key]) acc[key] = filters[key];
      return acc;
    }, {})
  );
  
  const pathname = usePathname();
  const isSchoolAdminPath = pathname.startsWith('/school');
  
  const { user } = useSelector((state) => state.auth);
  const isSchoolAdmin = user?.role === 'school_admin' || isSchoolAdminPath;
  const schoolId = user?.schoolId || user?._id;

  // Initialize school filter for school admins
  useEffect(() => {
    if (isSchoolAdmin && schoolId && !filters.schoolId) {
      setFilters(prev => ({ ...prev, schoolId }));
    }
  }, [isSchoolAdmin, schoolId, filters.schoolId]);

  const { data: batchesData } = useGetAdminBatchesQuery(isSchoolAdmin ? { schoolId } : {});
  const { data: schoolsData } = useGetAdminSchoolsQuery();
  const { data: teachersData } = useGetAdminInstructorsQuery({ limit: 100 });

  const [createTimetable, { isLoading: isCreating }] = useCreateAdminTimetableMutation();
  const [updateTimetable, { isLoading: isUpdating }] = useUpdateAdminTimetableMutation();
  const [deleteTimetable, { isLoading: isDeleting }] = useDeleteAdminTimetableMutation();

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [entryToDelete, setEntryToDelete] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [showDayModal, setShowDayModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);

  const [formData, setFormData] = useState({
    batchId: '', schedules: [{ dayOfWeek: 'Monday', startTime: '', endTime: '' }], roomName: '', status: 'active'
  });

  const timetables = timetablesData?.timetables || [];
  const batches = batchesData?.batches || [];
  const schools = schoolsData?.schools || [];
  const teachers = teachersData?.data || [];

  const handleOpenModal = (entry = null) => {
    setErrorMsg('');
    if (entry) {
      setEditingEntry(entry);
      setFormData({
        batchId: entry.batchId?._id || '',
        schedules: entry.schedules.map(s => ({
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime
        })),
        roomName: entry.roomName || '',
        status: entry.status || 'active'
      });
    } else {
      setEditingEntry(null);
      setFormData({
        batchId: '', 
        schedules: [{ dayOfWeek: 'Monday', startTime: '', endTime: '' }], 
        roomName: '', 
        status: 'active'
      });
    }
    setShowModal(true);
  };

  const handleAddScheduleRow = () => {
    setFormData({
      ...formData,
      schedules: [...formData.schedules, { dayOfWeek: 'Monday', startTime: '', endTime: '' }]
    });
  };

  const handleRemoveScheduleRow = (index) => {
    const newSchedules = [...formData.schedules];
    newSchedules.splice(index, 1);
    setFormData({ ...formData, schedules: newSchedules });
  };

  const handleScheduleChange = (index, field, value) => {
    const newSchedules = [...formData.schedules];
    newSchedules[index][field] = value;
    setFormData({ ...formData, schedules: newSchedules });
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    try {
      if (editingEntry) {
        await updateTimetable({ id: editingEntry._id, ...formData }).unwrap();
        setSuccessMsg('Timetable entry updated successfully!');
      } else {
        await createTimetable(formData).unwrap();
        setSuccessMsg('Timetable entry created successfully!');
      }
      setShowModal(false);
      setTimeout(() => setSuccessMsg(''), 3000);
      refetch();
    } catch (err) {
      setErrorMsg(err?.data?.error || 'An error occurred while saving the entry.');
    }
  };

  const handleDelete = async () => {
    try {
        await deleteTimetable(entryToDelete._id).unwrap();
        setSuccessMsg('Timetable entry deleted successfully!');
        setShowDeleteModal(false);
        setTimeout(() => setSuccessMsg(''), 3000);
        refetch();
    } catch (err) {
        alert(err?.data?.error || 'Failed to delete entry');
    }
  };

  const groupTimetablesByDay = useMemo(() => {
    const grouped = {};
    DAYS_OF_WEEK.forEach(day => { grouped[day] = []; });
    
    // 1. Flatten into slots
    timetables.forEach(entry => {
      if (entry.schedules && Array.isArray(entry.schedules)) {
        entry.schedules.forEach(slot => {
          grouped[slot.dayOfWeek].push({
            ...entry,
            startTime: slot.startTime,
            endTime: slot.endTime,
            currentSlot: slot
          });
        });
      }
    });

    // 2. Process overlaps for each day
    Object.keys(grouped).forEach(day => {
      const dayItems = grouped[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
      const columns = []; // Array of arrays (each representing a column)
      
      dayItems.forEach(item => {
        let placed = false;
        for (let c = 0; c < columns.length; c++) {
          const lastInCol = columns[c][columns[c].length - 1];
          if (item.startTime >= lastInCol.endTime) {
            columns[c].push(item);
            item.colIdx = c;
            placed = true;
            break;
          }
        }
        if (!placed) {
          item.colIdx = columns.length;
          columns.push([item]);
        }
      });

      // Assign totalCols based on contiguous clusters
      let currentCluster = [];
      let maxEndTimeInCluster = "00:00";
      dayItems.forEach((item, idx) => {
        if (item.startTime >= maxEndTimeInCluster && currentCluster.length > 0) {
          const clusterTotalCols = Math.max(...currentCluster.map(ci => ci.colIdx)) + 1;
          currentCluster.forEach(ci => ci.totalCols = clusterTotalCols);
          currentCluster = [item];
          maxEndTimeInCluster = item.endTime;
        } else {
          currentCluster.push(item);
          if (item.endTime > maxEndTimeInCluster) maxEndTimeInCluster = item.endTime;
        }
        if (idx === dayItems.length - 1) {
          const clusterTotalCols = Math.max(...currentCluster.map(ci => ci.colIdx)) + 1;
          currentCluster.forEach(ci => ci.totalCols = clusterTotalCols);
        }
      });
    });
    
    return grouped;
  }, [timetables]);

  const getTimelineScale = () => {
    const hours = [];
    for(let i=8; i<=20; i++) {
       hours.push(`${i.toString().padStart(2, '0')}:00`);
    }
    return hours;
  };

  const calculateTopPosition = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const minHour = 8; // Starting at 8 AM
      const totalMinutes = ((hours - minHour) * 60) + minutes;
      return `${(totalMinutes / (12 * 60)) * 100}%`;
  };

  const calculateHeight = (startStr, endStr) => {
      const [startH, startM] = startStr.split(':').map(Number);
      const [endH, endM] = endStr.split(':').map(Number);
      const startMins = (startH * 60) + startM;
      const endMins = (endH * 60) + endM;
      const durMins = endMins - startMins;
      return `${(durMins / (12 * 60)) * 100}%`;
  };

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0 text-dark">Timetable Management</h2>
          <p className="text-muted">Manage weekly class schedules, teachers, and rooms.</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <div className="btn-group me-3 shadow-sm rounded-pill overflow-hidden" style={{ border: '1px solid #dee2e6' }}>
            <Button 
              variant={view === 'calendar' ? 'primary' : 'white'} 
              size="sm" 
              className="px-3"
              onClick={() => setView('calendar')}
            >
              Calendar
            </Button>
            <Button 
              variant={view === 'list' ? 'primary' : 'white'} 
              size="sm" 
              className="px-3"
              onClick={() => setView('list')}
            >
              List View
            </Button>
          </div>
          <Button variant="primary" className="d-flex align-items-center gap-2 px-4 shadow-sm" onClick={() => handleOpenModal()}>
            <FaPlus /> Add Entry
          </Button>
        </div>
      </div>

      {successMsg && (
        <Alert variant="success" className="d-flex align-items-center gap-2 shadow-sm border-0 mb-4">
          <FaCheckCircle /> {successMsg}
        </Alert>
      )}

      {timetablesData?.error && (
        <Alert variant="danger" className="mb-4 shadow-sm border-0">
          <FaExclamationTriangle className="me-2" />
          <strong>API Error:</strong> {timetablesData.error}
        </Alert>
      )}

      {/* Filters */}
      <Card className="shadow-sm border-0 mb-4 bg-light">
        <Card.Body>
          <Row className="g-3">
            {!isSchoolAdminPath && (
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-muted mb-1">Filter by School</Form.Label>
                  <Form.Select 
                    value={filters.schoolId} 
                    onChange={(e) => setFilters({...filters, schoolId: e.target.value})}
                  >
                    <option value="">All Schools</option>
                    {schools.map(s => <option key={s._id} value={s._id}>{s.schoolName}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
            )}
            <Col md={isSchoolAdminPath ? 4 : 3}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted mb-1">Filter by Teacher</Form.Label>
                <Form.Select 
                  value={filters.teacherId} 
                  onChange={(e) => setFilters({...filters, teacherId: e.target.value})}
                >
                  <option value="">All Teachers</option>
                  {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted mb-1">Filter by Batch</Form.Label>
                <Form.Select 
                  value={filters.batchId} 
                  onChange={(e) => setFilters({...filters, batchId: e.target.value})}
                >
                  <option value="">All Batches</option>
                  {batches.map(b => <option key={b._id} value={b._id}>{b.batchName}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={isSchoolAdminPath ? 4 : 3} className="d-flex align-items-end">
               <Button variant="outline-secondary" onClick={() => setFilters({ schoolId: isSchoolAdmin ? schoolId : '', teacherId: '', batchId: '' })} className="w-100">
                  Clear Filters
               </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Weekly View */}
      {isLoadingTimetables ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2 text-muted fw-bold">Loading timetable...</p>
        </div>
      ) : view === 'calendar' ? (
        <div className="table-responsive rounded shadow-sm border overflow-hidden bg-white pe-3" style={{ minHeight: '600px' }}>
          <div className="d-flex h-100">
             {/* Time Gutter */}
             <div className="border-end bg-light text-muted small text-end pe-2 position-relative" style={{ width: '60px', flexShrink: 0 }}>
               <div style={{ height: '40px' }} className="border-bottom"></div>
               {getTimelineScale().map((time, idx) => (
                  <div key={time} style={{ height: '50px', position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '-10px', right: '5px' }}>{time}</span>
                  </div>
               ))}
             </div>

             {/* Days Columns */}
             {DAYS_OF_WEEK.map(day => (
                 <div key={day} className="flex-grow-1 border-end position-relative" style={{ minWidth: '150px' }}>
                  <div 
                    className="text-center fw-bold py-2 bg-light border-bottom text-primary shadow-sm hover-overlay" 
                    style={{ height: '40px', cursor: 'pointer' }}
                    onClick={() => { setSelectedDay(day); setShowDayModal(true); }}
                  >
                    {day}
                  </div>
                  <div className="position-relative w-100" style={{ height: '600px', backgroundColor: '#fafafa' }}>
                     {/* Time grid lines */}
                     {getTimelineScale().map((_, idx) => (
                         <div key={idx} className="border-bottom w-100 position-absolute border-light" style={{ height: '50px', top: `${idx * (100/12)}%`, zIndex: 1 }}></div>
                     ))}

                     {/* Entry Blocks (Compact) */}
                     {groupTimetablesByDay[day].slice(0, 5).map((item, idx) => (
                        <div 
                          key={`${item._id}-${idx}`} 
                          className="position-absolute shadow-sm border-start border-4 border-primary rounded-1"
                          style={{ 
                            top: calculateTopPosition(item.startTime), 
                            height: calculateHeight(item.startTime, item.endTime),
                            zIndex: 10,
                            left: `${(item.colIdx * (100 / item.totalCols))}%`,
                            width: `${(100 / item.totalCols)}%`,
                            fontSize: '0.65rem',
                            cursor: 'pointer',
                            backgroundColor: '#e7f1ff',
                            color: '#084298',
                            padding: '2px 4px',
                            overflow: 'hidden',
                            transition: 'all 0.1s ease',
                            display: 'flex',
                            flexDirection: 'column'
                          }}
                          onClick={() => { setSelectedEntry(item); setShowDetailModal(true); }}
                        >
                           <div className="fw-bold text-truncate">{item.batchId?.batchName}</div>
                           <div className="extra-small opacity-75">{item.startTime}</div>
                        </div>
                     ))}
                     
                     {groupTimetablesByDay[day].length > 5 && (
                        <div 
                          className="position-absolute w-100 text-center bg-primary text-white py-1 extra-small fw-bold" 
                          style={{ bottom: 0, zIndex: 20, cursor: 'pointer', opacity: 0.9 }}
                          onClick={() => { setSelectedDay(day); setShowDayModal(true); }}
                        >
                           + {groupTimetablesByDay[day].length - 5} more entries
                        </div>
                     )}
                  </div>
               </div>
             ))}
          </div>
        </div>
      ) : (
        <Card className="shadow-sm border-0 overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light text-secondary text-uppercase extra-small fw-bold">
                <tr>
                  <th className="ps-4">Batch</th>
                  {!isSchoolAdminPath && <th>School</th>}
                  <th>Instructor</th>
                  <th>Schedule Slots</th>
                  <th>Room</th>
                  <th>Status</th>
                  <th className="text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {timetables.map((entry) => (
                  <tr key={entry._id}>
                    <td className="ps-4">
                      <div className="fw-bold text-dark">{entry.batchId?.batchName || 'N/A'}</div>
                      <div className="text-muted extra-small">{entry.batchId?.instrument} • {entry.batchId?.level}</div>
                    </td>
                    {!isSchoolAdminPath && (
                      <td><Badge bg="light" text="dark" className="border">{entry.schoolId?.schoolName || 'N/A'}</Badge></td>
                    )}
                    <td>
                      <div className="small">{entry.teacherId?.name || 'N/A'}</div>
                    </td>
                    <td>
                      <div className="d-flex flex-wrap gap-1">
                        {entry.schedules && Array.isArray(entry.schedules) ? (
                          entry.schedules.map((slot, sIdx) => (
                            <Badge key={sIdx} bg="info" className="bg-opacity-10 text-info border border-info border-opacity-25 fw-normal">
                               {slot.dayOfWeek?.substring(0, 3)}: {slot.startTime}-{slot.endTime}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted small">No slots</span>
                        )}
                      </div>
                    </td>
                    <td><span className="small text-muted">{entry.roomName || '-'}</span></td>
                    <td>
                      <Badge bg={entry.status === 'active' ? 'success' : 'secondary'} className="rounded-pill px-3">
                        {entry.status}
                      </Badge>
                    </td>
                    <td className="text-end pe-4">
                      <div className="d-flex justify-content-end gap-2">
                        <Button variant="light" size="sm" className="rounded-circle" onClick={() => handleOpenModal(entry)}>
                          <FaEdit className="text-primary" />
                        </Button>
                        <Button variant="light" size="sm" className="rounded-circle" onClick={() => { setEntryToDelete(entry); setShowDeleteModal(true); }}>
                          <FaTrash className="text-danger" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {timetables.length === 0 && (
                  <tr>
                    <td colSpan={isSchoolAdminPath ? 6 : 7} className="text-center py-5 text-muted">No timetable entries found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="fw-bold fs-5 text-primary">
            {editingEntry ? 'Edit Timetable Entry' : 'Create Timetable Entry'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateOrUpdate}>
          <Modal.Body className="p-4">
            {errorMsg && (
              <Alert variant="danger" className="d-flex align-items-center gap-2 small py-2">
                 <FaExclamationTriangle /> {errorMsg}
              </Alert>
            )}

            <Row className="g-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Select Batch <span className="text-danger">*</span></Form.Label>
                  <Form.Select 
                    required 
                    value={formData.batchId} 
                    onChange={(e) => setFormData({...formData, batchId: e.target.value})}
                    disabled={!!editingEntry}
                  >
                    <option value="">-- Select Active Batch --</option>
                    {batches.filter(b => b.status === 'active' || (editingEntry && b._id === formData.batchId)).map(b => (
                       <option key={b._id} value={b._id}>
                         {b.batchName} ({b.programType} - {b.instrument})
                       </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={12}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                   <Form.Label className="small fw-bold mb-0">Schedule Slots <span className="text-danger">*</span></Form.Label>
                   <Button variant="link" size="sm" onClick={handleAddScheduleRow} className="text-primary text-decoration-none p-0 fw-bold">
                     <FaPlus size={10} className="me-1" /> Add Slot
                   </Button>
                </div>
                {formData.schedules.map((slot, index) => (
                  <Card key={index} className="bg-light border-0 mb-2 p-3">
                    <Row className="g-2 align-items-end">
                      <Col md={4}>
                        <Form.Label className="extra-small fw-bold text-muted mb-1">Day of Week</Form.Label>
                        <Form.Select 
                          required 
                          value={slot.dayOfWeek} 
                          onChange={(e) => handleScheduleChange(index, 'dayOfWeek', e.target.value)}
                        >
                          {DAYS_OF_WEEK.map(day => <option key={day} value={day}>{day}</option>)}
                        </Form.Select>
                      </Col>
                      <Col md={3}>
                        <Form.Label className="extra-small fw-bold text-muted mb-1">Start Time</Form.Label>
                        <Form.Control 
                          type="time"
                          required 
                          value={slot.startTime} 
                          onChange={(e) => handleScheduleChange(index, 'startTime', e.target.value)}
                        />
                      </Col>
                      <Col md={3}>
                        <Form.Label className="extra-small fw-bold text-muted mb-1">End Time</Form.Label>
                        <Form.Control 
                          type="time"
                          required 
                          value={slot.endTime} 
                          onChange={(e) => handleScheduleChange(index, 'endTime', e.target.value)}
                        />
                      </Col>
                      <Col md={2} className="text-end">
                        <Button 
                          variant="outline-danger" 
                          size="sm" 
                          onClick={() => handleRemoveScheduleRow(index)}
                          disabled={formData.schedules.length <= 1}
                        >
                          <FaTrash size={12} />
                        </Button>
                      </Col>
                    </Row>
                  </Card>
                ))}
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Room Name (Optional)</Form.Label>
                  <Form.Control 
                    type="text"
                    placeholder="e.g. Room 101, Music Lab A"
                    value={formData.roomName} 
                    onChange={(e) => setFormData({...formData, roomName: e.target.value})}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Status</Form.Label>
                  <Form.Select 
                    value={formData.status} 
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="bg-light border-0">
            <Button variant="link" onClick={() => setShowModal(false)} className="text-secondary text-decoration-none">Cancel</Button>
            <Button variant="primary" type="submit" disabled={isCreating || isUpdating} className="px-4 shadow-sm rounded-pill">
              {isCreating || isUpdating ? <Spinner size="sm" /> : (editingEntry ? 'Update Entry' : 'Create Entry')}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Day View Modal */}
      <Modal show={showDayModal} onHide={() => setShowDayModal(false)} centered size="xl">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title className="fw-bold fs-5">{selectedDay} Schedule</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0 bg-light">
          <div className="d-flex" style={{ height: '700px', overflowY: 'auto' }}>
             {/* Time Gutter */}
             <div className="border-end bg-white text-muted small text-end pe-2 position-relative" style={{ width: '60px', flexShrink: 0 }}>
               <div style={{ height: '40px' }} className="border-bottom"></div>
               {getTimelineScale().map((time, idx) => (
                  <div key={time} style={{ height: '60px', position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '-10px', right: '5px' }}>{time}</span>
                  </div>
               ))}
             </div>
             
             {/* Single Day Column (Zoomed) */}
             <div className="flex-grow-1 position-relative bg-white">
                <div className="position-relative w-100" style={{ height: '720px' }}>
                   {/* Time grid lines */}
                   {getTimelineScale().map((_, idx) => (
                       <div key={idx} className="border-bottom w-100 position-absolute border-light" style={{ height: '60px', top: `${idx * (100/12)}%`, zIndex: 1 }}></div>
                   ))}

                   {/* Entry Blocks (Large) */}
                   {selectedDay && groupTimetablesByDay[selectedDay].map((item, idx) => (
                      <div 
                        key={`${item._id}-${idx}`} 
                        className={`position-absolute shadow border-start border-5 ${item.status === 'active' ? 'border-primary' : 'border-secondary'} rounded-2 p-3`}
                        style={{ 
                          top: calculateTopPosition(item.startTime), 
                          height: calculateHeight(item.startTime, item.endTime),
                          zIndex: 10,
                          left: `${(item.colIdx * (100 / item.totalCols))}%`,
                          width: `${(100 / item.totalCols)}%`,
                          cursor: 'pointer',
                          backgroundColor: item.status === 'active' ? '#f0f7ff' : '#f8f9fa',
                          color: '#084298',
                          overflow: 'hidden',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                        onClick={() => { setSelectedEntry(item); setShowDetailModal(true); }}
                      >
                         <div className="d-flex justify-content-between align-items-start mb-2">
                            <h5 className="fw-bold mb-0 text-truncate">{item.batchId?.batchName}</h5>
                            <Badge bg={item.status === 'active' ? 'primary' : 'secondary'}>{item.status}</Badge>
                         </div>
                         <div className="d-flex flex-wrap gap-3 mb-3">
                            <div className="d-flex align-items-center small mt-1">
                               <FaClock className="me-2 opacity-50" /> {item.startTime} - {item.endTime}
                            </div>
                            <div className="d-flex align-items-center small mt-1">
                               <FaChalkboardTeacher className="me-2 opacity-50" /> {item.teacherId?.name}
                            </div>
                         </div>
                         <div className="mt-auto d-flex gap-2">
                            <Button variant="outline-primary" size="sm" onClick={(e) => { e.stopPropagation(); setShowDayModal(false); handleOpenModal(item); }}>
                               <FaEdit className="me-1" /> Edit
                            </Button>
                            <Button variant="outline-danger" size="sm" onClick={(e) => { e.stopPropagation(); setEntryToDelete(item); setShowDeleteModal(true); }}>
                               <FaTrash className="me-1" /> Delete
                            </Button>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        </Modal.Body>
      </Modal>

      {/* Detail View Modal */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-5 fw-bold">Class Details</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {selectedEntry && (
            <div className="d-flex flex-column gap-3">
              <div className="d-flex align-items-center gap-3 mb-2">
                 <div className="bg-primary bg-opacity-10 p-3 rounded-circle text-primary">
                    <FaChalkboardTeacher size={24} />
                 </div>
                 <div>
                    <h5 className="fw-bold mb-0">{selectedEntry.batchId?.batchName}</h5>
                    <div className="text-muted small">{selectedEntry.batchId?.instrument} • {selectedEntry.batchId?.level}</div>
                 </div>
              </div>
              
              <hr className="my-1" />
              
              <Row className="g-3">
                 <Col xs={6}>
                    <div className="small text-muted mb-1">Instructor</div>
                    <div className="fw-bold d-flex align-items-center"><FaChalkboardTeacher className="me-2 text-primary opacity-50" /> {selectedEntry.teacherId?.name}</div>
                 </Col>
                 <Col xs={6}>
                    <div className="small text-muted mb-1">Time Slot</div>
                    <div className="fw-bold d-flex align-items-center"><FaClock className="me-2 text-primary opacity-50" /> {selectedEntry.startTime} - {selectedEntry.endTime}</div>
                 </Col>
                 <Col xs={6}>
                    <div className="small text-muted mb-1">Room</div>
                    <div className="fw-bold d-flex align-items-center"><FaBuilding className="me-2 text-primary opacity-50" /> {selectedEntry.roomName || 'N/A'}</div>
                 </Col>
                 <Col xs={6}>
                    <div className="small text-muted mb-1">School</div>
                    <div className="fw-bold">{selectedEntry.schoolId?.schoolName}</div>
                 </Col>
              </Row>
              
              <div className="mt-4 d-flex gap-2">
                 <Button variant="primary" className="flex-grow-1" onClick={() => { setShowDetailModal(false); setShowDayModal(false); handleOpenModal(selectedEntry); }}>
                    <FaEdit className="me-2" /> Edit Entry
                 </Button>
                 <Button variant="outline-danger" onClick={() => { setEntryToDelete(selectedEntry); setShowDeleteModal(true); }}>
                    <FaTrash />
                 </Button>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold text-danger">Delete Timetable Entry</Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-4">
          <p className="mb-0">Are you sure you want to delete the entire schedule for <strong>{entryToDelete?.batchId?.batchName}</strong>?</p>
          <small className="text-muted">This will remove all time slots associated with this batch entry.</small>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete} disabled={isDeleting} className="px-4 border-0">
            {isDeleting ? <Spinner size="sm" /> : 'Confirm Delete'}
          </Button>
        </Modal.Footer>
      </Modal>

      <style jsx>{`
         .extra-small { font-size: 0.7rem; }
      `}</style>
    </Container>
  );
}
