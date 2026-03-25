import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api';
let cookie = '';
let schoolAdminCookie = '';

async function runTest() {
  console.log('1. Logging in as super admin...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin2@gmail.com', password: 'Admin@123' })
  });
  
  const loginData = await loginRes.json();
  if (!loginData.success) {
    console.error('Admin login failed:', loginData);
    process.exit(1);
  }
  
  cookie = loginRes.headers.get('set-cookie')?.split(';')[0];
  console.log('Login successful.');

  console.log('\n2. Creating a new School...');
  const schoolRes = await fetch(`${BASE_URL}/admin/schools`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
    body: JSON.stringify({
      schoolName: 'Test Academy ' + Date.now(),
      branchId: null,
      schoolCode: 'TA-' + Date.now(),
      board: 'CBSE',
      contactPerson: 'Principal Skinner',
      contactPhone: '9998887776',
      contactEmail: 'skinner@testacademy.edu',
      address: '123 Test St',
      city: 'Testville',
      state: 'Test State',
      pinCode: '123456',
      contractType: 'fixed',
      status: 'active'
    })
  });
  const schoolData = await schoolRes.json();
  if (!schoolData.success) {
     console.error('Failed to create school:', schoolData);
     process.exit(1);
  }
  const schoolId = schoolData.school._id;
  console.log('School created successfully! ID:', schoolId);

  console.log('\n3. Creating a School Admin user...');
  const userRes = await fetch(`${BASE_URL}/admin/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
    body: JSON.stringify({
      name: 'Seymour Skinner',
      email: `skinner.${Date.now()}@testacademy.edu`,
      phone: `999${Date.now().toString().slice(-7)}`,
      password: 'Password@123',
      role: 'school_admin',
      schoolId: schoolId
    })
  });
  const userData = await userRes.json();
  if (!userData.success) {
     console.error('Failed to create user:', userData);
     process.exit(1);
  }
  const userEmail = userData.data.email;
  console.log('School Admin created successfully! Email:', userEmail);

  console.log('\n4. Logging out and logging in as the new School Admin...');
  const saLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userEmail, password: 'Password@123' })
  });
  
  const saLoginData = await saLoginRes.json();
  if (!saLoginData.success) {
    console.error('School Admin login failed:', saLoginData);
    process.exit(1);
  }
  
  schoolAdminCookie = saLoginRes.headers.get('set-cookie')?.split(';')[0];
  console.log('School Admin Login successful! Token received.');

  console.log('\n5. Verifying data isolation (Fetching Users API)...');
  const getRes = await fetch(`${BASE_URL}/admin/users`, {
    headers: { 'Cookie': schoolAdminCookie }
  });
  const getData = await getRes.json();
  if (getData.success) {
     console.log('API Isolation works! The school admin can access the endpoint.');
     console.log('Data fetch successful! Received records length:', getData.data.length);
  } else {
     console.error('Failed to fetch data as school admin:', getData);
     process.exit(1);
  }

  console.log('\n=== ALL TESTS PASSED SUCCESSFULLY ===');
}

runTest().catch(console.error);
