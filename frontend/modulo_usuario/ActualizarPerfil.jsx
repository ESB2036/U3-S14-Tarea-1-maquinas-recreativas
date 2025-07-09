import { useState, useEffect } from 'react'; 
import { useNavigate } from 'react-router-dom';
import "../css/modulo_usuario/perfil.css";
import { AdminHeader } from './AdminHeader';
import { useAuth } from '../src/context/AuthContext';

export default function ActualizarPerfil() {
    const { currentUser } = useAuth();
    const [usuario, setUsuario] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [tipo, setTipo] = useState('');
    const [especialidad, setEspecialidad] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUsuario = async () => {
            try {
                if (!currentUser?.uuid) {
                    navigate('/login');
                    return;
                }

                const response = await fetch(`/api/usuario/perfil?id=${currentUser.uuid}`);

                if (!response.ok) throw new Error('Error al obtener perfil');
                
                const data = await response.json();
                if (data.success) {
                    setUsuario(data.usuario);
                    setTipo(data.usuario.tipo || '');
                    setEspecialidad(data.usuario.Especialidad || '');
                    
                    // Registrar actividad
                    await fetch('/api/historial-actividades', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify({
                            descripcion: `El usuario accedió a actualizar su perfil`
                        })
                    });
                } else {
                    setError(data.message);
                }
            } catch (err) {
                setError(err.message || 'Error al cargar el perfil');
            } finally {
                setLoading(false);
            }
        };

        fetchUsuario();
    }, [navigate, currentUser]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!window.confirm('¿Está seguro de guardar los cambios?')) {
            return;
        }

        try {
            const formData = {
                id: currentUser.uuid,
                nombre: e.target.nombre.value,
                apellido: e.target.apellido.value,
                email: e.target.correo.value,
                ci: e.target.ci.value,
                tipo: tipo,
                estado: usuario.estado,
                especialidad: tipo === 'Tecnico' ? especialidad : null
            };

            // Solo procesar contraseña si se proporciona y no está vacía
            const nuevaContrasena = e.target.contrasena.value.trim();
            if (nuevaContrasena !== '') {
                formData.contrasena = nuevaContrasena;
            }

            const response = await fetch('/api/usuario/actualizar-perfil', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error en la respuesta del servidor');
            }
            
            const result = await response.json();
            if (result.success) {
                setSuccess(true);
                // Actualizar datos en el contexto de autenticación
                const updatedUser = {
                    ...currentUser,
                    nombre: formData.nombre,
                    apellido: formData.apellido,
                    email: formData.email
                };
                localStorage.setItem('user', JSON.stringify(updatedUser));

                setTimeout(() => navigate(-1), 2000);
            } else {
                setError(result.message || 'Error al actualizar el perfil');
            }
        } catch (err) {
            console.error('Error al actualizar perfil:', err);
            setError(err.message || 'Error de conexión con el servidor');
        }
    };

    if (loading) return <div>Cargando...</div>;
    if (!usuario) return <div className="error">{error || 'Usuario no encontrado'}</div>;

    return (
        <div className="perfil-contenedor">
            <AdminHeader/>
            <h2>Editar perfil del usuario</h2>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">¡Perfil actualizado correctamente! Redirigiendo...</div>}

            <form id="formActualizarPerfil" onSubmit={handleSubmit}>
                <input type="hidden" name="ID_Usuario" value={usuario.ID_Usuario} />

                <label>Cédula</label>
                <input type="text" name="ci" defaultValue={usuario.ci} readOnly />

                <label>Nombre</label>
                <input type="text" name="nombre" defaultValue={usuario.nombre} required />

                <label>Apellido</label>
                <input type="text" name="apellido" defaultValue={usuario.apellido} required />

                <label>Correo electrónico</label>
                <input type="email" name="correo" defaultValue={usuario.email} required />

                <label>Usuario asignado</label>
                <input type="text" name="usuario_asignado" defaultValue={usuario.usuario_asignado} readOnly />

                <label>Contraseña (nueva)</label>
                <input 
                    type="password" 
                    name="contrasena" 
                    placeholder="Dejar vacío para no cambiar"
                    minLength="8"
                />

                <label>Función del sistema</label>
                <select
                    name="tipo"
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    disabled
                >
                    <option value="Administrador">Administrador del sistema</option>
                    <option value="Contabilidad">Área de Contabilidad</option>
                    <option value="Logistica">Logística</option>
                    <option value="Tecnico">Técnico</option>
                </select>
                <input type="hidden" name="tipo" value={tipo} />

                {tipo === 'Tecnico' && (
                    <div>
                        <label>Especialidad</label>
                        <select
                            name="especialidad"
                            value={especialidad}
                            onChange={(e) => setEspecialidad(e.target.value)}
                            disabled
                        >
                            <option value="">Seleccione una especialidad</option>
                            <option value="Ensamblador">Ensamblador</option>
                            <option value="Comprobador">Comprobador</option>
                            <option value="Mantenimiento">Mantenimiento</option>
                        </select>
                    </div>
                )}

                <label>Estado</label>
                <select
                    name="estado"
                    defaultValue={usuario.estado}
                    disabled
                >
                    <option value="Activo">Activo</option>
                    <option value="Inhabilitado">Inhabilitado</option>
                    <option value="Pendiente de asignacion">Pendiente de asignación</option>
                </select>
                <input type="hidden" name="estado" value={usuario.estado} />

                <button type="submit">Actualizar Perfil</button>
            </form>
            <button onClick={() => navigate(-1)}>Regresar</button>
        </div>
    );
}