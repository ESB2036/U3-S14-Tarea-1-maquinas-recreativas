import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ProfileSection from "../../components/ProfileSection";
import NotificacionesList from "../../components/NotificacionesList";
import MaquinaList from "../../components/MaquinaList";
import { AdminHeader } from "../../../modulo_usuario/AdminHeader";
import "../../../css/dashboards.css";
{
  /**
  Este componente React representa una vista del panel de técnico de mantenimiento, donde el usuario puede:
Visualizar su perfil,
Consultar notificaciones relacionadas a mantenimiento de máquinas,
Ver una lista de máquinas asignadas para mantenimiento,
Y finalizar dicho mantenimiento indicando si la máquina queda operativa o necesita ser reensamblada.
 */
}
export default function TecnicoMantenimiento() {
  const [user, setUser] = useState(null);
  const [notificaciones, setNotificaciones] = useState([]);
  const [maquinasMantenimiento, setMaquinasMantenimiento] = useState([]);
  const [selectedMaquina, setSelectedMaquina] = useState(null);
  const [mostrarMensaje, setMostrarMensaje] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [accion, setAccion] = useState("");
  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/");
      return;
    }

    const userData = JSON.parse(storedUser);
    if (
      !storedUser ||
      JSON.parse(storedUser).Especialidad !== "Mantenimiento"
    ) {
      navigate("/");
      return;
    }

    setUser(userData);
    loadData();
  }, [navigate]);
  {
    /**Carga:
Las notificaciones para el usuario técnico (/api/notificaciones_maquina/:id)
Las máquinas asignadas para mantenimiento (/api/maquina/mantenimiento/:id)
  */
  }
  const loadData = async () => {
    try {
      const notifResponse = await fetch(
        `/api/notificaciones_maquina/${
          JSON.parse(localStorage.getItem("user")).ID_Usuario
        }`
      );
      const notifData = await notifResponse.json();
      if (notifData.success) setNotificaciones(notifData.notificaciones);

      const userId = JSON.parse(localStorage.getItem("user")).ID_Usuario;
      const mantResponse = await fetch(`/api/maquina/mantenimiento/${userId}`);
      const mantData = await mantResponse.json();
      if (mantData.success) setMaquinasMantenimiento(mantData.maquinas);
    } catch (err) {
      console.error("Error loading data:", err);
    }
  };

  const handleAccion = async () => {
    if (!selectedMaquina || !accion) return;

    try {
      const response = await fetch("/api/maquina/finalizar-mantenimiento", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idMaquina: selectedMaquina.ID_Maquina,
          idRemitente: user.ID_Usuario,
          exito: accion === "operativa",
          mensaje: mensaje,
        }),
      });

      // Verificar si la respuesta es JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(`Respuesta inesperada: ${text}`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error en la solicitud");
      }

      if (data.success) {
        loadData();
        setSelectedMaquina(null);
        setMostrarMensaje(false);
        setMensaje("");
        setAccion("");
      } else {
        console.error("Error del servidor:", data.message);
      }
    } catch (err) {
      console.error("Error al finalizar mantenimiento:", err);
      // Mostrar mensaje de error al usuario
    }
  };
  {
    /**Si se activa una acción (alta o baja), aparece un modal para ingresar un mensaje y confirmar o cancelar la operación. */
  }
  return (
    <div className="dashboard-container">
      <AdminHeader />
      <div className="dashboard-sections">
        <hr />

        <ProfileSection
          user={user}
          additionalFields={[
            { label: "Especialidad", value: user?.Especialidad },
          ]}
        />

        <NotificacionesList
          notificaciones={notificaciones}
          mostrarNotificaciones={mostrarNotificaciones}
          setMostrarNotificaciones={setMostrarNotificaciones}
          user={user}
        />

        <hr />

        <section className="machines-section">
          <h2>Máquinas Recreativas</h2>

          <MaquinaList
            title="En Mantenimiento"
            maquinas={maquinasMantenimiento}
            selectedMaquina={selectedMaquina}
            onSelectMaquina={setSelectedMaquina}
            initiallyExpanded={false}
            emptyMessage="No hay máquinas para dar mantenimiento..."
            actionButtons={[
              {
                label: "Dar de alta ✅",
                onClick: () => {
                  setAccion("operativa");
                  setMostrarMensaje(true);
                },
                disabled:
                  !selectedMaquina ||
                  !maquinasMantenimiento.some(
                    (m) => m.ID_Maquina === selectedMaquina?.ID_Maquina
                  ),
              },
              {
                label: "Dar de baja ❌",
                onClick: () => {
                  setAccion("reensamblar");
                  setMostrarMensaje(true);
                },
                disabled:
                  !selectedMaquina ||
                  !maquinasMantenimiento.some(
                    (m) => m.ID_Maquina === selectedMaquina?.ID_Maquina
                  ),
              },
            ]}
          />

          {mostrarMensaje && (
            <div className="message-modal">
              <h3>Mensaje para logística</h3>
              <textarea
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                placeholder="Escribe un mensaje..."
              />
              <div className="modal-actions">
                <button
                  onClick={() => {
                    setMostrarMensaje(false);
                    setMensaje("");
                    setAccion("");
                  }}
                >
                  Cancelar
                </button>

                <button onClick={handleAccion}>Enviar</button>
              </div>
            </div>
          )}
        </section>
        <section className="actions-section">
          <h2>Acciones</h2>
          <button
            onClick={() =>
              navigate("/logistica/consultar-informe-distribucion")
            }
          >
            Consultar Informes de Distribución
          </button>
        </section>
      </div>
    </div>
  );
}
