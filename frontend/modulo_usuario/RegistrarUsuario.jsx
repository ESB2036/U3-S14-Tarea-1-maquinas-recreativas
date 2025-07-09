import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "../css/modulo_usuario/registrar_usuario.css";
// proporciona un formulario de registro para nuevos usuarios. Los usuarios pueden ingresar su nombre, apellido, cédula, correo electrónico, nombre de usuario asignado, contraseña y el área en la que desean trabajar. Después de completar el formulario, los datos se envían al servidor para registrar al nuevo usuario.
export default function RegistrarUsuario() {
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        ci: '',
        email: '',
        usuario_asignado: '',
        contrasena: '',
        tipo: 'Logistica'
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
    e.preventDefault();
    if (!window.confirm('Seguro desea registrarse?')) {
        return;
    }
    try {
        const response = await fetch('/api/usuario/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        // Verificar el tipo de contenido
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            throw new Error(`Respuesta inesperada: ${text}`);
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Error en la respuesta del servidor');
        }

        if (data.success) {
            setSuccess(true);
            setTimeout(() => navigate('/login'), 2000);
        } else {
            setError(data.message || 'Error al registrar usuario');
        }
    } catch (err) {
        setError(err.message || 'Error de conexión con el servidor');
    }
};
{/**El formulario recopila la información del nuevo usuario.
Antes de enviar la solicitud, se solicita confirmación de que el usuario desea registrarse.
Los datos del formulario se envían al servidor para registrar al nuevo usuario.
Si el registro es exitoso, se muestra un mensaje de éxito y el usuario es redirigido a la página de inicio de sesión.
Si hay un error, se muestra un mensaje indicando el problema, como un error en la conexión o en el registro del usuario.
 */}
    return (
        <div className="register-container">
            <h2>Formulario de Registro</h2>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">¡Registro exitoso! Redirigiendo...</div>}

            <form id="form_registro_usuario" onSubmit={handleSubmit}>
                <input 
                    type="text" 
                    name="nombre" 
                    placeholder="Nombre" 
                    value={formData.nombre}
                    onChange={handleChange}
                    required 
                />
                <input 
                    type="text" 
                    name="apellido" 
                    placeholder="Apellido" 
                    value={formData.apellido}
                    onChange={handleChange}
                    required 
                />
                <input 
                    type="text" 
                    name="ci" 
                    placeholder="Cédula (CI)" 
                    maxLength="10" 
                    value={formData.ci}
                    onChange={handleChange}
                    required 
                />
                <input 
                    type="email" 
                    name="email" 
                    placeholder="Correo electrónico" 
                    value={formData.email}
                    onChange={handleChange}
                    required 
                />
                
                <select 
                    name="tipo" 
                    value={formData.tipo}
                    onChange={handleChange}
                    required
                >
                    <option value="">Seleccione una área donde hay vacantes</option>
                    <option value="Contabilidad">Área de Contabilidad</option>
                    <option value="Logística">Área de Logística</option>
                    <option value="Administrador">Administrador del sistema</option>
                </select>
                
                <input 
                    type="text" 
                    name="usuario_asignado" 
                    placeholder="Nombre de usuario" 
                    value={formData.usuario_asignado}
                    onChange={handleChange}
                    required
                />
                <input 
                    type="password" 
                    name="contrasena" 
                    placeholder="Contraseña" 
                    maxLength="10" 
                    value={formData.contrasena}
                    onChange={handleChange}
                    required
                />
                
                <button type="submit">Registrar</button>
                <button type="button" onClick={() => navigate(-1)}>Regresar</button>
            </form>
        </div>
    );
}