const BASE_URL = 'https://prakalp-backend-e246.onrender.com/api';

export async function loginStudent(email, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (data.token) {
    localStorage.setItem('prakalp_token', data.token);
    localStorage.setItem('prakalp_student', JSON.stringify(data.student));
  }
  return data;
}

export function getUser() {
  return JSON.parse(localStorage.getItem('prakalp_student') || 'null');
}

export function logoutStudent() {
  localStorage.removeItem('prakalp_token');
  localStorage.removeItem('prakalp_student');
}