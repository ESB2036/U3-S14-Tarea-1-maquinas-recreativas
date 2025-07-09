import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/modulo_contabilidad/Consultar_Recaudacion.css';
import { AdminHeader } from '../modulo_usuario/AdminHeader';

export default function ConsultarRecaudacion() {
  const [filters, setFilters] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    ID_Maquina: '',
    Tipo_Comercio: ''
  });
  
  const [recaudaciones, setRecaudaciones] = useState([]);
  const [maquinas, setMaquinas] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

 useEffect(() => {
    fetchMachines();
    fetchRecaudaciones();
  }, []);

  // Efecto separado para manejar cambios en los filtros
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRecaudaciones();
    }, 300); // Pequeño delay para evitar múltiples llamadas rápidas

    return () => clearTimeout(timer);
  }, [filters]);

  const fetchMachines = async () => {
    try {
      const response = await fetch('/api/contabilidad/maquinas-recaudacion');
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

  const fetchRecaudaciones = async () => {
  setLoading(true);
  try {
    const queryParams = new URLSearchParams();
    
    if (filters.fecha_inicio) queryParams.append('fecha_inicio', filters.fecha_inicio);
    if (filters.fecha_fin) queryParams.append('fecha_fin', filters.fecha_fin);
    if (filters.ID_Maquina) queryParams.append('ID_Maquina', filters.ID_Maquina);
    if (filters.Tipo_Comercio) queryParams.append('Tipo_Comercio', filters.Tipo_Comercio);
    
    const response = await fetch(`/api/contabilidad/recaudaciones?${queryParams.toString()}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Error al obtener recaudaciones');
    }
    
    if (data.success) {
      // Ordenar por fecha descendente
      const sortedData = data.recaudaciones.sort((a, b) => 
        new Date(b.fecha) - new Date(a.fecha)
      );
      setRecaudaciones(sortedData || []);
    } else {
      setRecaudaciones([]);
    }
  } catch (error) {
    setRecaudaciones([]);
    console.error('Error al obtener recaudaciones:', error);
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
    <div className="consultar-container">
      <AdminHeader />
      <h2>Consultar Recaudaciones</h2>
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
          <label>Tipo Comercio</label>
          <select 
            name="Tipo_Comercio" 
            value={filters.Tipo_Comercio} 
            onChange={handleFilterChange}
          >
            <option value="">Todos</option>
            <option value="Minorista">Minorista</option>
            <option value="Mayorista">Mayorista</option>
          </select>
        </div>
        <button 
        onClick={() => setFilters({
          fecha_inicio: '',
          fecha_fin: '',
          ID_Maquina: '',
          Tipo_Comercio: ''
        })}
      >
        Limpiar Filtros
      </button>
        <button onClick={fetchRecaudaciones} disabled={loading}>
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      <div className="contenedor-tabla">
        <h3>Resultados ({recaudaciones.length})</h3>
        {loading ? (
          <p>Cargando recaudaciones...</p>
        ) : recaudaciones.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Comercio</th>
                <th>Máquina</th>
                <th>Tipo</th>
                <th>Monto</th>
                <th>Fecha</th>
                <th>Detalles</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {recaudaciones.map(r => (
                <tr key={r.ID_Recaudacion}>
                  <td>{r.Nombre_Comercio}</td>
                  <td>{r.Nombre_Maquina}</td>
                  <td>{r.Tipo_Comercio}</td>
                  <td>{r.Monto_Total}</td>
                  <td>{new Date(r.fecha).toLocaleString()}</td>
                  <td>{r.detalle}</td>
                  <td>
                    {r.ID_Informe ? (
                      <button onClick={() => window.location.href = `/contabilidad/informe/${r.ID_Recaudacion}`}>
                        Ver Informe
                      </button>
                    ) : (
                      <button onClick={() => navigate(`/contabilidad/levantar-informe/${r.ID_Recaudacion}`)}>
                        Levantar Informe
                      </button>
                    )}
                    <button onClick={() => navigate(`/contabilidad/actualizar-recaudacion/${r.ID_Recaudacion}`)}>
                      Editar
                    </button>
                    <button onClick={() => {
                      fetch(`/api/contabilidad/eliminar-recaudacion/${r.ID_Recaudacion}`, { method: 'DELETE' })
                        .then(() => setRecaudaciones(prev => prev.filter(x => x.ID_Recaudacion !== r.ID_Recaudacion)));
                    }}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No se encontraron recaudaciones</p>
        )}
      </div>
    </div>
  );
}