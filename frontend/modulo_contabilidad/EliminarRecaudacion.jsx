import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../css/modulo_contabilidad/Consultar_Recaudacion.css';
import { AdminHeader } from '../modulo_usuario/AdminHeader';

export default function EliminarRecaudacion() {
  const { id } = useParams();
  const [recaudacion, setRecaudacion] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecaudacion = async () => {
      try {
        const response = await fetch(`/api/contabilidad/recaudaciones?ID_Recaudacion=${id}`);
        const data = await response.json();
        
        if (data.success && data.recaudaciones.length > 0) {
          setRecaudacion(data.recaudaciones[0]);
        } else {
          setMessage('No se encontró la recaudación');
        }
      } catch (error) {
        setMessage('Error al cargar datos');
      }
    };

    if (id) fetchRecaudacion();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('¿Está seguro de eliminar esta recaudación? Esta acción no se puede deshacer.')) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`/api/contabilidad/eliminar-recaudacion/${id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      if (data.success) {
        setMessage('Recaudación eliminada correctamente');
        setTimeout(() => navigate('/contabilidad/consultar-recaudaciones'), 1500);
      } else {
        setMessage(data.message || 'Error al eliminar recaudación');
      }
    } catch (error) {
      setMessage('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(amount);
  };

  return (
    <div className="eliminar-container">
      <AdminHeader/>
      <h2>Eliminar Recaudación</h2>
      <button onClick={() => navigate(-1)}>Regresar</button>

      {message && <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>{message}</div>}
      
      {recaudacion ? (
        <div className="recaudacion-details">
          <h3>Detalles de la Recaudación</h3>
          
          <div className="detail-row">
            <span>ID:</span>
            <span>{recaudacion.ID_Recaudacion}</span>
          </div>
          
          <div className="detail-row">
            <span>Fecha:</span>
            <span>{new Date(recaudacion.fecha).toLocaleDateString()}</span>
          </div>
          
          <div className="detail-row">
            <span>Máquina:</span>
            <span>{recaudacion.Nombre_Maquina}</span>
          </div>
          
          <div className="detail-row">
            <span>Comercio:</span>
            <span>{recaudacion.NombreComercio} ({recaudacion.Tipo_Comercio})</span>
          </div>
          
          <div className="detail-row">
            <span>Monto Total:</span>
            <span>{formatCurrency(recaudacion.Monto_Total)}</span>
          </div>
          
          <div className="detail-row">
            <span>Monto Empresa:</span>
            <span>{formatCurrency(recaudacion.Monto_Empresa)}</span>
          </div>
          
          <div className="detail-row">
            <span>Monto Comercio:</span>
            <span>{formatCurrency(recaudacion.Monto_Comercio)}</span>
          </div>
          
          <div className="detail-row">
            <span>Registrado por:</span>
            <span>{recaudacion.UsuarioNombre} {recaudacion.UsuarioApellido}</span>
          </div>
          
          <div className="detail-row">
            <span>Detalles:</span>
            <span>{recaudacion.detalle || 'Ninguno'}</span>
          </div>
          
          <button 
            onClick={handleDelete} 
            className="delete-btn"
            disabled={loading}
          >
            {loading ? 'Eliminando...' : 'Confirmar Eliminación'}
          </button>
        </div>
      ) : (
        <p>{message || 'Cargando detalles...'}</p>
      )}
    </div>
  );
}