async function testLogin() {
  const res = await fetch('http://localhost:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin', password: 'admin' })
  });
  const data = await res.json();
  console.log('Status:', res.status);
  console.log('Response:', data);
}

testLogin();
