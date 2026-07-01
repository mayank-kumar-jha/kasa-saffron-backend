import axios from 'axios';

async function testLiveAPI() {
  const api = axios.create({
    baseURL: 'https://kasa-saffron-backend.vercel.app/api/v1',
    withCredentials: true,
  });

  try {
    // 1. Login to get cookie
    const loginRes = await api.post('/auth/login', {
      email: 'yash91597p@gmail.com', // Let's try to login as this user or a known admin?
      password: 'testPassword123' // I don't know the password...
    });
    
  } catch (err) {
    console.error(err.response?.data || err.message);
  }
}
testLiveAPI();
