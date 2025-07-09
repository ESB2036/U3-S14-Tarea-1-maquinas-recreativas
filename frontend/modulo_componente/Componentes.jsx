import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminHeader } from "../modulo_usuario/AdminHeader";
import "../css/modulo_componente/componente.css";

export default function Componentes() {
  const [componentes, setComponentes] = useState([]);
  const [componentesEnUso, setComponentesEnUso] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tipoTecnico, setTipoTecnico] = useState("");
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [user, setUser] = useState(null);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
  });

  const navigate = useNavigate();

  const fetchComponentesEnUso = async (userId, machineId = null) => {
    try {
      let url = `/api/componentes/en-uso/${userId}`;
      if (machineId) {
        url += `?id_maquina=${machineId}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok || !data.success) {
        console.error("Error al cargar componentes:", data.message);
        return [];
      }

      // Asegurarnos de que siempre trabajamos con un array
      const componentesData = Array.isArray(data.componentes)
        ? data.componentes
        : [];

      // Filtrar por máquina si es necesario
      return componentesData.filter((comp) => {
        const isNotLiberado = comp.estado_uso !== "Liberado";
        const matchesMachine = !machineId || comp.ID_Maquina == machineId;
        return isNotLiberado && matchesMachine;
      });
    } catch (err) {
      console.error("Error al cargar componentes en uso:", err);
      return [];
    }
  };

  useEffect(() => {
    const localUser = JSON.parse(localStorage.getItem("user"));
    if (!localUser) {
      navigate("/login");
      return;
    }
    setUser(localUser);
    setTipoTecnico(localUser.Especialidad || "");

    const machine = JSON.parse(localStorage.getItem("selectedMachine"));
    setSelectedMachine(machine);

    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/componentes?tipo=${localUser.Especialidad}&limit=${pagination.itemsPerPage}&page=${pagination.currentPage}`
        );
        const data = await res.json();

        if (data.success) {
          setComponentes(data.componentes);
          setPagination((prev) => ({
            ...prev,
            totalItems: data.total,
          }));
        } else {
          throw new Error(
            data.message || "Error al cargar componentes disponibles"
          );
        }

        const componentesUso = await fetchComponentesEnUso(
          localUser.ID_Usuario,
          machine?.ID_Maquina
        );
        setComponentesEnUso(componentesUso);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, refreshKey, pagination.currentPage, pagination.itemsPerPage]);

  const handleUsarComponente = async (idComponente) => {
    try {
      if (!selectedMachine) {
        alert("Por favor, seleccione una máquina primero");
        return;
      }

      const response = await fetch("/api/componentes/usar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ID_Componente: idComponente,
          ID_Usuario: user.ID_Usuario,
          ID_Maquina: selectedMachine.ID_Maquina,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Error al usar componente");
      }

      // Actualizar la lista de componentes en uso
      const updatedComponentesEnUso = await fetchComponentesEnUso(
        user.ID_Usuario
      );
      setComponentesEnUso(updatedComponentesEnUso);

      // Actualizar la lista de componentes disponibles
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error("Error al usar componente:", err);
      alert(err.message);
    }
  };

  const handleLiberarComponente = async (idComponente) => {
    try {
      const response = await fetch("/api/componentes/liberar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ID_Componente: idComponente,
          ID_Usuario: user.ID_Usuario,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Error al liberar componente");
      }

      // Actualizar la lista de componentes en uso
      const updatedComponentesEnUso = await fetchComponentesEnUso(
        user.ID_Usuario,
        selectedMachine?.ID_Maquina
      );
      setComponentesEnUso(updatedComponentesEnUso);

      // Actualizar la lista de componentes disponibles
      setRefreshKey((prev) => prev + 1);

      // Mostrar mensaje de éxito
      alert(data.message || "Componente liberado correctamente");
    } catch (err) {
      console.error("Error al liberar componente:", err);
      alert(err.message || "Ocurrió un error al liberar el componente");
    }
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, currentPage: newPage }));
  };

  const handleItemsPerPageChange = (e) => {
    setPagination((prev) => ({
      ...prev,
      itemsPerPage: parseInt(e.target.value),
      currentPage: 1,
    }));
  };

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="componentes-container">
      <AdminHeader />
      <div className="dashboard-sections">
        <h2>Componentes disponibles - Técnico: {tipoTecnico}</h2>

        {selectedMachine && (
          <div className="selected-machine-info">
            <h3>Máquina: {selectedMachine.Nombre_Maquina}</h3>
            <p>Comercio: {selectedMachine.NombreComercio}</p>
          </div>
        )}

        <button onClick={() => navigate(-1)}>Regresar</button>

        <div className="componentes-section">
          <h3>Componentes Disponibles</h3>

          <div className="pagination-controls">
            <label>
              Mostrar:
              <select
                value={pagination.itemsPerPage}
                onChange={handleItemsPerPageChange}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </label>
          </div>

          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Precio</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {componentes.map((comp) => (
                <tr key={comp.ID_Componente}>
                  <td>{comp.ID_Componente}</td>
                  <td>{comp.nombre}</td>
                  <td>{comp.tipo}</td>
                  <td>${Number(comp.precio).toFixed(2)}</td>
                  <td>
                    {!componentesEnUso.some(
                      (c) => c.ID_Componente === comp.ID_Componente
                    ) && (
                      <button
                        onClick={() => handleUsarComponente(comp.ID_Componente)}
                        disabled={!selectedMachine}
                      >
                        Usar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination-controls">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
            >
              Anterior
            </button>
            <span>
              Página {pagination.currentPage} de{" "}
              {Math.ceil(pagination.totalItems / pagination.itemsPerPage)}
            </span>
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={
                pagination.currentPage * pagination.itemsPerPage >=
                pagination.totalItems
              }
            >
              Siguiente
            </button>
          </div>
        </div>

        <div className="componentes-en-uso-section">
          <h3>
            Componentes en Uso{" "}
            {selectedMachine && `- Máquina: ${selectedMachine.Nombre_Maquina}`}
          </h3>
          {componentesEnUso.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Máquina</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {componentesEnUso.map((comp) => (
                  <tr
                    key={`${comp.ID_Componente}-${
                      comp.ID_Maquina || "no-machine"
                    }`}
                  >
                    <td>{comp.ID_Componente}</td>
                    <td>{comp.nombre}</td>
                    <td>{comp.tipo}</td>
                    <td>{comp.Nombre_Maquina || "N/A"}</td>
                    <td>{comp.estado_uso}</td>
                    <td>
                      <button
                        onClick={() =>
                          handleLiberarComponente(comp.ID_Componente)
                        }
                        title="Liberar componente"
                      >
                        Liberar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>
              No hay componentes en uso actualmente{" "}
              {selectedMachine &&
                `para la máquina ${selectedMachine.Nombre_Maquina}`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
