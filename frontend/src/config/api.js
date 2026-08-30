// VizhaBook Production API & WebSockets Configuration
// Centralized configuration for local dev and Render Cloud Deployment

const getEnvUrl = (key, fallback) => {
    const url = import.meta.env[key] || fallback;
    return url.endsWith('/') ? url.slice(0, -1) : url;
};

export const API_BASE_URL = getEnvUrl('VITE_API_BASE_URL', 'https://vizhabooks-backend.onrender.com');
export const SOCKET_URL = getEnvUrl('VITE_SOCKET_URL', 'https://vizhabooks-backend.onrender.com');

console.log(`🌐 [VizhaBook Config] API Base URL: ${API_BASE_URL}`);
console.log(`⚡ [VizhaBook Config] Socket URL: ${SOCKET_URL}`);

export default {
    API_BASE_URL,
    SOCKET_URL
};
