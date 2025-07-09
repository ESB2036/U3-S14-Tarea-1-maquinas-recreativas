import { useNavigate } from "react-router-dom";
{/**Este componente muestra la sección de perfil del usuario, incluyendo campos básicos como cédula y nombre, y campos adicionales si se especifican.
  Funcionalidades:
Usa useNavigate de React Router (aunque en este código no se utiliza, solo está importado).
Si user es null, no muestra nada.
Presenta los datos del usuario con estructura de etiquetas <p> y permite personalizar el contenido adicional fácilmente.
  */}
export default function ProfileSection({ user, additionalFields = [] }) {
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <section className="profile-section">
      <h2>Perfil</h2>
      <div>
        <p>
          <strong>Cédula:</strong> {user.ci}
        </p>
        <p>
          <strong>Nombre:</strong> {user.nombre} {user.apellido}
        </p>
        {additionalFields.map((field, index) => (
          <p key={index}>
            <strong>{field.label}:</strong> {field.value}
          </p>
        ))}
      </div>
    </section>
  );
}
