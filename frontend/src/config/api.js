// VizhaBook Production API & WebSockets Configuration
// Centralized configuration for local dev and Render Cloud Deployment

const getEnvUrl = (key, fallback) => {
    const envVal = import.meta.env[key];
    if (envVal) {
        return envVal.endsWith('/') ? envVal.slice(0, -1) : envVal;
    }
    
    // Auto-detect local development environment (backend runs on port 5002 in backend/.env)
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        return 'http://localhost:5002';
    }

    return fallback.endsWith('/') ? fallback.slice(0, -1) : fallback;
};

export const API_BASE_URL = getEnvUrl('VITE_API_BASE_URL', 'https://vizhabooks-backend.onrender.com');
export const SOCKET_URL = getEnvUrl('VITE_SOCKET_URL', 'https://vizhabooks-backend.onrender.com');

console.log(`🌐 [VizhaBook Config] API Base URL: ${API_BASE_URL}`);
console.log(`⚡ [VizhaBook Config] Socket URL: ${SOCKET_URL}`);

export default {
    API_BASE_URL,
    SOCKET_URL
};
