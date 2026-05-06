import axios from 'axios';

// In production (Vercel) use the Render backend URL via env var
// In development use the proxy in package.json (/api → localhost:5000)
const baseURL = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/api`
  : '/api';

const API = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach session token to every request automatically
API.interceptors.request.use(config => {
  const token = localStorage.getItem('session_token');
  if (token) config.headers['X-Session-Token'] = token;
  return config;
});

// ── Auth ──────────────────────────────────────────────
export const signUp  = (data) => API.post('/auth/signup', data);
export const signIn  = (data) => API.post('/auth/signin', data);
export const signOut = ()     => API.post('/auth/signout');
export const getMe   = ()     => API.get('/auth/me');

// ── Modules ───────────────────────────────────────────
export const getModules = ()   => API.get('/modules/');
export const getModule  = (id) => API.get(`/modules/${id}`);

// ── Challenges ────────────────────────────────────────
export const getChallenges     = ()     => API.get('/challenges/');
export const getChallenge      = (id)   => API.get(`/challenges/${id}`);
export const submitChallenge   = (data) => API.post('/challenges/submit', data);

// ── AI Review ─────────────────────────────────────────
export const analyzeCode = (code, language) =>
  API.post('/ai-review/analyze', { code, language });

// ── Progress ──────────────────────────────────────────
export const getProgressSummary    = ()     => API.get('/progress/summary');
export const recordSectionView     = (data) => API.post('/progress/section',   data);
export const recordQuizResult      = (data) => API.post('/progress/quiz',       data);
export const recordChallengeResult = (data) => API.post('/progress/challenge',  data);
