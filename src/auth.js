const BASE_URL = 'https://prakalp-backend-e246.onrender.com/api';

export async function loginStudent(email, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return await res.json();
}

export function getUser() {
  return JSON.parse(localStorage.getItem('user') || 'null');
}

export function logoutStudent() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}