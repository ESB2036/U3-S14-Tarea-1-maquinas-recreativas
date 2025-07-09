import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
//Inicializa la aplicación React montando el componente App dentro del contenedor con id "root", utilizando el modo estricto de React para detectar errores potenciales.
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
