import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "../css/modulo_usuario/recuperacion.css";
// Permite a los usuarios recuperar su nombre de usuario asignado a través de su correo electrónico registrado. 
// El formulario solicita un correo electrónico y un nuevo nombre de usuario, y luego realiza una solicitud a una API para actualizar la información en el servidor.
export default function RecuperarUsuario() {
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            
            const response = await fetch('/api/usuario/recuperar-usuario', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: data.correo,
                    usuario_asignado: data.nuevo_usuario
                })
            });

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                throw new Error(`Respuesta inesperada del servidor: ${text}`);
            }

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'Error en la respuesta del servidor');
            }

            if (result.success) {
                setSuccess(true);
                setTimeout(() => navigate('/login'), 2000);
            } else {
                setError(result.message || 'Error al actualizar el usuario');
            }
        } catch (err) {
            console.error("Error detallado:", err);
            setError(err.message || 'Error de conexión con el servidor');
        }
    };

    return (
        <div className="recuperacion-container">
            <h2>Recuperar Usuario</h2>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">¡Usuario actualizado correctamente! Redirigiendo...</div>}

            <form onSubmit={handleSubmit}>
                <label>Correo electrónico registrado:</label>
                <input type="email" name="correo" required />

                <label>Nuevo usuario:</label>
                <input type="text" name="nuevo_usuario" required />

                <button type="submit">Actualizar usuario</button>
            </form>
            <a href="/">Volver al inicio</a>
        </div>
    );
}