// Configuración centralizada para conexión directa con FastAPI
const USE_MOCK_DATA = false;
const API_BASE_URL = 'http://127.0.0.1:8000/auth';

// Helper para obtener el encabezado de autorización
function getAuthHeaders() {
    const token = localStorage.getItem('token_sesion');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}