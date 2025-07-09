import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "../css/modulo_usuario/recuperacion.css";
//Este componente React permite a un usuario actualizar su asignación de usuario y correo electrónico. Utiliza el hook useState para gestionar los estados de éxito, error, y el envío de datos. Además, emplea el hook useNavigate de react-router-dom para redirigir a otras vistas. 
// El formulario envía los datos del correo y usuario asignado a la API para su actualización, y en caso de éxito, registra la actividad del usuario en el historial.
export default function ActualizarUsuario() {
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!window.confirm('¿Está seguro de guardar los cambios?')) {
            return;
        }
        try {
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            
            const response = await fetch('/api/usuario/actualizar-usuario', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: data.correo,
                    usuario_asignado: data.usuario_asignado
                })
            });

            const result = await response.json();
            
            if (result.success) {
                await fetch('/api/historial-actividades', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        descripcion: `El usuario actualizó un nuevo usuario`
                    })
                });
                setSuccess(true);
                setTimeout(() => navigate('/login'), 2000);
            } else {
                setError(result.message || 'Error al actualizar el usuario');
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
        }
    };

    return (
        <div className="recuperacion-container">
            <h2>Actualizar Usuario Asignado</h2>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">¡Usuario actualizado correctamente! Redirigiendo...</div>}

            <form onSubmit={handleSubmit}>
                <label>Correo electrónico registrado:</label>
                <input type="email" name="correo" required />

                <label>Nuevo usuario asignado:</label>
                <input type="text" name="usuario_asignado" required />

                <button type="submit">Actualizar usuario</button>
            </form>
            <a href="/">Volver al inicio</a>
        </div>
    );
} 