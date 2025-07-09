import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ProfileSection from "../../components/ProfileSection";
import NotificacionesList from "../../components/NotificacionesList";
import MaquinaList from "../../components/MaquinaList";
import { AdminHeader } from "../../../modulo_usuario/AdminHeader";
import "../../../css/dashboards.css";
// es un componente React funcional que representa la vista de dashboard para un usuario con especialidad de "Ensamblador". Este usuario puede ver su perfil, notificaciones y listas de máquinas recreativas que están en proceso de ensamblado o reensamblado. Además, permite seleccionar una máquina y enviarla a "comprobación".
export default function TecnicoEnsamblador() {
  const [user, setUser] = useState(null);
  const [notificaciones, setNotificaciones] = useState([]);
  const [maquinasEnsamblando, setMaquinasEnsamblando] = useState([]);
  const [maquinasReensamblando, setMaquinasReensamblando] = useState([]);
  const [selectedMaquina, setSelectedMaquina] = useState(null);
  const [mostrarMensaje, setMostrarMensaje] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false);
  const [mostrarMaquinas, setMostrarMaquinas] = useState(false);
  const navigate = useNavigate();
  {
    /**Se ejecuta al montar el componente para:
Verificar si hay un usuario en localStorage.
Redirigir al inicio ("/") si no hay usuario o si no tiene la especialidad "Ensamblador".
Cargar los datos iniciales (notificaciones y máquinas). */
  }
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/");
      return;
    }

    const userData = JSON.parse(storedUser);
    if (!storedUser || JSON.parse(storedUser).Especialidad !== "Ensamblador") {
      navigate("/");
      return;
    }

    setUser(userData);
    loadData();
  }, [navigate]);
  {
    /**Carga desde el backend:
Las notificaciones del usuario.
Las máquinas que están "Ensamblándose" y "Reensamblándose". */
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

      const ensResponse = await fetch(`/api/maquina/ensamblador/${userId}`);
      const ensData = await ensResponse.json();
      if (ensData.success)
        setMaquinasEnsamblando(
          ensData.maquinas.filter((m) => m.Estado === "Ensamblandose")
        );

      const reensResponse = await fetch(`/api/maquina/ensamblador/${userId}`);
      const reensData = await reensResponse.json();
      if (reensData.success)
        setMaquinasReensamblando(
          reensData.maquinas.filter((m) => m.Estado === "Reensamblandose")
        );
    } catch (err) {
      console.error("Error loading data:", err);
    }
  };
  {
    /**Enviar una máquina seleccionada a comprobación.
Acción: Envía un POST con el ID de la máquina, ID del usuario y un mensaje al endpoint /api/maquina/mandar-comprobacion. */
  }
  const handleMandarComprobacion = async () => {
    if (!selectedMaquina) return;

    try {
      const response = await fetch("/api/maquina/mandar-comprobacion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idMaquina: selectedMaquina.ID_Maquina,
          idRemitente: user.ID_Usuario,
          mensaje: mensaje,
        }),
      });

      const data = await response.json();
      if (data.success) {
        loadData();
        setSelectedMaquina(null);
        setMostrarMensaje(false);
        setMensaje("");
      }
    } catch (err) {
      console.error("Error al mandar a comprobacion:", err);
    }
  };

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
            mostrarMaquinas={mostrarMaquinas}
            setMostrarMaquinas={setMostrarMaquinas}
            title="Ensamblando"
            maquinas={maquinasEnsamblando}
            selectedMaquina={selectedMaquina}
            onSelectMaquina={setSelectedMaquina}
            initiallyExpanded={false}
            emptyMessage="No hay máquinas para ensamblar..."
            actionButtons={[
              {
                label: "Mandar a comprobación ✅",
                onClick: () => setMostrarMensaje(true),
                disabled:
                  !selectedMaquina ||
                  !maquinasEnsamblando.some(
                    (m) => m.ID_Maquina === selectedMaquina?.ID_Maquina
                  ),
              },
            ]}
          />
          {/** Dos listas: una para máquinas ensambladas y otra para reensambladas.
Permite seleccionar una máquina y activar un botón para mandarla a comprobación.
Se usa un modal (mostrarMensaje) para redactar un mensaje antes de enviar.*/}
          {/* Reensamblando */}
          <MaquinaList
            title="Reensamblando"
            maquinas={maquinasReensamblando}
            selectedMaquina={selectedMaquina}
            onSelectMaquina={setSelectedMaquina}
            initiallyExpanded={false}
            emptyMessage="No hay máquinas para reensamblar..."
            actionButtons={[
              {
                label: "Mandar a comprobación ✅",
                onClick: () => setMostrarMensaje(true),
                disabled:
                  !selectedMaquina ||
                  !maquinasReensamblando.some(
                    (m) => m.ID_Maquina === selectedMaquina?.ID_Maquina
                  ),
              },
            ]}
          />

          {mostrarMensaje && (
            <div className="message-modal">
              <h3>Mensaje para el técnico comprobador</h3>
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
                  }}
                >
                  Cancelar
                </button>

                <button onClick={handleMandarComprobacion}>Enviar</button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
