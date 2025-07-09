import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../../css/modulo_usuario/main.css";
import Chatbot from "../components/Chatbot";
// Este componente React maneja el proceso de inicio de sesión de usuarios.
// Realiza validaciones básicas del formulario, envía una solicitud de autenticación al servidor y redirige al usuario según su tipo y estado.

// Excepción personalizada para credenciales incorrectas:
class CredencialesIncorrectasError extends Error {
  constructor(message = "¡Credenciales incorrectas OwO!") {
    super(message);
    this.name = "CredencialesIncorrectasError";
  }
}

export default function Login() {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    usuario_asignado: "",
    contrasena: "",
  });
  const [loading, setLoading] = useState(false);
  const { setCurrentUser } = useAuth();
  const [showChatbot, setShowChatbot] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  {
    /**valida los campos del formulario, envía los datos al backend (/api/usuario/login), y según la respuesta:
     * Guarda los datos del usuario en localStorage.
     * Actualiza el contexto con setCurrentUser.
     * Redirige al dashboard correspondiente con navigate, según el tipo y estado del usuario (Tecnico, Logistica, Administrador del sistema, etc.). */
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validaciones iniciales
    if (!formData.usuario_asignado || formData.usuario_asignado.length > 15) {
      setError("Usuario inválido (máximo 15 caracteres)");
      setLoading(false);
      return;
    }

    if (!formData.contrasena) {
      setError("La contraseña no puede estar vacía");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/usuario/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuario_asignado: formData.usuario_asignado.trim(),
          contrasena: formData.contrasena,
        }),
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.message === "Usuario o contraseña incorrectos") {
          throw new CredencialesIncorrectasError();
        }
        throw new Error(result.message || "Error al iniciar sesión");
      }

      if (!result.success) {
        if (result.message === "Usuario o contraseña incorrectos") {
          throw new CredencialesIncorrectasError();
        }
        throw new Error(result.message || "Error desconocido");
      }

      const userData = {
        ...result.usuario,
        ID_Usuario: result.usuario.ID_Usuario,
        fecha_inicio: result.fecha_inicio,
      };

      localStorage.setItem("user", JSON.stringify(userData));
      setCurrentUser(userData);

      if (userData.estado === "Pendiente de asignacion") {
        // For pending assignment, create automatic report and redirect
        await createInactiveUserReport(userData);

        navigate("/reportes", {
          state: {
            userData,
            message:
              "Su cuenta está pendiente de asignación. Por favor contacte al administrador.",
          },
        });
      } else if (userData.estado === "Inhabilitado") {
        navigate("/reportes/gestion", {
          state: {
            userData,
            //message: "Su cuenta está inhabilitada. Por favor redacte un mensaje al administrador solicitando la reactivación de su cuenta.",
            isDisabledUser: true, // Flag to indicate this is a disabled user flow
          },
        });
      } else {
        // Active users proceed normally
        redirectUser(userData);
      }
    } catch (err) {
      if (err instanceof CredencialesIncorrectasError) {
        setError(err.message);
      } else {
        setError(err.message || "Error de conexión con el servidor");
      }
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };
  const createInactiveUserReport = async (userData) => {
    try {
      // Only create report for pending users, not for disabled users
      if (userData.estado === "Pendiente de asignacion") {
        const adminsResponse = await fetch(
          "/api/usuarios/por-tipo?tipo=Administrador"
        );
        const adminsData = await adminsResponse.json();

        if (adminsData.success && adminsData.usuarios.length > 0) {
          const admin = adminsData.usuarios[0]; // Get first admin

          await fetch("/api/reportes/crear", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ID_Usuario_Emisor: userData.ID_Usuario,
              ID_Usuario_Destinatario: admin.ID_Usuario,
              descripcion: `Usuario con estado ${userData.estado} intentó iniciar sesión. Por favor revisar.`,
            }),
          });
        }
      }
    } catch (error) {
      console.error("Error creating report:", error);
    }
  };
  const redirectUser = (userData) => {
    const userType = userData.tipo === "Técnico" ? "Tecnico" : userData.tipo;

    switch (userType) {
      case "Logistica":
        navigate("/dashboard/logistica", {
          state: { userId: userData.ID_Usuario },
        });
        break;
      case "Tecnico":
        if (userData.Especialidad) {
          const path = `/dashboard/${userData.Especialidad.toLowerCase()}`;
          navigate(path, { state: { userId: userData.ID_Usuario } });
        } else {
          navigate("/dashboard/tecnico", {
            state: { userId: userData.ID_Usuario },
          }); // fallback
        }
        break;
      case "Contabilidad":
        navigate("/contabilidad", {
          state: { userId: userData.ID_Usuario },
        });
        break;
      case "Administrador":
        navigate("/dashboard/admin", {
          state: {
            userId: userData.ID_Usuario,
            userData: userData,
          },
        });
        break;
      default:
        navigate("/", { state: { userId: userData.ID_Usuario } });
    }
  };

  // Redirige a la página de registro (/register):
  const handleWorkWithUs = () => {
    navigate("/register");
  };

  return (
    <div className="login-page">
      <header>
        <h1>Bienvenido a Recrea Sys</h1>
        <nav>
          <a href="/">Iniciar sesión</a>
          <button onClick={handleWorkWithUs}>
            ¿QUIERES TRABAJAR CON NOSOTROS?
          </button>
        </nav>
      </header>

      <main className="pantalla_completa">
        <div className="contenedor_todo">
          <button
            className="boton-info-sistema"
            onClick={() => navigate("/informacion")}
            title="Información del sistema"
          >
            <span className="icono-info">Información{<br />}del sistema</span>
          </button>

          <div className="contenedor_login_register">
            <form onSubmit={handleSubmit} className="formulario_login">
              <h2>Iniciar Sesión</h2>
              {error && <div className="error-message">{error}</div>}
              <input
                type="text"
                name="usuario_asignado"
                placeholder="Usuario asignado"
                value={formData.usuario_asignado}
                onChange={handleChange}
                required
              />
              <input
                type="password"
                name="contrasena"
                placeholder="Contraseña"
                value={formData.contrasena}
                onChange={handleChange}
                required
              />
              <div className="enlaces_recuperacion">
                <a href="/usuario/recuperar-contrasena">
                  ¿Olvidaste tu contraseña?
                </a>
                <a href="/usuario/recuperar-usuario">¿Olvidaste tu usuario?</a>
              </div>
              <button type="submit" disabled={loading}>
                {loading ? "Verificando..." : "Entrar"}
              </button>
            </form>
          </div>
          <button
            className="chatbot-toggle"
            onClick={() => setShowChatbot(!showChatbot)}
          >
            {showChatbot ? "Ocultar asistente" : "Necesito ayuda"}
          </button>
          {showChatbot && <Chatbot />}
        </div>
      </main>
    </div>
  );
}
