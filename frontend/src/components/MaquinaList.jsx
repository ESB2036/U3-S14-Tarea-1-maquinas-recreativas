import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function MaquinaList({
  title,
  maquinas,
  selectedMaquina,
  onSelectMaquina,
  emptyMessage = "No hay máquinas...",
  initiallyExpanded = false,
  actionButtons = [],
}) {
  const user = JSON.parse(localStorage.getItem("user"));
  const esComprobador = user?.Especialidad === "Comprobador";
  const esLogistico = user?.tipo === "Logistica";

  const [mostrarMaquinas, setMostrarMaquinas] = useState(initiallyExpanded);
  const navigate = useNavigate();

  const handleOpenComponentCatalog = () => {
    if (!selectedMaquina) return;
    localStorage.setItem("selectedMachine", JSON.stringify(selectedMaquina));
    navigate("/componentes");
  };

  return (
    <div className="machine-list">
      <h3
        style={{ cursor: "pointer" }}
        onClick={() => setMostrarMaquinas(!mostrarMaquinas)}
      >
        {title} {mostrarMaquinas ? "🔽" : "▶️"}
      </h3>
      {mostrarMaquinas &&
        (maquinas.length > 0 ? (
          <>
            <ul>
              {maquinas.map((maquina) => (
                <li
                  key={maquina.ID_Maquina}
                  className={
                    "li-maquina " +
                    (selectedMaquina?.ID_Maquina === maquina.ID_Maquina
                      ? "selected"
                      : "")
                  }
                  onClick={() => onSelectMaquina(maquina)}
                >
                  <span className="li-maquina-content">
                    <strong>{maquina.Nombre_Maquina}</strong>
                    <br />
                    <span className="span-comercio-details">
                      <strong>Comercio:</strong> {maquina.NombreComercio}
                    </span>
                    <span className="span-comercio-details">
                      <strong>Dirección:</strong> {maquina.DireccionComercio}
                    </span>
                  </span>
                </li>
              ))}
            </ul>

            {!esComprobador && !esLogistico && (
              <button
                onClick={handleOpenComponentCatalog}
                disabled={!selectedMaquina}
              >
                Usar componentes
              </button>
            )}

            {actionButtons.map((button, index) => (
              <button
                key={index}
                onClick={button.onClick}
                disabled={!selectedMaquina || button.disabled}
                style={button.style}
              >
                {button.label}
              </button>
            ))}
          </>
        ) : (
          <p>{emptyMessage}</p>
        ))}
    </div>
  );
}
