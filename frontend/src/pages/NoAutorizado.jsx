import { Link } from "react-router-dom";
import "./../../css/NoAutorizado.css"; // Asegúrate de importar el archivo CSS

export default function NoAutorizado() {
  return (
    <div className="no-autorizado-container">
      <h1>403 - No Autorizado</h1>
      <p>No tienes permisos para acceder a esta página.</p>
      <Link to="/">Volver al inicio</Link>
    </div>
  );
}
