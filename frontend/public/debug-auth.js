// Debug script to check authentication state
console.log('=== Debug Authentication ===');
console.log('Token from localStorage:', localStorage.getItem('token'));
console.log('User from localStorage:', localStorage.getItem('user'));

// Test if we can parse the token
const token = localStorage.getItem('token');
if (token) {
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      console.log('Token payload:', payload);
      console.log('Token expires:', new Date(payload.exp * 1000));
      console.log('Is token expired?', payload.exp * 1000 < Date.now());
    }
  } catch (error) {
    console.log('Error parsing token:', error);
  }
} else {
  console.log('No token found - user needs to login');
}

// Test API call manually
fetch('http://localhost:5001/api/auth/profile', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('Profile API response status:', response.status);
  return response.json();
})
.then(data => console.log('Profile API data:', data))
.catch(error => console.log('Profile API error:', error));