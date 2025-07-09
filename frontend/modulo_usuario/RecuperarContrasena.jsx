import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "../css/modulo_usuario/recuperacion.css";
//permite a los usuarios recuperar su contraseña. Los usuarios deben proporcionar su correo electrónico y la nueva contraseña (que debe coincidir con la repetición). Si los datos son correctos, una solicitud a la API actualiza la contraseña del usuario. Si la actualización es exitosa, el usuario es redirigido a la página de inicio de sesión

export default function RecuperarContrasena() {
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            
            if (data.nueva !== data.repetir) {
                setError('Las contraseñas no coinciden');
                setTimeout(() => window.location.reload(), 2000); // recarga tras 2 segundos

                return;
            }
            
            const response = await fetch('/api/usuario/recuperar-contrasena', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: data.correo,
                    nueva_contrasena: data.nueva
                })
            });

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                throw new Error(`Respuesta inesperada: ${text}`);
            }

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'Error en la respuesta del servidor');
            }

            if (result.success) {
                setSuccess(true);
                setTimeout(() => navigate('/login'), 2000);
            } else {
                setError(result.message || 'Error al actualizar la contraseña');
            }
        } catch (err) {
            setError(err.message || 'Error de conexión con el servidor');
        }
    };

    return (
        <div className="recuperacion-container">
            <h2>Recuperar Contraseña</h2>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">¡Contraseña actualizada correctamente! Redirigiendo...</div>}

            <form onSubmit={handleSubmit}>
                <label>Correo electrónico registrado:</label>
                <input type="email" name="correo" required />

                <label>Nueva contraseña:</label>
                <input type="password" name="nueva" required />

                <label>Repetir contraseña:</label>
                <input type="password" name="repetir" required />

                <button type="submit">Actualizar contraseña</button>
            </form>
            <a href="/">Volver al inicio</a>
        </div>
    );
}