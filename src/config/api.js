// Central API base URL — automatically uses Render in production (mobile/APK)
// and localhost proxy in development
export const API_BASE = import.meta.env.VITE_API_URL || 'https://pdd-8u6r.onrender.com';
