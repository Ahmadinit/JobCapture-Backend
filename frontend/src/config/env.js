// Production builds default to the deployed backend; `npm run dev` uses .env.development (local backend).
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://job-capture-backend.vercel.app';
