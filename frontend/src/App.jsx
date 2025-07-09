import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import Main from "./pages/Main";
import Login from "./Autenticacion/Login";
import Registrar from "./Autenticacion/Registrar";
import Logistico from "./pages/dashboard/Logistico";
import TecnicoEnsamblador from "./pages/dashboard/TecnicoEnsamblador";
import TecnicoComprobador from "./pages/dashboard/TecnicoComprobador";
import TecnicoMantenimiento from "./pages/dashboard/TecnicoMantenimiento";
import Contabilidad from "../modulo_contabilidad/mainContabilidad";
import Administrador from "../modulo_administrador/mainAdministrador";
import ActualizarPerfil from "../modulo_usuario/ActualizarPerfil";
import MenuPerfil from "../modulo_usuario/MenuPerfil";
import RecuperarContrasena from "../modulo_usuario/RecuperarContrasena";
import ActualizarUsuario from "../modulo_usuario/ActualizarUsuario";
import EditarUsuario from "../modulo_administrador/EditarUsuario";
import RegistrarUsuarioAdmin from "../modulo_administrador/RegistrarUsuarioAdmin";
import ConsultarUsuarios from "../modulo_administrador/ConsultarUsuario";
import ConsultarInformeDistribucion from "../modulo_contabilidad/ConsultarInformeDistribucion";
import LevantarInformeRecaudacion from "../modulo_contabilidad/LevantarInformeRecaudacion";
import Componentes from "../modulo_componente/Componentes";
import GestionUsuarios from "../modulo_administrador/GestionUsuarios";
import EliminarUsuario from "../modulo_administrador/EliminarUsuario";
import RecuperarUsuario from "../modulo_usuario/RecuperarUsuario";
import NoAutorizado from "./pages/NoAutorizado";
import GestionReportes from "../modulo_reporte/GestionReportes";
import ChatUsuarios from "../modulo_reporte/ChatUsuarios";
import AccesoRestringido from "./pages/AccesoRestringido";
import GestionRecaudacion from "../modulo_contabilidad/GestionRecaudacion";
import RegistrarRecaudacion from "../modulo_contabilidad/RegistrarRecaudacion";
import EliminarRecaudacion from "../modulo_contabilidad/ConsultarRecaudacion";
import ConsultarRecaudacion from "../modulo_contabilidad/ConsultarRecaudacion";
import ActualizarRecaudacion from "../modulo_contabilidad/ActualizarRecaudacion";
import Informacion from "./pages/Informacion.jsx";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Registrar />} />
          <Route path="/main" element={<Main />} />
          <Route path="/informacion" element={<Informacion />} />
          <Route path="/no-autorizado" element={<NoAutorizado />} />
          <Route path="/acceso-restringido" element={<AccesoRestringido />} />
          <Route path="/componentes" element={<Componentes />} />

          {/* Dashboards */}
          <Route
            path="/dashboard/logistica"
            element={
              <PrivateRoute allowedRoles={["Logistica"]}>
                <Logistico />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard/ensamblador"
            element={
              <PrivateRoute allowedRoles={["Tecnico"]}>
                <TecnicoEnsamblador />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard/comprobador"
            element={
              <PrivateRoute allowedRoles={["Tecnico"]}>
                <TecnicoComprobador />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard/mantenimiento"
            element={
              <PrivateRoute allowedRoles={["Tecnico"]}>
                <TecnicoMantenimiento />
              </PrivateRoute>
            }
          />
          <Route
            path="/logistica/consultar-informe-distribucion"
            element={
              <PrivateRoute allowedRoles={["Logistica", "Tecnico"]}>
                <ConsultarInformeDistribucion />
              </PrivateRoute>
            }
          />

          <Route
            path="/contabilidad"
            element={
              <PrivateRoute allowedRoles={["Contabilidad"]}>
                <Contabilidad />
              </PrivateRoute>
            }
          />

          {/* Módulo de usuario */}
          <Route
            path="/usuario/perfil"
            element={
              <PrivateRoute
                allowedRoles={[
                  "Administrador",
                  "Contabilidad",
                  "Logistica",
                  "Tecnico",
                ]}
              >
                <MenuPerfil />
              </PrivateRoute>
            }
          />
          <Route
            path="/usuario/actualizar-perfil"
            element={
              <PrivateRoute
                allowedRoles={[
                  "Administrador",
                  "Contabilidad",
                  "Logistica",
                  "Tecnico",
                ]}
              >
                <ActualizarPerfil />
              </PrivateRoute>
            }
          />
          <Route
            path="/usuario/recuperar-contrasena"
            element={<RecuperarContrasena />}
          />
          <Route
            path="/usuario/actualizar-usuario"
            element={<ActualizarUsuario />}
          />
          <Route
            path="/usuario/recuperar-usuario"
            element={<RecuperarUsuario />}
          />

          {/* Módulo de Administración */}
          <Route
            path="/dashboard/admin"
            element={
              <PrivateRoute allowedRoles={["Administrador"]}>
                <Administrador />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/gestion-usuarios"
            element={
              <PrivateRoute allowedRoles={["Administrador"]}>
                <GestionUsuarios />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/gestion-usuarios/registrar-usuario"
            element={
              <PrivateRoute allowedRoles={["Administrador"]}>
                <RegistrarUsuarioAdmin />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/gestion-usuarios/editar-usuario/:uuid"
            element={
              <PrivateRoute allowedRoles={["Administrador"]}>
                <EditarUsuario modo="actualizar" />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/gestion-usuarios/editar-estado-usuario/:uuid"
            element={
              <PrivateRoute allowedRoles={["Administrador"]}>
                <EditarUsuario modo="estado" />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/gestion-usuarios/consultar-usuarios"
            element={
              <PrivateRoute allowedRoles={["Administrador"]}>
                <ConsultarUsuarios />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/gestion-usuarios/eliminar-usuario/:uuid"
            element={
              <PrivateRoute allowedRoles={["Administrador"]}>
                <EliminarUsuario />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin/gestion-usuarios/consultar-usuarios/actividad/historial-actividades"
            element={
              <PrivateRoute allowedRoles={["Administrador"]}>
                <ConsultarUsuarios />
              </PrivateRoute>
            }
          />

          <Route
            path="/contabilidad/gestion-recaudacion"
            element={
              <PrivateRoute allowedRoles={["Contabilidad"]}>
                <GestionRecaudacion />
              </PrivateRoute>
            }
          />
          <Route
            path="/contabilidad/registrar-recaudacion"
            element={
              <PrivateRoute allowedRoles={["Contabilidad"]}>
                <RegistrarRecaudacion />
              </PrivateRoute>
            }
          />
          <Route
            path="/contabilidad/consultar-recaudaciones"
            element={
              <PrivateRoute allowedRoles={["Contabilidad"]}>
                <ConsultarRecaudacion />
              </PrivateRoute>
            }
          />
          <Route
            path="/contabilidad/actualizar-recaudacion/:uuid"
            element={
              <PrivateRoute allowedRoles={["Contabilidad"]}>
                <ActualizarRecaudacion />
              </PrivateRoute>
            }
          />
          <Route
            path="/contabilidad/eliminar-recaudacion/:uuid"
            element={
              <PrivateRoute allowedRoles={["Contabilidad"]}>
                <EliminarRecaudacion />
              </PrivateRoute>
            }
          />
          <Route
            path="/contabilidad/levantar-informe/:idRecaudacion"
            element={
              <PrivateRoute allowedRoles={["Contabilidad"]}>
                <LevantarInformeRecaudacion />
              </PrivateRoute>
            }
          />
          {/* Ruta para el chat de usuarios */}
          <Route
            path="/reportes/chat/:reporteUuid?"
            element={
              <PrivateRoute
                allowedRoles={[
                  "Administrador",
                  "Contabilidad",
                  "Logistica",
                  "Tecnico",
                  "Usuario",
                ]}
              >
                <ChatUsuarios />
              </PrivateRoute>
            }
          />
          <Route
            path="/reportes/chat/:emisorUuid/:destinatarioUuid"
            element={
              <PrivateRoute
                allowedRoles={[
                  "Administrador",
                  "Contabilidad",
                  "Logistica",
                  "Tecnico",
                  "Usuario",
                ]}
              >
                <ChatUsuarios />
              </PrivateRoute>
            }
          />
          <Route
            path="/reportes/gestion"
            element={
              <PrivateRoute
                allowedRoles={[
                  "Administrador",
                  "Contabilidad",
                  "Logistica",
                  "Tecnico",
                  "Usuario",
                ]}
              >
                <GestionReportes />
              </PrivateRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
