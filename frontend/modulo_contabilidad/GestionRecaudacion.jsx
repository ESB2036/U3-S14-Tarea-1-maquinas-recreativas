import { useState, useEffect } from 'react'; 
import { useNavigate } from 'react-router-dom';
import '../css/modulo_contabilidad/mainContabilidad.css';
import { AdminHeader } from '../modulo_usuario/AdminHeader';

export default function GestionRecaudacion() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const registrarActividad = async () => {
    try {
      await fetch('/api/historial-actividades', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
            descripcion: `El usuario accedió a la gestión de recaudaciones`
        })
      });
    } catch (err) {
      console.error('Error al registrar actividad:', err);
      setError('No se pudo registrar la actividad.');
    }
  };

  useEffect(() => {
    registrarActividad();
  }, []);

  return (
    <div className="contabilidad-container">
      <AdminHeader />

      <div className="perfil-contenedor">
        <h2>Gestión de Recaudación</h2>

        <button onClick={() => navigate('/contabilidad')}>Regresar</button>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <div className="admin-actions">
          <button onClick={() => navigate('/contabilidad/registrar-recaudacion')}>
            Registrar Recaudación
          </button>
          <button onClick={() => navigate('/contabilidad/consultar-recaudaciones')}>
            Consultar Recaudaciones
          </button>
        </div>
      </div>
    </div>
  );
}