import { useState, useEffect } from 'react'; 
import { AdminHeader } from '../modulo_usuario/AdminHeader';
import '../css/modulo_contabilidad/recaudacion.css';
import Modal from 'react-modal';
import { useNavigate } from 'react-router-dom';
Modal.setAppElement('#root');

export default function RegistrarRecaudacion() {
  const [user, setUser] = useState(null);
  const [comercios, setComercios] = useState([]);
  const [maquinas, setMaquinas] = useState([]);
  const [formData, setFormData] = useState({
    ID_Comercio: '',
    ID_Maquina: '',
    Tipo_Comercio: '',
    Porcentaje_Comercio: 20,
    Monto_Total: '',
    Monto_Comercio: '',
    Monto_Empresa: '',
    fecha: '',
    detalle: ''
  });
  const [resumenRecaudaciones, setResumenRecaudaciones] = useState([]);
  const [loadingMaquinas, setLoadingMaquinas] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
 const [showComponents, setShowComponents] = useState(false);
  const [machineComponents, setMachineComponents] = useState([]);
  const [showInformeModal, setShowInformeModal] = useState(false);
  const [informeData, setInformeData] = useState(null);
  const [tecnicos, setTecnicos] = useState({
    ensamblador: null,
    comprobador: null,
    mantenimiento: null
  });
  const [hasRecaudacion, setHasRecaudacion] = useState(false);

  const navigate = useNavigate();
    const fetchMachineComponents = async (idMaquina) => {
    try {
      const response = await fetch(`/api/maquina/componentes/${idMaquina}`);
      const data = await response.json();
      if (data.success) {
        setMachineComponents(data.componentes);
      } else {
        setMachineComponents([]);
      }
    } catch (error) {
      console.error('Error fetching components:', error);
      setMachineComponents([]);
    }
  };

  const handleShowComponents = () => {
    if (!formData.ID_Maquina) {
      setError('Seleccione una máquina primero');
      return;
    }
    fetchMachineComponents(formData.ID_Maquina);
    setShowComponents(!showComponents);
  };

   const generateInformeData = async () => {
  if (!formData.ID_Maquina || !formData.ID_Comercio) {
    setError('Seleccione una máquina y un comercio primero');
    return;
  }

  try {
    // Obtener datos de la máquina
    const maquinaRes = await fetch(`/api/contabilidad/maquina-recaudacion/${formData.ID_Maquina}`);
    if (!maquinaRes.ok) throw new Error('Error al obtener datos de la máquina');
    const maquinaData = await maquinaRes.json();
    
    // Obtener datos del comercio
    const comercioRes = await fetch(`/api/contabilidad/comercio-recaudacion/${formData.ID_Comercio}`);
    if (!comercioRes.ok) throw new Error('Error al obtener datos del comercio');
    const comercioData = await comercioRes.json();

    // Obtener técnicos asociados
    const ensambladorRes = await fetch(`/api/usuario/perfil/${maquinaData.maquina.ID_Tecnico_Ensamblador}`);
    const comprobadorRes = await fetch(`/api/usuario/perfil/${maquinaData.maquina.ID_Tecnico_Comprobador}`);
    
    const ensamblador = await ensambladorRes.json();
    const comprobador = await comprobadorRes.json();
    
    let mantenimiento = null;
    if (maquinaData.maquina.ID_Tecnico_Mantenimiento) {
      const mantenimientoRes = await fetch(`/api/usuario/perfil/${maquinaData.maquina.ID_Tecnico_Mantenimiento}`);
      mantenimiento = await mantenimientoRes.json();
    }

    // Obtener componentes de la máquina
    const componentesRes = await fetch(`/api/maquina/componentes/${formData.ID_Maquina}`);
    const componentesData = await componentesRes.json();

    setTecnicos({
      ensamblador: ensamblador.usuario,
      comprobador: comprobador.usuario,
      mantenimiento: mantenimiento?.usuario || null
    });

    setMachineComponents(componentesData.componentes || []);

    const informe = {
      nombreMaquina: maquinaData.maquina.Nombre_Maquina,
      nombreComercio: comercioData.comercio.Nombre,
      direccionComercio: comercioData.comercio.Direccion,
      telefonoComercio: comercioData.comercio.Telefono,
      tipoComercio: comercioData.comercio.Tipo,
      montoTotal: formData.Monto_Total,
      fecha: formData.fecha
    };

    setInformeData(informe);
    setShowInformeModal(true);
  } catch (error) {
    console.error('Error generating report:', error);
    setError('Error al generar datos del informe: ' + error.message);
  }
};

  const handlePrintInforme = () => {
    window.print();
  };

 const handleSaveInforme = async () => {
  try {
    if (!formData.ID_Recaudacion) {
      setError('Primero debe registrar una recaudación');
      return;
    }

    const response = await fetch('/api/contabilidad/guardar-informe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ID_Recaudacion: formData.ID_Recaudacion,
        CI_Usuario: user.ci,
        Nombre_Maquina: informeData.nombreMaquina,
        ID_Comercio: formData.ID_Comercio,
        Nombre_Comercio: informeData.nombreComercio,
        Direccion_Comercio: informeData.direccionComercio,
        Telefono_Comercio: informeData.telefonoComercio,
        Pago_Ensamblador: 400.00,
        Pago_Comprobador: 400.00,
        Pago_Mantenimiento: tecnicos.mantenimiento ? 400.00 : 0.00,
        componentes: machineComponents
      })
    });

    const data = await response.json();
    if (data.success) {
      setSuccess('Informe guardado correctamente');
      setShowInformeModal(false);
      // Actualizar el estado para indicar que ya tiene una recaudación
      setHasRecaudacion(true);
    } else {
      setError(data.message || 'Error al guardar el informe');
    }
  } catch (error) {
    console.error('Error saving report:', error);
    setError('Error al guardar el informe');
  }
};
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
    
    fetch('/api/comercio/all')
      .then(r => {
        if (!r.ok) throw new Error('Error al cargar comercios');
        return r.json();
      })
      .then(d => {
        if (d.success && d.comercios) {
          setComercios(d.comercios);
        } else {
          throw new Error(d.message || 'Datos de comercios no válidos');
        }
      })
      .catch(err => {
        console.error('Error:', err);
        setError('Error al cargar la lista de comercios');
      });

    fetch('/api/contabilidad/resumen-recaudaciones?limit=2')
      .then(r => {
        if (!r.ok) throw new Error('Error al cargar resumen');
        return r.json();
      })
      .then(d => setResumenRecaudaciones(d.resumen || []))
      .catch(err => console.error('Error:', err));
  }, []);

  useEffect(() => {
    if (!formData.ID_Comercio) {
      setMaquinas([]);
      setFormData(prev => ({...prev, 
        Tipo_Comercio: '',
        ID_Maquina: '',
        Porcentaje_Comercio: 0
      }));
      return;
    }

const comercioSeleccionado = comercios.find(c => c.ID_Comercio === formData.ID_Comercio);
    if (!comercioSeleccionado) return;

    setFormData(prev => ({
      ...prev,
      Tipo_Comercio: comercioSeleccionado.Tipo,
      Porcentaje_Comercio: comercioSeleccionado.Tipo === 'Mayorista' ? 20 : 0
    }));

    setLoadingMaquinas(true);
    setError(null);
    
fetch(`/api/contabilidad/maquinas-operativas-por-comercio?ID_Comercio=${encodeURIComponent(comercioSeleccionado.ID_Comercio)}`)
      .then(r => {
        if (!r.ok) throw new Error('Error al cargar máquinas');
        return r.json();
      })
      .then(d => {
        if (d.success) {
          setMaquinas(d.maquinas || []);
          if (!d.maquinas || d.maquinas.length === 0) {
            setError('No hay máquinas operativas en etapa de recaudación para este comercio');
          }
        } else {
          setMaquinas([]);
          setError(d.message || 'Error al obtener máquinas');
        }
      })
      .catch(err => {
        console.error('Error al cargar máquinas:', err);
        setMaquinas([]);
        setError('Error al cargar las máquinas del comercio');
      })
      .finally(() => setLoadingMaquinas(false));
       console.log("ID_Comercio seleccionado:", formData.ID_Comercio);
  }, [formData.ID_Comercio, comercios]);

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
        Monto_Empresa: total.toFixed(2)
      }));
    }
  }, [formData.Monto_Total, formData.Porcentaje_Comercio, formData.Tipo_Comercio]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validaciones
    if (!formData.ID_Comercio) {
      setError('Seleccione un comercio');
      return;
    }
    
    if (!formData.ID_Maquina) {
      setError('Seleccione una máquina');
      return;
    }
    
    if (!formData.Monto_Total || isNaN(parseFloat(formData.Monto_Total)) || parseFloat(formData.Monto_Total) <= 0) {
      setError('Ingrese un monto total válido');
      return;
    }
    
    if (!formData.fecha) {
      setError('Seleccione una fecha y hora');
      return;
    }

    const payload = {
      ...formData,
      ID_Usuario: user.ID_Usuario,
      Monto_Total: parseFloat(formData.Monto_Total),
      Monto_Comercio: parseFloat(formData.Monto_Comercio),
      Monto_Empresa: parseFloat(formData.Monto_Empresa)
    };

     try {
        const res = await fetch('/api/contabilidad/registrar-recaudacion', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            credentials: 'include'
        });
        
        // Primero clonar la respuesta para poder leerla múltiples veces si es necesario
        const responseClone = res.clone();
        
        try {
            // Intentar parsear como JSON
            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.message || 'Error al registrar recaudación');
            }
            
            setSuccess('Recaudación registrada con éxito');
            
            // Resetear formulario
            setFormData({
                ID_Comercio: '',
                ID_Maquina: '',
                Tipo_Comercio: '',
                Porcentaje_Comercio: 20,
                Monto_Total: '',
                Monto_Comercio: '',
                Monto_Empresa: '',
                fecha: '',
                detalle: ''
            });
            
            // Actualizar resumen
            try {
                const resResumen = await fetch('/api/contabilidad/resumen-recaudaciones?limit=2');
                if (!resResumen.ok) throw new Error('Error al actualizar resumen');
                const dataResumen = await resResumen.json();
                setResumenRecaudaciones(dataResumen.resumen || []);
            } catch (updateError) {
                console.error('Error al actualizar resumen:', updateError);
            }
        } catch (jsonError) {
            // Si falla el parseo JSON, leer como texto
            const text = await responseClone.text();
            throw new Error(text || 'Error en el servidor');
        }
    } catch (err) {
        console.error('Error completo:', err);
        setError(err.message || 'Error al registrar recaudación. Por favor intente nuevamente.');
    }
};

  return (
    <div className="recaudacion-container">
      <AdminHeader />
      <h2>Registrar Recaudación</h2>

      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {success && <div className="alert alert-success" role="alert">{success}</div>}
      
      <form onSubmit={handleSubmit} className="recaudacion-form">
        <div className="form-group">
          <label htmlFor="ciContador">Cédula Contador</label>
          <input 
            id="ciContador"
            type="text" 
            value={user?.ci || ''} 
            readOnly 
            className="form-control"
            aria-label="Cédula del contador"
          />
        </div>

        <div className="form-group">
          <label htmlFor="ID_Comercio">Comercio *</label>
          <select 
            id="ID_Comercio"
            name="ID_Comercio" 
            value={formData.ID_Comercio} 
            onChange={handleChange} 
            required
            className="form-control"
            aria-required="true"
            aria-label="Seleccione un comercio"
          >
            <option value="">--Seleccione un comercio--</option>
            {comercios.map(c => (
              <option key={c.ID_Comercio} value={c.ID_Comercio}>
                {c.Nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="Tipo_Comercio">Tipo de Comercio</label>
          <input 
            id="Tipo_Comercio"
            type="text" 
            name="Tipo_Comercio" 
            value={formData.Tipo_Comercio || 'Seleccione un comercio primero'} 
            readOnly 
            className="form-control"
            aria-label="Tipo de comercio"
          />
        </div>

        {formData.ID_Comercio && (
          <div className="form-group">
            <label htmlFor="ID_Maquina">Máquina Recreativa *</label>
            <select 
              id="ID_Maquina"
              name="ID_Maquina" 
              value={formData.ID_Maquina} 
              onChange={handleChange} 
              required
              className="form-control"
              disabled={loadingMaquinas}
              aria-required="true"
              aria-label="Seleccione una máquina recreativa"
              aria-busy={loadingMaquinas}
            >
              <option value="">--Seleccione una máquina--</option>
              {loadingMaquinas ? (
                <option value="">Cargando máquinas...</option>
              ) : (
                maquinas.map(m => (
                  <option key={m.ID_Maquina} value={m.ID_Maquina}>
                    {m.Nombre_Maquina}
                  </option>
                ))
              )}
            </select>
            {maquinas.length === 0 && !loadingMaquinas && (
              <small className="text-danger">No hay máquinas operativas en etapa de recaudación para este comercio</small>
            )}
          </div>
        )}

        {formData.Tipo_Comercio === 'Mayorista' && (
          <div className="form-group">
            <label htmlFor="Porcentaje_Comercio">Porcentaje Comercio (%) *</label>
            <input
              id="Porcentaje_Comercio"
              type="number"
              name="Porcentaje_Comercio"
              min="0"
              max="100"
              value={formData.Porcentaje_Comercio}
              onChange={handleChange}
              required
              className="form-control"
              aria-required="true"
              aria-label="Porcentaje para el comercio"
            />
          </div>
        )}

        <div className="form-group">
          <label htmlFor="Monto_Total">Monto Total de Dinero *</label>
          <input
            id="Monto_Total"
            type="number"
            name="Monto_Total"
            step="0.01"
            min="0"
            value={formData.Monto_Total}
            onChange={handleChange}
            required
            className="form-control"
            aria-required="true"
            aria-label="Monto total de dinero"
          />
        </div>

        {formData.Tipo_Comercio === 'Mayorista' && (
          <>
            <div className="form-group">
              <label htmlFor="Monto_Comercio">Monto para Comercio</label>
              <input 
                id="Monto_Comercio"
                type="text" 
                value={formData.Monto_Comercio || '0.00'} 
                readOnly 
                className="form-control"
                aria-label="Monto para el comercio"
              />
            </div>

            <div className="form-group">
              <label htmlFor="Monto_Empresa">Monto para Empresa</label>
              <input 
                id="Monto_Empresa"
                type="text" 
                value={formData.Monto_Empresa || '0.00'} 
                readOnly 
                className="form-control"
                aria-label="Monto para la empresa"
              />
            </div>
          </>
        )}

        <div className="form-group">
          <label htmlFor="fecha">Fecha y Hora *</label>
          <input
            id="fecha"
            type="datetime-local"
            name="fecha"
            value={formData.fecha}
            onChange={handleChange}
            required
            className="form-control"
            aria-required="true"
            aria-label="Fecha y hora de la recaudación"
          />
        </div>

        <div className="form-group">
          <label htmlFor="detalle">Detalles</label>
          <textarea 
            id="detalle"
            name="detalle" 
            value={formData.detalle} 
            onChange={handleChange} 
            className="form-control"
            rows="3"
            aria-label="Detalles adicionales"
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            Registrar Recaudación
          </button>
          <button onClick={() => navigate(-1)}>Regresar</button>

          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={() => window.location.href = '/contabilidad/consultar-recaudaciones'}
          >
            Ver Todas las Recaudaciones
          </button>
        </div>
      </form>
    </div>
  );
}