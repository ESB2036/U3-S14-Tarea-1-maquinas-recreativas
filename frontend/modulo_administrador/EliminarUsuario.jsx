export default function EliminarUsuario() {
  const { uuid } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const eliminarUsuario = async () => {
      try {
        const response = await fetch(`/api/administrador/usuarios/${uuid}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al eliminar usuario');
        }

        const data = await response.json();

        if (data.success) {
          // Registrar actividad
          await fetch('/api/historial-actividades', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              descripcion: `El usuario eliminó los datos de un usuario`
            })
          });

          alert('Usuario eliminado correctamente');
          navigate('/admin/gestion-usuarios/consultar-usuarios');
        }
      } catch (err) {
        console.error('Error al eliminar usuario:', err);
        alert(err.message); // Muestra el mensaje de error específico
        navigate('/admin/gestion-usuarios/consultar-usuarios');
      }
    };

    if (window.confirm('¿Está seguro de eliminar este usuario?')) {
      eliminarUsuario();
    } else {
      navigate('/admin/gestion-usuarios/consultar-usuarios');
    }
  }, [uuid, navigate]);

  return null;
}