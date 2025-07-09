import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
//Este componente redirige al usuario a su respectivo dashboard según su tipo y especialidad almacenados en localStorage. 
// Si no hay sesión iniciada, lo lleva a la pantalla de login.
export default function Main() {
  //Permite realizar redirecciones programadas.
  const navigate = useNavigate();
  //Ejecuta esta lógica al cargar el componente.
  useEffect(() => {
//Recupera token, userType y specialty del almacenamiento local para decidir la ruta de destino.
    const token = localStorage.getItem('token');
    if (token) {
      // Redirect to appropriate dashboard based on user type
      const userType = localStorage.getItem('userType');
      const specialty = localStorage.getItem('specialty');
      
      if (userType === 'Tecnico') {
        if (specialty === 'Ensamblador') {
          navigate('/dashboard/ensamblador');
        } else if (specialty === 'Comprobador') {
          navigate('/dashboard/comprobador');
        } else if (specialty === 'Mantenimiento') {
          navigate('/dashboard/mantenimiento');
        }
      } else {
        navigate('/dashboard/logistica');
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  return null;
}