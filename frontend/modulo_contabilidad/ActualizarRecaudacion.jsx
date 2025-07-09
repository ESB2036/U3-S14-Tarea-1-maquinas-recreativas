import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../css/modulo_contabilidad/Consultar_Recaudacion.css';
import { AdminHeader } from '../modulo_usuario/AdminHeader';

export default function ActualizarRecaudacion() {
  const { uuid  } = useParams();
  const [formData, setFormData] = useState({
    ID_Recaudacion: uuid,
    ID_Maquina: '',
    Tipo_Comercio: 'Minorista',
    Monto_Total: '',
    Monto_Empresa: '',
    Monto_Comercio: '',
    fecha: '',
    detalle: '',
    Porcentaje_Comercio: 0
  });

  const [maquinas, setMaquinas] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [machinesRes, recaudacionRes] = await Promise.all([
          fetch('/api/contabilidad/maquinas-recaudacion'),
          fetch(`/api/contabilidad/recaudaciones?ID_Recaudacion=${uuid}`)
        ]);

        if (!machinesRes.ok || !recaudacionRes.ok) {
          throw new Error('Error al cargar datos');
        }

        const [machinesData, recaudacionData] = await Promise.all([
          machinesRes.json(),
          recaudacionRes.json()
        ]);

        if (machinesData.success) {
          setMaquinas(machinesData.maquinas);
        } else {
          throw new Error(machinesData.message || 'Error al cargar máquinas');
        }

        if (recaudacionData.success && recaudacionData.recaudaciones.length > 0) {
          const rec = recaudacionData.recaudaciones[0];
          setFormData({
            ID_Recaudacion: rec.ID_Recaudacion,
            ID_Maquina: rec.ID_Maquina.toString(),
            Tipo_Comercio: rec.Tipo_Comercio,
            Monto_Total: rec.Monto_Total,
            Monto_Empresa: rec.Monto_Empresa,
            Monto_Comercio: rec.Monto_Comercio,
            fecha: rec.fecha ? new Date(rec.fecha).toISOString().slice(0, 16) : '',
            detalle: rec.detalle || '',
            Porcentaje_Comercio: rec.Porcentaje_Comercio || (rec.Tipo_Comercio === 'Mayorista' ? 20 : 0)
          });
        } else {
          setMessage(recaudacionData.message || 'No se encontró la recaudación');
        }
      } catch (error) {
        setMessage(error.message || 'Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };

    if (uuid) fetchData();
  }, [uuid]);

  useEffect(() => {
    const { Tipo_Comercio, Porcentaje_Comercio, Monto_Total } = formData;
    const total = parseFloat(Monto_Total) || 0;
    const porcentaje = parseFloat(Porcentaje_Comercio) || 0;

    if (Tipo_Comercio === 'Mayorista') {
      const montoComercio = total * (porcentaje / 100);
      const montoEmpresa = total - montoComercio;

      setFormData(prev => ({
        ...prev,
        Monto_Comercio: montoComercio.toFixed(2),
        Monto_Empresa: montoEmpresa.toFixed(2)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        Monto_Comercio: '0.00',
        Monto_Empresa: total.toFixed(2),
        Porcentaje_Comercio: 0
      }));
    }
  }, [formData.Monto_Total, formData.Porcentaje_Comercio, formData.Tipo_Comercio]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (!formData.ID_Maquina) {
        setMessage('Seleccione una máquina válida');
        setLoading(false);
        return;
      }

      if (formData.Tipo_Comercio === 'Mayorista' && formData.Porcentaje_Comercio <= 0) {
        setMessage('El porcentaje para comercio mayorista debe ser mayor a 0');
        setLoading(false);
        return;
      }

      const fechaObj = new Date(formData.fecha);
      if (isNaN(fechaObj.getTime())) {
        setMessage('Fecha y hora no válidas');
        setLoading(false);
        return;
      }

      const fechaFormateada = fechaObj.toISOString().slice(0, 19).replace('T', ' ');

      // Preparar datos para enviar según tipo de comercio
      const dataToSend = {
        ID_Recaudacion: formData.ID_Recaudacion,
        ID_Maquina:  formData.ID_Maquina, 
        Tipo_Comercio: formData.Tipo_Comercio,
        Monto_Total: parseFloat(formData.Monto_Total),
        Monto_Empresa: parseFloat(formData.Monto_Empresa),
        Monto_Comercio: parseFloat(formData.Monto_Comercio),
        fecha: fechaFormateada,
        detalle: formData.detalle || '',
        Porcentaje_Comercio: formData.Tipo_Comercio === 'Mayorista' 
          ? parseFloat(formData.Porcentaje_Comercio) 
          : 0
      };

      const response = await fetch('/api/contabilidad/actualizar-recaudacion', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error en la base de datos');
      }

      if (result.success) {
        setMessage('Recaudación actualizada correctamente');
        setTimeout(() => navigate('/contabilidad/consultar-recaudaciones'), 1500);
      } else {
        setMessage(result.message || 'Error al actualizar recaudación');
      }
    } catch (error) {
      console.error('Error al actualizar recaudación:', error);
      setMessage(error.message || 'Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="recaudacion-container">
      <AdminHeader />
      <h2>Actualizar Recaudación</h2>
      <button onClick={() => navigate(-1)}>Regresar</button>

      {message && <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>{message}</div>}

      <form onSubmit={handleSubmit} className="recaudacion-form">
        <div className="form-group">
          <label>Máquina</label>
          <select name="ID_Maquina" value={formData.ID_Maquina} onChange={handleChange} required disabled>
            <option value="">Seleccione una máquina</option>
            {maquinas.map(m => (
              <option key={m.ID_Maquina} value={m.ID_Maquina}>
                {m.Nombre_Maquina} - {m.NombreComercio} ({m.TipoComercio})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Tipo de Comercio</label>
          <select 
            name="Tipo_Comercio" 
            value={formData.Tipo_Comercio} 
            onChange={handleChange} 
            required 
            disabled
          >
            <option value="Minorista">Minorista</option>
            <option value="Mayorista">Mayorista</option>
          </select>
        </div>

        <div className="form-group">
          <label>Monto Total *</label>
          <input
            type="number"
            step="0.01"
            min="0"
            name="Monto_Total"
            value={formData.Monto_Total}
            onChange={handleChange}
            required
          />
        </div>

        {formData.Tipo_Comercio === 'Mayorista' && (
          <>
            <div className="form-group">
              <label>Porcentaje para Comercio (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                name="Porcentaje_Comercio"
                value={formData.Porcentaje_Comercio}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Monto Empresa</label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="Monto_Empresa"
                value={formData.Monto_Empresa}
                readOnly
              />
            </div>

            <div className="form-group">
              <label>Monto Comercio</label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="Monto_Comercio"
                value={formData.Monto_Comercio}
                readOnly
              />
            </div>
          </>
        )}

        <div className="form-group">
          <label>Fecha y Hora *</label>
          <input
            type="datetime-local"
            name="fecha"
            value={formData.fecha}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Detalles</label>
          <textarea
            name="detalle"
            value={formData.detalle}
            onChange={handleChange}
          />
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Actualizando...' : 'Actualizar Recaudación'}
        </button>
      </form>
    </div>
  );
}