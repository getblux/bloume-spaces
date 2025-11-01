export const API_BASE = 
  process.env.NODE_ENV === 'production' 
    ? 'https://bloume-backend.onrender.com'
    : 'http://localhost:3000';