// Cliente API sincronizado con las llaves del backend (correo, password)
const API = {
    async login(correo, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correo, password })
            });

            const data = await response.json();

            if (!response.ok) {
                // Captura el error HTTP 401 lanzado por FastAPI (detail: "Correo o contraseña incorrectos")
                return { 
                    estado: "error", 
                    detail: data.detail || "Error de autenticación" 
                };
            }

            return data;

        } catch (error) {
            console.error("Error al conectar con la API:", error);
            return { 
                estado: "error", 
                detail: "No se pudo conectar con el servidor Uvicorn/FastAPI" 
            };
        }
    }
};