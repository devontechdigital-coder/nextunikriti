import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api/admin';

async function testTimetable() {
  console.log('--- Starting Timetable API Tests ---');

  // Let's get schools and teachers to create a temp batch
  const schoolsRes = await fetch(`${BASE_URL}/schools`);
  const schoolsData = await schoolsRes.json();
  const schoolId = schoolsData.schools && schoolsData.schools[0] ? schoolsData.schools[0]._id : null;

  const usersRes = await fetch(`${BASE_URL}/users?role=instructor`);
  const usersData = await usersRes.json();
  const teacherId = usersData.users && usersData.users[0] ? usersData.users[0]._id : null;

  if (!schoolId || !teacherId) {
    console.log('Cannot run test: Missing school or instructor in DB.');
    return;
  }

  // Create a Temp Batch A
  const batchARes = await fetch(`${BASE_URL}/batches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      batchName: 'Test Timetable Batch A',
      schoolId,
      programType: 'in_school',
      instrument: 'Drums',
      level: 'Foundation',
      teacherId,
      maxStrength: 10,
      status: 'active'
    })
  });
  const tempBatchA = (await batchARes.json()).batch;

  if (!tempBatchA) {
    console.log('Failed to create Temp Batch A for testing.');
    return;
  }

  let createdEntryA = null;

  try {
      // 2. Create an exact timetable entry for Batch A
      console.log('\n--- Test 1: Create Valid Entry ---');
      const createRes = await fetch(`${BASE_URL}/timetable`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              batchId: tempBatchA._id,
              dayOfWeek: 'Monday',
              startTime: '10:00',
              endTime: '11:00',
              roomName: 'Music Room A',
              status: 'active'
          })
      });
      const createData = await createRes.json();
      console.log('Create Response:', createData.error || 'Success');
      
      if (createData.success && createData.timetable) {
          createdEntryA = createData.timetable;
          console.log('✅ Valid entry created successfully.');
      } else {
          console.log('❌ Failed to create valid entry.');
          return; // Stop if we can't create base entry
      }

      // 3. Try to create an overlapping entry for same teacher
      console.log('\n--- Test 2: Teacher Overlap Conflict ---');
      const overlapRes = await fetch(`${BASE_URL}/timetable`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              batchId: tempBatchA._id,
              dayOfWeek: 'Monday',
              startTime: '10:30', 
              endTime: '11:30',
              roomName: 'Music Room B'
          })
      });
      const overlapData = await overlapRes.json();
      console.log('Overlap Response:', overlapData.error || 'Success');
      
      if (overlapRes.status === 409 && overlapData.error.includes('Teacher is already booked')) {
          console.log('✅ Teacher overlap correctly prevented!');
      } else {
          console.log('❌ Overlap was NOT prevented as expected.');
      }

  } catch (err) {
      console.error('Test Execution Error:', err);
  } finally {
      // Cleanup
      if (createdEntryA) {
          console.log('\n--- Cleanup: Deleting Timetable Entry ---');
          await fetch(`${BASE_URL}/timetable/${createdEntryA._id}`, { method: 'DELETE' });
      }
      if (tempBatchA) {
          console.log('--- Cleanup: Deleting Temp Batch ---');
          await fetch(`${BASE_URL}/batches/${tempBatchA._id}`, { method: 'DELETE' });
      }
  }
}

testTimetable().then(() => console.log('\nTests Finished.'));
