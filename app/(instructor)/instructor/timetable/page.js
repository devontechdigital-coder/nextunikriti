'use client';

import { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { Container, Card, Badge, Spinner, Alert } from 'react-bootstrap';
import { FaClock, FaChalkboardTeacher, FaBuilding } from 'react-icons/fa';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function InstructorTimetablePage() {
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTimetables = async () => {
    try {
      const res = await axios.get('/api/instructor/timetable');
      if (res.data.success) {
        setTimetables(res.data.timetables || []);
      }
    } catch (err) {
      setError('Failed to load timetable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetables();
  }, []);

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
      const columns = [];
      
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
      const minHour = 8;
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

  if (loading) return <Container className="py-5 text-center"><Spinner animation="border" variant="primary" /></Container>;

  return (
    <Container fluid className="py-4">
      <div className="mb-4">
        <h2 className="fw-bold mb-0 text-dark">My Timetable</h2>
        <p className="text-muted">View your upcoming classes and weekly schedule.</p>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <div className="table-responsive rounded shadow-sm border overflow-hidden bg-white pe-3" style={{ minHeight: '600px' }}>
        <div className="d-flex h-100">
           {/* Time Gutter */}
           <div className="border-end bg-light text-muted small text-end pe-2 position-relative" style={{ width: '60px', flexShrink: 0 }}>
             <div style={{ height: '40px' }} className="border-bottom"></div>
             {getTimelineScale().map((time, idx) => (
                <div key={time} style={{ height: '60px', position: 'relative' }}>
                  <span style={{ position: 'absolute', top: '-10px', right: '5px' }}>{time}</span>
                </div>
             ))}
           </div>

           {/* Days Columns */}
           {DAYS_OF_WEEK.map(day => (
               <div key={day} className="flex-grow-1 border-end position-relative" style={{ minWidth: '150px' }}>
                <div 
                  className="text-center fw-bold py-2 bg-light border-bottom text-primary shadow-sm" 
                  style={{ height: '40px' }}
                >
                  {day}
                </div>
                <div className="position-relative w-100" style={{ height: '720px', backgroundColor: '#fafafa' }}>
                   {/* Time grid lines */}
                   {getTimelineScale().map((_, idx) => (
                       <div key={idx} className="border-bottom w-100 position-absolute border-light" style={{ height: '60px', top: `${idx * (100/12)}%`, zIndex: 1 }}></div>
                   ))}

                   {/* Entry Blocks */}
                   {groupTimetablesByDay[day].map((item, idx) => (
                      <div 
                        key={`${item._id}-${idx}`} 
                        className={`position-absolute shadow-sm border-start border-4 ${item.status === 'active' ? 'border-primary' : 'border-secondary'} rounded-1 p-2`}
                        style={{ 
                          top: calculateTopPosition(item.startTime), 
                          height: calculateHeight(item.startTime, item.endTime),
                          zIndex: 10,
                          left: `${(item.colIdx * (100 / item.totalCols))}%`,
                          width: `${(100 / item.totalCols)}%`,
                          backgroundColor: item.status === 'active' ? '#e7f1ff' : '#f8f9fa',
                          color: '#084298',
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                          fontSize: '0.75rem'
                        }}
                      >
                         <div className="fw-bold mb-1 text-truncate">{item.batchId?.batchName}</div>
                         <div className="d-flex align-items-center opacity-75 mb-1 text-truncate">
                            <FaClock className="me-1" /> {item.startTime} - {item.endTime}
                         </div>
                         {item.roomName && (
                            <div className="d-flex align-items-center opacity-75 text-truncate">
                               <FaBuilding className="me-1" /> {item.roomName}
                            </div>
                         )}
                      </div>
                   ))}
                </div>
             </div>
           ))}
        </div>
      </div>
    </Container>
  );
}
