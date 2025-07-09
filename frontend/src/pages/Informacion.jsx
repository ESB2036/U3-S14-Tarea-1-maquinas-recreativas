import { Link } from "react-router-dom";
import "./../../css/Informacion.css";

export default function Informacion() {
  return (
    <div className="informacion-page">
      <header>
        <h1>Recrea Sys</h1>
        <nav>
          <Link to="/">Volver al inicio</Link>
        </nav>
      </header>

      <div className="informacion-container">
        <div className="informacion-card">
          <h1>Máquinas Recreativas</h1>

          <section className="seccion-informacion">
            <h2>Proceso de Producción</h2>
            <p>
              La compañía para la que está desarrollad esta aplicación web se
              especializa en el montaje, distribución y recaudación de máquinas
              recreativas, las cuales poseen los siguientes componentes:
            </p>
            <ul>
              <li>Placas con la programación de la máquina</li>
              <li>Carcasas para las máquinas</li>
            </ul>
            <p>
              El proceso de ensamblaje es realizado por técnicos calificados,
              seguido de una rigurosa fase de control de calidad.
            </p>
          </section>

          <section className="seccion-informacion">
            <h2>Distribución a Comercios</h2>
            <div className="grid-distribucion">
              <div className="tipo-comercio">
                <h3>Minoristas</h3>
                <p>(Ej: bares, pequeños establecimientos)</p>
                <ul>
                  <li>Colocación de pocas máquinas</li>
                  <li>Pago mensual fijo al establecimiento</li>
                  <li>Recaudación completa para la compañía</li>
                </ul>
              </div>
              <div className="tipo-comercio">
                <h3>Mayoristas</h3>
                <p>(Ej: salas recreativas, grandes establecimientos)</p>
                <ul>
                  <li>Colocación de múltiples máquinas</li>
                  <li>Porcentaje de recaudación pactado</li>
                  <li>Renegociación mensual de términos</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="seccion-informacion">
            <h2>Mantenimiento</h2>
            <p>Nuestro sistema asigna técnicos según:</p>
            <ul>
              <li>
                Carga de trabajo equilibrada (menor cantidad de reparaciones)
              </li>
            </ul>
            <p>
              Las máquinas con fallos recurrentes son retiradas y sus piezas
              útiles reutilizadas.
            </p>
          </section>

          <section className="seccion-informacion">
            <h2>Reportes y Análisis</h2>
            <p>Generamos informes detallados al final de cada período:</p>
            <ul>
              <li>Reportes individualizados por comercio</li>
              <li>Histórico de recaudaciones mensuales</li>
            </ul>
          </section>

          <Link to="/" className="boton-volver">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
