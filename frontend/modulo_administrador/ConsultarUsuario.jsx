import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from 'react-modal';
import '../css/modulo_administrador/consultar_usuarios.css';
import { AdminHeader } from '../modulo_usuario/AdminHeader';

// Ajustar el elemento app para accesibilidad
Modal.setAppElement('#root');

export default function ConsultarUsuarios() {
  // Lista de usuarios obtenidos desde el servidor.
  const [usuarios, setUsuarios] = useState([]);
  // Indica si los datos aún están cargando.
  const [loading, setLoading] = useState(true);
  // Almacena mensajes de error para mostrar al usuario.
  const [error, setError] = useState('');
  // Almacena los valores actuales de los filtros aplicados a la búsqueda de usuarios.
  const [filtros, setFiltros] = useState({
    ci: '',
    estado: '',
    tipo: '',
    rango_fecha: ''
  });
// Controla si el modal de historial de usuario está abierto o cerrado.
  const [modalIsOpen, setModalIsOpen] = useState(false);
  // Lista de actividades del usuario seleccionado.
  const [historialUsuario, setHistorialUsuario] = useState([]);
  // Usuario actualmente seleccionado para ver su historial.
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  // Permite redireccionar a otras rutas del sistema.
  const navigate = useNavigate();
  // Registrar actividad y cargar usuarios al montar
  // Se ejecuta una sola vez al cargar el componente: carga los usuarios y registra actividad.
  useEffect(() => {
    cargarUsuarios();  

  }, []);
  // Envía una descripción de la actividad del administrador al backend para mantener el historial.

  
  // Carga lista de usuarios con filtros
  const cargarUsuarios = async () => {
    setLoading(true);
    setError('');
  
    try {
      const params = new URLSearchParams();
      if (filtros.ci)          params.append('ci', filtros.ci);
      if (filtros.estado)      params.append('estado', filtros.estado);
      if (filtros.tipo)        params.append('tipo', filtros.tipo);
      if (filtros.rango_fecha) params.append('rango', filtros.rango_fecha);
  
      const res = await fetch(`/api/administrador/usuarios?${params.toString()}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
  
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Respuesta no válida del servidor: ' + text);
      }
  
      if (!res.ok || !data.success) {
        throw new Error(data.message || `Error ${res.status}`);
      }
  
      setUsuarios(data.usuarios);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
// Obtiene del servidor el historial de actividades del usuario seleccionado.
  const cargarHistorialUsuario = async (idUsuario) => {
      setError('');
      try {
        const res = await fetch(`/api/historial-actividades?usuarioId=${idUsuario}`, {
          headers: { 
            'Accept': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}` 
          }
        });
    
        // Leer como texto y parsear, para atrapar cualquier HTML inesperado
        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error('Respuesta no válida del servidor: ' + text);
        }
    
        if (!res.ok || !data.success) {
          throw new Error(data.message || `Error ${res.status}`);
        }
        setHistorialUsuario(data.historial);
      } catch (err) {
        console.error('Error al cargar el historial de actividades:', err);
        setError(err.message);
      }
    };
  
// Abre el modal y carga el historial del usuario.
  const abrirModalHistorial = (usuario) => {
    setUsuarioSeleccionado(usuario);
    cargarHistorialUsuario(usuario.ID_Usuario);
    setModalIsOpen(true);
  };
// Cierra el modal y limpia el historial mostrado.
  const cerrarModal = () => {
    setModalIsOpen(false);
    setHistorialUsuario([]);
    setUsuarioSeleccionado(null);
  };
// Actualiza el estado de filtros cada vez que se modifica un campo del formulario de búsqueda.
  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
  };
// Redirige a la página de edición de usuario.
  const handleActualizarUsuario = (uuid) => navigate(`/admin/gestion-usuarios/editar-usuario/${uuid}`);
  // Redirige a la página para cambiar el estado del usuario.
  const handleEditarEstadoUsuario = (uuid) => navigate(`/admin/gestion-usuarios/editar-estado-usuario/${uuid}`);
// Elimina al usuario después de una confirmación y actualiza la lista.
 const handleEliminarUsuario = async (uuid) => {
  if (!uuid) {
    console.error('UUID no proporcionado');
    return;
  }
  
  if (!window.confirm('¿Está seguro de eliminar este usuario?')) return;
  
  try {
    const res = await fetch(`/api/administrador/usuarios/${uuid}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || `Error ${res.status}`);
    }

    const data = await res.json();
    
    if (data.success) {
      setUsuarios(us => us.filter(u => u.ID_Usuario !== uuid)); // o .uuid según lo que uses
      alert('Usuario eliminado correctamente');
    }
  } catch (err) {
    console.error('Error al eliminar usuario:', err);
    alert(err.message);
  }
};
  if (loading) return <div className="loading">Cargando usuarios...</div>;
  if (error)   return <div className="error">{error}</div>;

  return (
    <div className="consultar-usuarios-container">
      <AdminHeader />
      <h2>Consultar usuarios</h2>
      <button onClick={() => navigate('/admin/gestion-usuarios')}>Regresar</button>

      <div className="contenedor-filtros">
        <input type="text" name="ci" placeholder="Cédula" value={filtros.ci} onChange={handleFiltroChange} />
        <select name="estado" value={filtros.estado} onChange={handleFiltroChange}>
          <option value="">-- Estado --</option>
          <option value="Activo">Activo</option>
          <option value="Inhabilitado">Inhabilitado</option>
          <option value="Pendiente de asignacion">Pendiente de asignación</option>
        </select>
        <select name="tipo" value={filtros.tipo} onChange={handleFiltroChange}>
          <option value="">-- Tipo de Usuario --</option>
          <option value="Contabilidad">Área de Contabilidad</option>
          <option value="Logistica">Área de Logística</option>
          <option value="Tecnico">Técnico</option>
        </select>
        
        <select name="rango_fecha" value={filtros.rango_fecha} onChange={handleFiltroChange}>
          <option value="">-- Rango Fecha Última Sesión --</option>
          <option value="hoy">Hoy</option>
          <option value="ayer">Ayer</option>
          <option value="15dias">Últimos 15 días</option>
          <option value="30dias">Últimos 30 días</option>
        </select>
        
        <button onClick={cargarUsuarios}>Buscar</button>
      </div>

      <div className="contenedor-tabla">
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Cédula</th><th>Nombre</th><th>Apellido</th>
              <th>Email</th><th>Usuario Asignado</th><th>Estado</th><th>Tipo</th>
              <th>Historial</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.length > 0 ? usuarios.map(u => (
              <tr key={u.ID_Usuario}>
                <td>{u.ID_Usuario}</td>
                <td>{u.ci}</td>
                <td>{u.nombre}</td>
                <td>{u.apellido}</td>
                <td>{u.email}</td>
                <td>{u.usuario_asignado}</td>
                <td>{u.estado}</td>
                <td>{u.tipo}</td>
                <td><button onClick={() => abrirModalHistorial(u)}>Ver Historial</button></td>
                <td>
                  <button onClick={() => handleActualizarUsuario(u.ID_Usuario)}>Actualizar</button>
                  <button onClick={() => handleEditarEstadoUsuario(u.ID_Usuario)}>Editar Estado</button>
                  <button onClick={() => handleEliminarUsuario(u.ID_Usuario)}>Eliminar</button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="11">No se encontraron usuarios</td></tr>
            )}
          </tbody>
        </table>
      </div>
{/** Muestra el historial de actividades del usuario seleccionado en una ventana emergente.*/}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={cerrarModal}
        contentLabel="Historial de Actividades"
        className="modal-historial"
        overlayClassName="modal-overlay"
      >
        <h2>Historial de Actividades</h2>
        <h3>{usuarioSeleccionado?.nombre} {usuarioSeleccionado?.apellido}</h3>
        <div className="historial-container">
          <table className="tabla-historial">
            <thead>
              <tr><th>Fecha</th><th>Actividad</th></tr>
            </thead>
            <tbody>
              {historialUsuario.length > 0 ?
                historialUsuario.map((actividad, i) => (
                  <tr key={i}>
                    <td>{new Date(actividad.fecha_registro).toLocaleString()}</td>
                    <td>{actividad.descripcion}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="2">No hay actividades registradas</td></tr>
                )
              }
            </tbody>
          </table>
        </div>
        <button onClick={cerrarModal}>Cerrar</button>
      </Modal>
    </div>
  );
}
