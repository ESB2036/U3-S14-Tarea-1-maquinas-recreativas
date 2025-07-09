import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Modal from "react-modal";
import "../css/modulo_contabilidad/recaudacion.css";
import { AdminHeader } from "../modulo_usuario/AdminHeader";

Modal.setAppElement("#root");

export default function LevantarInformeRecaudacion() {
  const { idRecaudacion } = useParams();
  const [user, setUser] = useState(null);
  const [recaudacion, setRecaudacion] = useState(null);
  const [maquina, setMaquina] = useState(null);
  const [comercio, setComercio] = useState(null);
  const [tecnicos, setTecnicos] = useState({
    ensamblador: null,
    comprobador: null,
    mantenimiento: null,
  });
  const [machineComponents, setMachineComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));

    fetchRecaudacionData();
  }, [idRecaudacion]);

  const fetchRecaudacionData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch recaudación data
      const recRes = await fetch(
        `/api/contabilidad/recaudaciones/${idRecaudacion}`
      );
      if (!recRes.ok) throw new Error("Error al obtener datos de recaudación");
      const recData = await recRes.json();

      if (!recData.success || !recData.recaudacion) {
        throw new Error("Recaudación no encontrada");
      }

      setRecaudacion(recData.recaudacion);

      // Fetch máquina data
      const maqRes = await fetch(
        `/api/contabilidad/maquina-recaudacion?ID_Maquina=${recData.recaudacion.ID_Maquina}`
      );
      if (!maqRes.ok) throw new Error("Error al obtener datos de la máquina");
      const maqData = await maqRes.json();
      setMaquina(maqData.maquina);

      // Fetch comercio data
      const comRes = await fetch(
        `/api/contabilidad/comercio-recaudacion/${maqData.maquina.ID_Comercio}`
      );
      if (!comRes.ok) throw new Error("Error al obtener datos del comercio");
      const comData = await comRes.json();

      if (!comData.success || !comData.comercio) {
        throw new Error("Comercio no encontrado");
      }

      setComercio(comData.comercio);

      // Fetch técnicos
      const ensambladorRes = await fetch(
        `/api/usuario/profile/${maqData.maquina.ID_Tecnico_Ensamblador}`,
        {
          credentials: "include",
        }
      );
      const comprobadorRes = await fetch(
        `/api/usuario/profile/${maqData.maquina.ID_Tecnico_Comprobador}`,
        {
          credentials: "include",
        }
      );

      const ensamblador = await ensambladorRes.json();
      const comprobador = await comprobadorRes.json();

      let mantenimiento = null;
      if (maqData.maquina.ID_Tecnico_Mantenimiento) {
        const mantenimientoRes = await fetch(
          `/api/usuario/profile/${maqData.maquina.ID_Tecnico_Mantenimiento}`,
          {
            credentials: "include",
          }
        );
        mantenimiento = await mantenimientoRes.json();
      }

      setTecnicos({
        ensamblador: ensamblador.usuario,
        comprobador: comprobador.usuario,
        mantenimiento: mantenimiento?.usuario || null,
      });

      // Fetch componentes
      const componentesRes = await fetch(
        `/api/maquina/componentes/${recData.recaudacion.ID_Maquina}`
      );
      const componentesData = await componentesRes.json();
      setMachineComponents(componentesData.componentes || []);
    } catch (error) {
      console.error("Error fetching report data:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintInforme = () => {
    setTimeout(() => window.print(), 300);
  };

  const handleSaveInforme = async () => {
    try {
      if (!idRecaudacion) {
        setError("ID de recaudación no válido");
        return;
      }

      const response = await fetch("/api/contabilidad/guardar-informe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ID_Recaudacion: idRecaudacion,
          ID_Comercio: comercio.ID_Comercio,
          CI_Usuario: user?.ci ?? "",
          Nombre_Maquina: maquina.Nombre_Maquina,
          Nombre_Comercio: comercio.Nombre,
          Direccion_Comercio: comercio.Direccion,
          Telefono_Comercio: comercio.Telefono,
          Pago_Ensamblador: 400.0,
          Pago_Comprobador: 400.0,
          Pago_Mantenimiento: tecnicos.mantenimiento ? 400.0 : null,
          componentes: machineComponents.map((c) => ({
            ID_Componente: c.ID_Componente,
          })),
          Monto_Total: recaudacion.Monto_Total,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al guardar el informe");
      }

      setSuccess("Informe guardado correctamente");
    } catch (error) {
      console.error("Error saving report:", error);
      setError(error.message || "Error al guardar el informe");
    }
  };

  const totalComponentes = machineComponents.reduce(
    (sum, comp) => sum + parseFloat(comp.precio || 0),
    0
  );

  if (loading) {
    return (
      <div className="recaudacion-container">
        <AdminHeader />
        <h2>Levantar Informe de Recaudación</h2>
        <p>Cargando datos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="recaudacion-container">
        <AdminHeader />
        <h2>Levantar Informe de Recaudación</h2>
        <div className="alert alert-danger">{error}</div>
        <button onClick={() => navigate(-1)}>Volver</button>
      </div>
    );
  }

  if (
    !recaudacion?.ID_Recaudacion ||
    !maquina?.ID_Maquina ||
    !comercio?.ID_Comercio
  ) {
    return (
      <div className="recaudacion-container">
        <AdminHeader />
        <h2>Levantar Informe de Recaudación</h2>
        <div className="alert alert-danger">
          No se encontraron datos para esta recaudación
        </div>
        <button onClick={() => navigate(-1)}>Volver</button>
      </div>
    );
  }

  return (
    <div className="recaudacion-container">
      <AdminHeader />
      <h2>Informe de Recaudación</h2>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="informe-content">
        <div className="informe-section">
          <h3>Datos del Comercio</h3>
          <p>
            <strong>Nombre:</strong> {comercio.Nombre}
          </p>
          <p>
            <strong>Dirección:</strong> {comercio.Direccion}
          </p>
          <p>
            <strong>Teléfono:</strong> {comercio.Telefono}
          </p>
          <p>
            <strong>Tipo:</strong> {comercio.Tipo}
          </p>
        </div>

        <div className="informe-section">
          <h3>Datos de la Recaudación</h3>
          <p>
            <strong>Máquina:</strong> {maquina.Nombre_Maquina}
          </p>
          <p>
            <strong>Monto Total:</strong> ${recaudacion.Monto_Total}
          </p>
          <p>
            <strong>Monto Empresa:</strong> ${recaudacion.Monto_Empresa}
          </p>
          {recaudacion.Tipo_Comercio === "Mayorista" && (
            <p>
              <strong>Monto Comercio:</strong> ${recaudacion.Monto_Comercio} (
              {recaudacion.Porcentaje_Comercio}%)
            </p>
          )}
          <p>
            <strong>Fecha:</strong>{" "}
            {new Date(recaudacion.fecha).toLocaleString()}
          </p>
          <p>
            <strong>Detalles:</strong> {recaudacion.detalle || "Ninguno"}
          </p>
        </div>

        <div className="informe-section">
          <h3>Técnicos Involucrados</h3>
          <div className="tecnico-info">
            <h4>Ensamblador</h4>
            <p>
              <strong>Nombre:</strong> {tecnicos.ensamblador?.nombre}{" "}
              {tecnicos.ensamblador?.apellido}
            </p>
            <p>
              <strong>CI:</strong> {tecnicos.ensamblador?.ci}
            </p>
            <p>
              <strong>Pago:</strong> $400.00
            </p>
          </div>

          <div className="tecnico-info">
            <h4>Comprobador</h4>
            <p>
              <strong>Nombre:</strong> {tecnicos.comprobador?.nombre}{" "}
              {tecnicos.comprobador?.apellido}
            </p>
            <p>
              <strong>CI:</strong> {tecnicos.comprobador?.ci}
            </p>
            <p>
              <strong>Pago:</strong> $400.00
            </p>
          </div>

          {tecnicos.mantenimiento && (
            <div className="tecnico-info">
              <h4>Técnico de Mantenimiento</h4>
              <p>
                <strong>Nombre:</strong> {tecnicos.mantenimiento?.nombre}{" "}
                {tecnicos.mantenimiento?.apellido}
              </p>
              <p>
                <strong>CI:</strong> {tecnicos.mantenimiento?.ci}
              </p>
              <p>
                <strong>Pago:</strong> $400.00
              </p>
            </div>
          )}
        </div>

        <div className="informe-section">
          <h3>Componentes Utilizados</h3>
          {machineComponents.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Componente</th>
                  <th>Tipo</th>
                  <th>Precio</th>
                </tr>
              </thead>
              <tbody>
                {machineComponents.map((comp, index) => (
                  <tr key={index}>
                    <td>{comp.nombre}</td>
                    <td>{comp.tipo}</td>
                    <td>{comp.precio}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="2">
                    <strong>Total componentes:</strong>
                  </td>
                  <td>
                    <strong>${totalComponentes.toFixed(2)}</strong>
                  </td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <p>No se utilizaron componentes en esta máquina</p>
          )}
        </div>

        <div className="informe-totals">
          <h3>Totales</h3>
          <p>
            <strong>Total recaudado:</strong> ${recaudacion.Monto_Total}
          </p>
          <p>
            <strong>Total pagos a técnicos:</strong> $
            {400 * 2 + (tecnicos.mantenimiento ? 400 : 0)}.00
          </p>
          <p>
            <strong>Total componentes:</strong> ${totalComponentes.toFixed(2)}
          </p>
          <p className="grand-total">
            <strong>Total neto para la empresa:</strong>$
            {(
              parseFloat(recaudacion.Monto_Empresa) -
              400 * 2 -
              (tecnicos.mantenimiento ? 400 : 0) -
              totalComponentes
            ).toFixed(2)}
          </p>
        </div>

        <div className="informe-footer">
          <p>
            <strong>Empresa:</strong> recrea Sys S.A.
          </p>
          <p>
            <strong>Descripción:</strong> Una empresa encargada en el ciclo de
            vida de las maquinas recreativas
          </p>
          <p>
            <strong>Fecha de emisión:</strong> {new Date().toLocaleString()}
          </p>
        </div>

        <div className="informe-actions">
          <button onClick={handlePrintInforme} className="btn btn-primary">
            Imprimir Informe
          </button>
          <button onClick={handleSaveInforme} className="btn btn-success">
            Guardar Informe
          </button>
          <button onClick={() => navigate(-1)} className="btn btn-secondary">
            Volver
          </button>
        </div>
      </div>
    </div>
  );
}
