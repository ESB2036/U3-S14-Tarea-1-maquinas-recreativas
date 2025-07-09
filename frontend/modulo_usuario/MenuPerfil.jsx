import { useState, useEffect } from 'react';
import '../css/modulo_usuario/menu_perfil.css';
import { AdminHeader } from './AdminHeader';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../src/context/AuthContext';

export default function MenuPerfil() {
  const { currentUser, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.uuid) {
          navigate('/login');
          return;
        }

        // Validar UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(user.uuid)) {
          throw new Error('ID de usuario no válido');
        }

        const response = await fetch(`/api/usuario/perfil?id=${user.uuid}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) throw new Error('Error al obtener perfil');
        
        const data = await response.json();
        if (data.success && data.usuario) {
          // Verificar datos esenciales
          if (!data.usuario.ci || !data.usuario.email) {
            throw new Error('Datos de usuario incompletos');
          }
          
          // Asumimos que el backend ya envía los datos desencriptados
          setProfile(data.usuario);
          
          await fetch('/api/historial-actividades', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              ID_Usuario: user.uuid,
              descripcion: "El usuario estuvo en su perfil"
            })
          });
        } else {
          setError(data.message || 'Error al cargar el perfil');
        }
      } catch (err) {
        setError(err.message || 'Error al cargar el perfil');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.uuid) {
      fetchProfile();
    } else {
      setError('Usuario no autenticado');
      setLoading(false);
    }
  }, [currentUser, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getSaludo = () => {
    if (!profile) return '';
    const ci = profile.ci;
    
    switch(profile.tipo) {
      case "Logistica":
        return `HOLA LOGÍSTICO CON NÚMERO DE CÉDULA: ${ci}`;
      case "Contabilidad":
        return `HOLA CONTADOR CON NÚMERO DE CÉDULA: ${ci}`;
      case "Tecnico":
        return `HOLA TÉCNICO CON NÚMERO DE CÉDULA: ${ci}`;
      case "Administrador":
        return `HOLA ADMINISTRADOR DEL SISTEMA CON NÚMERO DE CÉDULA: ${ci}`;
      default:
        return `Hola, Usuario con número de cédula: ${ci}`;
    }
  };

  if (loading) return <div className="perfil-loading">Cargando perfil...</div>;
  if (error) return <div className="perfil-error">{error}</div>;
  if (!profile) return null;

  return (
    <div className="contenedor_perfil">
      <AdminHeader/>
      <div className="encabezado">
        <h1 id="saludo_usuario">{getSaludo()}</h1>
      </div>
      <div className="contenedor_todo">
        <div className="caja_trasera">
        </div>
      </div>
      <div className="perfil_detalles">
        <form id="form_detalles" readOnly>
          <label>Cédula</label>
          <input 
            type="text" 
            name="ci" 
            value={profile.ci} 
            readOnly
          />

          <label>Nombre</label>
          <input 
            type="text" 
            name="nombre" 
            value={profile.nombre} 
            readOnly
          />

          <label>Apellido</label>
          <input 
            type="text" 
            name="apellido" 
            value={profile.apellido} 
            readOnly
          />

          <label>Correo electrónico</label>
          <input 
            type="email" 
            name="correo" 
            value={profile.email} 
            readOnly
          />

          <label>Usuario asignado</label>
          <input 
            type="text" 
            name="usuario_asignado" 
            value={profile.usuario_asignado} 
            readOnly
          />

          <label>Función del sistema</label>
          <select name="tipo" value={profile.tipo === 'Administrador' ? 'Administrador' : profile.tipo} disabled>
            <option value="Administrador">Administrador del sistema</option>
            <option value="Logistica">Logística</option>
            <option value="Contabilidad">Área de Contabilidad</option>
            <option value="Tecnico">Técnico</option>
          </select>

          <label>Estado</label>
          <select name="estado" value={profile.estado} disabled>
            <option value="Activo">Activo</option>
            <option value="Inhabilitado">Inhabilitado</option>
          </select>
          <div id="historial"></div>
           <button
            onClick={() => navigate(`/usuario/actualizar-perfil?id=${currentUser.uuid}`)}
          >
            Editar Perfil
          </button>
        
        </form>
      </div>
    </div>
  );
}