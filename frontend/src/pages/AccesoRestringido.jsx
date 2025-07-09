import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import GestionReportes from '../../modulo_reporte/GestionReportes';
import '../../css/modulo_reporte/gestionReportes.css';
//Este componente muestra una pantalla de "acceso restringido" cuando un usuario intenta ingresar al sistema y su cuenta está inhabilitada o pendiente de asignación.
//Permite visualizar información del usuario y contactar al administrador mediante un formulario de reporte.
export default function AccesoRestringido() {
    const location = useLocation();
    const navigate = useNavigate();
    const { userData, motivo } = location.state || {};
    const [showReportForm, setShowReportForm] = useState(false);

    if (!userData) {
        navigate('/login');
        return null;
    }
//Activa el formulario para contactar al administrador.
    const handleContactAdmin = () => {
        setShowReportForm(true);
    };

    const handleCancel = () => {
        navigate('/login');
    };
{/**Componente para reportar el problema al administrador. Se pasa:
    currentUser: Datos del usuario actual.
    adminMode: Activa modo administrador.
    onClose: Cierra el formulario.
    */}
    if (showReportForm) {
        return (
            <div className="acceso-restringido-container">
                <GestionReportes 
                    currentUser={userData} 
                    adminMode={true}
                    onClose={() => setShowReportForm(false)}
                />
            </div>
        );
    }

    return (
        <div className="acceso-restringido-container">
            <h2>Acceso Restringido</h2>
            <div className="user-info">
                <p>Usuario: {userData.nombre} {userData.apellido}</p>
                <p>Cédula: {userData.ci}</p>
                <p>Estado: {userData.estado}</p>
                <p className="motivo">{motivo}</p>
            </div>
            
            <div className="button-group">
                <button onClick={handleCancel} className="btn-cancel">
                    Volver al Login
                </button>
                {(userData.estado === 'Inhabilitado' || userData.estado === 'Pendiente de asignacion') && (
                    <button onClick={handleContactAdmin} className="btn-contact">
                        Contactar con Administrador
                    </button>
                )}
            </div>
        </div>
    );
}