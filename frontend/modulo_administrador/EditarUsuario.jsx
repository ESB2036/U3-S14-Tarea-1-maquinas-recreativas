import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import '../css/modulo_administrador/consultar_usuarios.css';
import { AdminHeader } from '../modulo_usuario/AdminHeader';
export default function EditarUsuario({ modo = 'actualizar' }) {
    // Obtiene el ID del usuario desde la URL para saber a quién se va a editar.
    const { uuid } = useParams();
    // Datos actuales del usuario.
    const [usuario, setUsuario] = useState(null);
     // Muestra estado de carga.
    const [loading, setLoading] = useState(true);
     // Mensaje de error si ocurre.
    const [error, setError] = useState('');
     // Indica si se guardó con éxito.
    const [success, setSuccess] = useState(false);
    // Carga los datos del usuario al iniciar el componente.
    const navigate = useNavigate();
// Carga los datos del usuario al iniciar el componente.
// En el useEffect que carga el usuario
useEffect(() => {

  const fetchUsuario = async (uuid) => {
    try {
      const response = await fetch(`/api/administrador/usuarios/${uuid}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        // Asegurarse de incluir ID_Tecnico si es un técnico
        const userData = data.usuario;
        if (userData.tipo === 'Tecnico' && !userData.ID_Tecnico) {
          userData.ID_Tecnico = uuid; // Asignar el UUID como ID_Tecnico si no existe
        }
        setUsuario(userData);
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };
  
  fetchUsuario(uuid);
}, [uuid]);
// Envía los datos modificados al backend. Usa PUT si es modo "actualizar", o PATCH si es modo "estado".
const handleSubmit = async (e) => {
    e.preventDefault();
    if (!window.confirm('¿Está seguro de guardar los cambios?')) {
        return;
    }
    
    try {
        let formData;
        
        if (modo === 'actualizar') {
            formData = {
                ID_Usuario: uuid,
                nombre: e.target.nombre.value,
                apellido: e.target.apellido.value,
                email: e.target.email.value,
                usuario_asignado: e.target.usuario_asignado.value,
                ci: e.target.ci.value,
                tipo: e.target.tipo.value,
                estado: usuario.estado
            };

            // Solo agregar especialidad si es técnico
            if (formData.tipo === 'Tecnico') {
                formData.ID_Tecnico = uuid;
                formData.especialidad = e.target.especialidad.value;
            } else {
                formData.especialidad = null;
            }

            // Solo procesar contraseña si existe el campo (modo actualizar)
            if (e.target.contrasena) {
                const nuevaContrasena = e.target.contrasena.value.trim();
                if (nuevaContrasena !== '') {
                    formData.contrasena = nuevaContrasena;
                }
            }
        } else {
            formData = {
                ID_Usuario: uuid,
                estado: e.target.estado.value
            };
        }

        const method = modo === 'actualizar' ? 'PUT' : 'PATCH';
        const response = await fetch(`/api/administrador/usuarios/${uuid}`, {
            method,
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error en la solicitud');
        }

        const data = await response.json();
        if (data.success) {
            // Registrar actividad
            await fetch('/api/historial-actividades', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    descripcion: `El usuario editó los datos del usuario ${uuid}`
                })
            });
            
            setSuccess(true);
            setTimeout(() => navigate('/admin/gestion-usuarios/consultar-usuarios'), 2000);
        } else {
            setError(data.message || `Error al ${modo === 'actualizar' ? 'actualizar' : 'cambiar estado del'} usuario`);
        }
        console.log('Payload enviado:', formData);

    } catch (err) {
        setError(err.message || 'Error de conexión con el servidor');
        console.error('Error al guardar cambios:', err);
    }
};
    if (loading) return <div className="loading">Cargando usuario...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!usuario) return <div>Usuario no encontrado</div>;

    return (
        <div className="edit-user-container">
             <AdminHeader />
            <h2>{modo === 'actualizar' ? 'Editar Usuario' : 'Editar Estado de Usuario'}: {usuario.nombre} {usuario.apellido}</h2>
            
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">¡Operación realizada correctamente! Redirigiendo...</div>}
{/**
                 * Campos para actualizar:

                    Nombre, Apellido, Email, Cédula

                    Tipo de usuario (Administrador, Contabilidad, Logística, Técnico)

                    Usuario asignado

                    Estado (solo lectura)

                    Especialidad (solo si es técnico)
                 * 
                 */}
            <form onSubmit={handleSubmit}>
                
                {modo === 'actualizar' ? (
                    <>
                        <div className="form-group">
                            <label>Nombre:</label>
                            <input 
                                type="text" 
                                name="nombre" 
                                defaultValue={usuario.nombre} 
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Apellido:</label>
                            <input 
                                type="text" 
                                name="apellido" 
                                defaultValue={usuario.apellido} 
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Email:</label>
                            <input 
                                type="email" 
                                name="email" 
                                defaultValue={usuario.email} 
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Cédula:</label>
                            <input 
                                type="text" 
                                name="ci" 
                                defaultValue={usuario.ci} 
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Tipo de Usuario:</label>
                            <select 
                                name="tipo" 
                                defaultValue={usuario.tipo}
                                required
                            >
                                <option value="Administrador">Administrador del sistema</option>
                                <option value="Contabilidad">Contabilidad</option>
                                <option value="Logistica">Logística</option>
                                <option value="Tecnico">Técnico</option>
                            </select>
                        </div>
                        
                        <div className="form-group">
                            <label>Usuario Asignado:</label>
                            <input 
                                type="text" 
                                name="usuario_asignado" 
                                defaultValue={usuario.usuario_asignado} 
                                required
                            />
                        </div>
                        <div className="form-group">
                        <label>Contraseña (dejar vacía si no deseas cambiarla):</label>
                        <input 
                            type="password" 
                            name="contrasena" 
                            placeholder="Nueva contraseña (opcional)" 
                        />
                        </div>

                        <div className="form-group">
                            <label>Estado:</label>
                            <input 
                                type="text" 
                                value={usuario.estado} 
                                readOnly
                            />
                        </div>

                        {usuario.tipo === 'Tecnico' && (
                            <div className="form-group">
                                <label>Especialidad:</label>
                                <select 
                                    name="especialidad" 
                                    defaultValue={usuario.Especialidad || ''}
                                    required
                                >
                                    <option value="Ensamblador">Ensamblador</option>
                                    <option value="Comprobador">Comprobador</option>
                                    <option value="Mantenimiento">Mantenimiento</option>
                                </select>
                            </div>
                        )}
                    </> 

                ) : ( 
                    <>
                        <div className="form-group">                    
                        {/**Modo: estado
                        Campos para editar:
                            Estado actual (solo lectura)
                            Nuevo estado (select con opciones)
                        */}
                            <label>Estado Actual:</label>
                            <input 
                                type="text" 
                                value={usuario.estado} 
                                readOnly
                            />
                        </div>

                        <div className="form-group">
                            <label>Nuevo Estado:</label>
                            <select name="estado" required>
                                <option value="Activo">Activo</option>
                                <option value="Inhabilitado">Inhabilitado</option>
                                <option value="Pendiente de asignacion">Pendiente de asignación</option>
                            </select>
                        </div>
                    </>
                )}
                
                <div className="form-actions">
                    <button type="submit">Guardar Cambios</button>
                    <button type="button" onClick={() => navigate('/admin/gestion-usuarios/consultar-usuarios')}>
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    );
}