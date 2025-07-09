import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../src/context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import '../css/modulo_reporte/gestionReportes.css';
import Modal from 'react-modal';

// Solo configurar el appElement si estamos en el cliente (navegador)
if (typeof window !== 'undefined') {
  Modal.setAppElement('#root');
}

const GestionReportes = ({ adminMode = false, onClose }) => {
    const { currentUser } = useAuth();
    const [reportes, setReportes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [nuevoReporte, setNuevoReporte] = useState({ 
        destinatario: '', 
        descripcion: '',
        tipoDestinatario: ''
    });
    const [usuarios, setUsuarios] = useState([]);
    const [filtroEstado, setFiltroEstado] = useState('todos');
    const [tiposUsuario] = useState(['Tecnico', 'Contabilidad', 'Logistica', 'Administrador', 'Usuario']);
    const [statusMessage, setStatusMessage] = useState('');
    const [isDisabledUser, setIsDisabledUser] = useState(false);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const modalRef = useRef(null);

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Inicializar el modal solo cuando se monta el componente
        if (onClose) {
        setModalIsOpen(true);
        }
        
        if (location.state?.message) {
            setStatusMessage(location.state.message);
        }
        if (location.state?.isDisabledUser) {
            setIsDisabledUser(true);
            cargarAdministradores();
        }
    }, [location.state]);

    useEffect(() => {
        if (!adminMode && !isDisabledUser) {
            cargarReportes();
        } else if (isDisabledUser) {
            cargarAdministradores();
        }
    }, [adminMode, currentUser, isDisabledUser]);

    const cargarReportes = async () => {
        try {
            const response = await fetch(`/api/reportes/usuario/${currentUser.ID_Usuario}`);
            if (!response.ok) throw new Error('Error al cargar reportes');
            const data = await response.json();
            setReportes(data.reportes);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const cargarAdministradores = async () => {
        try {
            const response = await fetch(`/api/usuarios/por-tipo?tipo=Administrador&emisorId=${currentUser.ID_Usuario}`);
            const data = await response.json();
            if (data.success) {
                setUsuarios(data.usuarios);
                if (isDisabledUser && data.usuarios.length > 0) {
                    setNuevoReporte(prev => ({
                        ...prev,
                        destinatario: data.usuarios[0].ID_Usuario,
                        tipoDestinatario: 'Administrador'
                    }));
                }
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const cerrarModal = () => {
    if (modalIsOpen) {
        setModalIsOpen(false);
        if (onClose) {
        onClose();
        }
    }
    };

    // Manejar el foco cuando el modal se abre
    useEffect(() => {
        if (modalIsOpen && modalRef.current) {
            // Enfocar el modal cuando se abre
            modalRef.current.focus();
        }
    }, [modalIsOpen]);

    const cargarUsuariosPorTipo = async (tipo) => {
        try {
            const response = await fetch(`/api/usuarios/por-tipo?tipo=${encodeURIComponent(tipo)}&emisorId=${currentUser.ID_Usuario}`);
            if (!response.ok) throw new Error('Error al cargar usuarios');
            const data = await response.json();
            setUsuarios(data.usuarios);
        } catch (err) {
            console.error('Error al cargar usuarios:', err);
            setUsuarios([]);
        }
    };

    const handleSubmitReporte = async (e) => {
        e.preventDefault();
        if (!window.confirm('¿Está seguro de enviar reporte?')) {
            return;
        }
        try {
            if (!nuevoReporte.destinatario || !nuevoReporte.descripcion) {
                throw new Error('Debes seleccionar un destinatario y escribir una descripción');
            }

            const descripcionFinal = isDisabledUser 
                ? `[SOLICITUD DE REACTIVACIÓN] ${nuevoReporte.descripcion}`
                : adminMode 
                    ? `[USUARIO RESTRINGIDO] ${nuevoReporte.descripcion}`
                    : nuevoReporte.descripcion;

            const response = await fetch('/api/reportes/crear', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ID_Usuario_Emisor: currentUser.ID_Usuario,
                    ID_Usuario_Destinatario: nuevoReporte.destinatario,
                    descripcion: descripcionFinal
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Error al crear reporte');

            if (!adminMode && !isDisabledUser) {
                await cargarReportes();
            }

            alert('Reporte enviado correctamente.');
            await fetch('/api/historial-actividades', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    descripcion: `El usuario envió un reporte`
                })
            });
            
            setNuevoReporte({ destinatario: '', descripcion: '', tipoDestinatario: '' });
            setUsuarios([]);
            
            if (isDisabledUser) {
                navigate('/reportes/');
            } else if (onClose) {
                onClose();
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setNuevoReporte(prev => ({ ...prev, [name]: value }));
        if (name === 'tipoDestinatario') cargarUsuariosPorTipo(value);
    };

    const handleVerChat = (reporte) => {
    if (onClose) {
        // Si estamos en un modal, abrir el chat en un nuevo modal
        setModalIsOpen(false); // Cierra el modal actual
        navigate(`/reportes/chat?reporteId=${reporte.ID_Reporte}&currentUserId=${currentUser.ID_Usuario}`, {
            state: { fromModal: true }
        });
    } else {
        // Si no estamos en un modal, navegar normalmente
        navigate(`/reportes/chat?reporteId=${reporte.ID_Reporte}&currentUserId=${currentUser.ID_Usuario}`);
    }
};

    const handleActualizarEstado = async (reporteId, nuevoEstado) => {
        try {
            const response = await fetch(`/api/reportes/${reporteId}/estado`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: nuevoEstado })
            });

            const data = await response.json();
            if (data.success) {
                const updatedReportes = reportes.map(reporte =>
                    reporte.ID_Reporte === reporteId ? { ...reporte, estado: nuevoEstado } : reporte
                );
                setReportes(updatedReportes);
                await fetch('/api/historial-actividades', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        descripcion: `El usuario actualizó el estado de un reporte`
                    })
                });
            } else {
                throw new Error(data.message || 'Error al actualizar estado');
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const reportesFiltrados = filtroEstado === 'todos' 
        ? reportes 
        : reportes.filter(r => r.estado === filtroEstado);

    if (!currentUser || !currentUser.ID_Usuario) {
        return <div className="error">Usuario no autenticado</div>;
    }

    if (loading) return <div className="loading">Cargando...</div>;
    if (error) return <div className="error">{error}</div>;

    // Contenido del componente
    const contenido = (
        <div className={`gestion-reportes-container ${adminMode ? 'admin-mode' : ''} ${isDisabledUser ? 'disabled-user-mode' : ''}`}
             ref={modalRef}
             tabIndex="-1" // Para permitir el enfoque
        >
            {statusMessage && (
                <div className="status-message">
                    <p>{statusMessage}</p>
                </div>
            )}

            {isDisabledUser && (
                <div className="disabled-user-notice">
                    <h2>Cuenta Inhabilitada</h2>
                    <p>{statusMessage || "Su cuenta está inhabilitada. Por favor contacte al administrador."}</p>
                </div>
            )}

            {adminMode ? (
                <>
                    <h2>Contactar con Administrador</h2>
                    <p>Estás enviando un reporte como usuario con acceso restringido</p>
                    <form onSubmit={handleSubmitReporte}>
                        <div className="form-group">
                            <label>Administrador:</label>
                            <select 
                                name="destinatario" 
                                value={nuevoReporte.destinatario}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Seleccionar administrador</option>
                                {usuarios.map(user => (
                                    <option key={user.ID_Usuario} value={user.ID_Usuario}>
                                        {user.nombre} {user.apellido} ({user.email})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Descripción:</label>
                            <textarea
                                name="descripcion"
                                value={nuevoReporte.descripcion}
                                onChange={handleChange}
                                placeholder="Describe tu situación..."
                                required
                            />
                        </div>
                        <div className="button-group">
                            <a href="/">Volver al inicio</a>
                            <button type="submit" className="btn-enviar">Enviar Reporte</button>
                            {onClose && (
                                <button type="button" onClick={cerrarModal} className="btn-cancel">Cancelar</button>
                            )}
                        </div>
                    </form>
                </>
            ) : (
                <>
                    {!isDisabledUser && (
                        <>
                            <h2>Gestión de Reportes</h2>   
                            <div className="filtros">
                                <label>Filtrar por estado:</label>
                                <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                                    <option value="todos">Todos</option>
                                    <option value="Pendiente">Pendientes</option>
                                    <option value="En proceso">En proceso</option>
                                    <option value="Resuelto">Resueltos</option>
                                </select>
                            </div>
                        </>
                    )}

                    <div className="nuevo-reporte">
                        <h3>{isDisabledUser ? 'Solicitud de Reactivación' : 'Crear Nuevo Reporte'}</h3>
                        <form onSubmit={handleSubmitReporte}>
                            {!isDisabledUser && (
                                <>
                                    <div className="form-group">
                                        <label>Área del destinatario:</label>
                                        <select 
                                            name="tipoDestinatario" 
                                            value={nuevoReporte.tipoDestinatario}
                                            onChange={handleChange}
                                            required
                                            disabled={isDisabledUser}
                                        >
                                            <option value="">Seleccionar área</option>
                                            {tiposUsuario.map(tipo => (
                                                <option key={tipo} value={tipo}>{tipo}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Destinatario:</label>
                                        <select 
                                            name="destinatario" 
                                            value={nuevoReporte.destinatario}
                                            onChange={handleChange}
                                            required
                                            disabled={isDisabledUser || !nuevoReporte.tipoDestinatario}
                                        >
                                            <option value="">Seleccionar destinatario</option>
                                            {usuarios.map(user => (
                                                <option key={user.ID_Usuario} value={user.ID_Usuario}>
                                                    {user.nombre} {user.apellido} ({user.email})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}
                            <div className="form-group">
                                <label>{isDisabledUser ? 'Explicación para reactivación' : 'Descripción'}:</label>
                                <textarea
                                    name="descripcion"
                                    value={nuevoReporte.descripcion}
                                    onChange={handleChange}
                                    placeholder={isDisabledUser 
                                        ? "Por favor explique por qué desea reactivar su cuenta..." 
                                        : "Describe tu situación..."}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn-enviar">
                                {isDisabledUser ? 'Enviar Solicitud' : 'Enviar Reporte'}
                            </button>

                        </form>
                    </div>

                    {!isDisabledUser && reportesFiltrados.length > 0 && (
                        <div className="lista-reportes">
                            <h3>Mis Reportes</h3>
                            <table className="tabla-reportes">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Fecha</th>
                                        <th>Descripción</th>
                                        <th>Estado</th>
                                        <th>Emisor</th>
                                        <th>Destinatario</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportesFiltrados.map(reporte => (
                                        <tr key={reporte.ID_Reporte}>
                                            <td>{reporte.ID_Reporte}</td>
                                            <td>{new Date(reporte.fecha_hora).toLocaleString()}</td>
                                            <td>{reporte.descripcion}</td>
                                            <td>
                                                <select 
                                                    value={reporte.estado}
                                                    onChange={(e) => handleActualizarEstado(reporte.ID_Reporte, e.target.value)}
                                                >
                                                    <option value="Pendiente">Pendiente</option>
                                                    <option value="En proceso">En proceso</option>
                                                    <option value="Resuelto">Resuelto</option>
                                                </select>
                                            </td>
                                            <td>
                                                {reporte.emisor_nombre && reporte.emisor_apellido
                                                    ? `${reporte.emisor_nombre} ${reporte.emisor_apellido}`
                                                    : 'Sin nombre'}
                                            </td>
                                            <td>
                                                {reporte.destinatario_nombre && reporte.destinatario_apellido
                                                    ? `${reporte.destinatario_nombre} ${reporte.destinatario_apellido}`
                                                    : 'Sin nombre'}
                                            </td>
                                            <td>
                                                <button onClick={() => handleVerChat(reporte)}>Ver Chat</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    );

if (onClose) {
    return (
        <Modal
            isOpen={modalIsOpen}
            onRequestClose={cerrarModal}
            onAfterOpen={() => {
                if (modalRef.current) {
                    modalRef.current.focus();
                }
            }}
            contentLabel="Gestión de Reportes"
            className="modal-reportes"
            overlayClassName="modal-overlay"
            closeTimeoutMS={200}
            ariaHideApp={true}
            shouldFocusAfterRender={true}
            shouldReturnFocusAfterClose={true}
            aria-modal="true"
        >
            <div style={{ position: 'relative' }}>
                <button 
                    onClick={cerrarModal} 
                    className="modal-close-button"
                    aria-label="Cerrar modal"
                >
                    ×
                </button>
                {contenido}
            </div>
        </Modal>
    );
}

    // Si no tiene prop onClose, renderiza normalmente
    return contenido;
};

export default GestionReportes;