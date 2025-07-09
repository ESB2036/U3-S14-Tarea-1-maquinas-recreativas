import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminHeader } from '../modulo_usuario/AdminHeader';
import '../css/modulo_contabilidad/Consultar_Recaudacion.css';

export default function ConsultarInformeDistribucion() {
  const [filters, setFilters] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    ID_Maquina: '',
    ID_Comercio: '',
    estado: ''
  });
  
  const [informes, setInformes] = useState([]);
  const [maquinas, setMaquinas] = useState([]);
  const [comercios, setComercios] = useState([]);

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMachines();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInformes();
    }, 300);

    return () => clearTimeout(timer);
  }, [filters]);

  const fetchMachines = async () => {
    try {
      const response = await fetch('/api/maquina/distribucion');
      const data = await response.json();
      if (data.success) {
        setMaquinas(data.maquinas);
      }
    } catch (error) {
      console.error('Error fetching machines:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const fetchInformes = async () => {
    setLoading(true);
    try {
        const queryParams = new URLSearchParams();
        
        if (filters.fecha_inicio) queryParams.append('fecha_inicio', filters.fecha_inicio);
        if (filters.fecha_fin) queryParams.append('fecha_fin', filters.fecha_fin);
        if (filters.ID_Maquina) queryParams.append('ID_Maquina', filters.ID_Maquina);
        if (filters.estado) queryParams.append('estado', filters.estado);
        if (filters.ID_Comercio) queryParams.append('ID_Comercio', filters.ID_Comercio);
        
        const response = await fetch(`/api/distribucion/informes?${queryParams.toString()}`);
        const data = await response.json();
        
        console.log('Datos recibidos:', data); 
        
        if (!response.ok) {
            throw new Error(data.message || 'Error al obtener informes');
        }
        
        if (data.success) {
            setInformes(data.informes || []);
        } else {
            setInformes([]);
            console.error('Error en la respuesta:', data.message);
        }
    } catch (error) {
        setInformes([]);
        console.error('Error al obtener informes:', error.message);
    } finally {
        setLoading(false);
    }
};

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'No se ha dado de baja';
    const date = new Date(dateTime);
    return date.toLocaleString('es-ES');
  };

  return (
    <div className="consultar-container">
      <AdminHeader />
      <h2>Consultar Informes de Distribución</h2>
      <button onClick={() => navigate(-1)}>Regresar</button>

      <div className="contenedor-filtros">
        <div className="filter-group">
          <label>Fecha Inicio</label>
          <input 
            type="date" 
            name="fecha_inicio" 
            value={filters.fecha_inicio} 
            onChange={handleFilterChange} 
          />
        </div>
        
        <div className="filter-group">
          <label>Fecha Fin</label>
          <input 
            type="date" 
            name="fecha_fin" 
            value={filters.fecha_fin} 
            onChange={handleFilterChange} 
          />
        </div>
        
        <div className="filter-group">
          <label>Máquina</label>
          <select 
            name="ID_Maquina" 
            value={filters.ID_Maquina} 
            onChange={handleFilterChange}
          >
            <option value="">Todas</option>
            {maquinas.map(m => (
              <option key={m.ID_Maquina} value={m.ID_Maquina}>
                {m.Nombre_Maquina}
              </option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label>Estado</label>
          <select 
            name="estado" 
            value={filters.estado} 
            onChange={handleFilterChange}
          >
            <option value="">Todos</option>
            <option value="Operativa">Operativa</option>
            <option value="Retirada">Retirada</option>
            <option value="No operativa">No operativa</option>
          </select>
        </div>
        <select name="ID_Comercio" value={filters.ID_Comercio} onChange={handleFilterChange}>
          <option value="">Todos los comercios</option>
          {comercios.map(c => (
            <option key={c.ID_Comercio} value={c.ID_Comercio}>
              {c.Nombre}
            </option>
          ))}
        </select>
        <button 
          onClick={() => setFilters({
            fecha_inicio: '',
            fecha_fin: '',
            ID_Maquina: '',
            estado: ''
          })}
        >
          Limpiar Filtros
        </button>
        
        <button onClick={fetchInformes} disabled={loading}>
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      <div className="contenedor-tabla">
        <h3>Resultados ({informes.length})</h3>
        {loading ? (
          <p>Cargando informes...</p>
        ) : informes.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>ID Distribución</th>
              <th>Máquina</th>
              <th>Técnico Comprobador</th>
              <th>Comercio</th>
              <th>Fecha Alta</th>
              <th>Fecha Baja</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {informes.map(informe => (
              <tr key={informe.ID_Distribucion}>
                <td>{informe.ID_Distribucion}</td>
                <td>{informe.Nombre_Maquina}</td>
                <td>{informe.Nombre_Tecnico || 'No asignado'}</td>
                <td>{informe.Nombre_Comercio || 'Desconocido'}</td>
                <td>{formatDateTime(informe.fecha_alta)}</td>
                <td>{formatDateTime(informe.fecha_baja)}</td>
                <td>{informe.estado || 'Distribuyendose'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        ) : (
          <p>No se encontraron informes de distribución</p>
        )}
      </div>
    </div>
  );
}