import React, { useState, useEffect, useRef } from 'react';
import '../Autenticacion/chatbot.css';
import { useNavigate } from 'react-router-dom';

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [showOptions, setShowOptions] = useState(true);
  const [isVisible, setIsVisible] = useState(true); 
  const [collectingInfo, setCollectingInfo] = useState(null);
  const navigate = useNavigate();

  const [userInfo, setUserInfo] = useState({
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    ci: ''
  });
  const [currentFlow, setCurrentFlow] = useState(null);
  const [currentFlowText, setCurrentFlowText] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setMessages([{
      text: "¡Hola! Soy el asistente virtual de RecreaSys. ¿En qué puedo ayudarte hoy?",
      sender: 'bot'
    }]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const options = [
    "No puedo iniciar sesión y ya hice la solicitud para ingresar a trabajar",
    "No puedo iniciar sesión y ya trabajo en la empresa",
    "Quiero información sobre lo que hacen sobre las máquinas recreativas",
    "Tengo un problema técnico con una máquina, quiero que me ayuden",
    "Quiero reportar un problema con un comercio asociado, quiero que me ayuden",
  ];

  const responses = {
    "No puedo iniciar sesión y ya hice la solicitud para ingresar a trabajar":
      "Hola, aún estamos revisando tu solicitud. Por favor espera a que te contactemos. El proceso puede tardar hasta 5 días hábiles.",
    "No puedo iniciar sesión y ya trabajo en la empresa":
      "Proporciona tu email que has registrado en la empresa para buscarte en nuestra base de datos",
    "Quiero información sobre lo que hacen sobre las máquinas recreativas":
      "Nuestras máquinas recreativas pasan por un proceso de ensamblaje, comprobación y distribución. Actualmente tenemos modelos clásicos y modernos con tecnología de última generación.",
    "Tengo un problema técnico con una máquina, quiero que me ayuden":
      "Gracias por informarnos. Primero necesitamos tus datos para poder ayudarte.",
    "Quiero reportar un problema con un comercio asociado, quiero que me ayuden":
      "Entendido. Para procesar tu solicitud necesitamos tus datos."
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) {
    return null; 
  }
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    const userMessage = { text: inputValue, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setShowOptions(false);
    if (inputValue.trim() === "Mostrar conversación") {
      setMessages(prev => [...prev, { 
        text: "Por favor ingresa tu correo electrónico para buscar tus conversaciones:", 
        sender: 'bot' 
      }]);
      setCollectingInfo("buscar-chats");
      return;
    }
  if (collectingInfo === "buscar-chats") {
      const correo = inputValue.trim();
      setInputValue('');
      try {
        const res = await fetch("/api/reportes/buscar-chats-por-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: correo })
        });
        const data = await res.json();

        if (!data.success || !data.chats || data.chats.length === 0) {
          setMessages(prev => [...prev, { 
            text: "No se encontraron conversaciones para este correo.", 
            sender: 'bot' 
          }]);
        } else {
          // Mostrar resumen de chats encontrados
          setMessages(prev => [...prev, { 
            text: `Encontré ${data.chats.length} conversación(es) relacionadas con tu cuenta:`, 
            sender: 'bot' 
          }]);

          // Agregar botones para cada chat
          data.chats.forEach(chat => {
            const otroUsuario = chat.emisor_nombre === correo ? 
              `${chat.destinatario_nombre} ${chat.destinatario_apellido}` : 
              `${chat.emisor_nombre} ${chat.emisor_apellido}`;
            
            setMessages(prev => [...prev, {
              text: `Chat con ${otroUsuario} (${chat.estado}) - ${new Date(chat.fecha_hora).toLocaleString()}`,
              sender: 'bot',
              isButton: true,
              onClick: () => {
                // Abrir el chat en una nueva pestaña
                window.open(`/reportes/chat?reporteId=${chat.ID_Reporte}&currentUserId=${chat.otro_usuario_id}`, '_blank');
              },
              buttonText: 'Ver chat'
            }]);
          });
        }
      } catch (error) {
        console.error("Error al buscar chats:", error);
        setMessages(prev => [...prev, { 
          text: "Usted no se ha iniciado conversaciones. Intenta más tarde.", 
          sender: 'bot' 
        }]);
      }

      setCollectingInfo(null);
      setTimeout(() => {
        setMessages(prev => [...prev, {
          text: "¿Necesitas ayuda con algo más?",
          sender: 'bot'
        }]);
        setShowOptions(true);
      }, 1500);
      return;
    }
    if (collectingInfo === "buscar-email") {
      const correo = inputValue.trim();
      setInputValue('');
      try {
        const res = await fetch("/api/usuario/buscar-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: correo })
        });
        const data = await res.json();

        if (!data.success) {
          setMessages(prev => [...prev, { text: "No se encontró ningún usuario con ese correo.", sender: 'bot' }]);
          setCollectingInfo(null);
          return;
        }

        const userData = data.usuario;

        if (userData.estado === "Inhabilitado") {
          setMessages(prev => [...prev, {
            text: "Hemos detectado que tu cuenta ha sido inhabilitada. ¿Deseas hacer la solicitud para reactivarla?",
            sender: 'bot'
          }]);

          setMessages(prev => [...prev, {
            text: "Haz clic aquí para iniciar el proceso de reactivación.",
            sender: 'bot',
            isButton: true,
            onClick: () => {
              navigate("/reportes/gestion", {
                state: {
                  userData,
                  isDisabledUser: true
                }
              });
            }
          }]);
        } else {
          setMessages(prev => [...prev, {
            text: `Tu cuenta está activa. Intenta iniciar sesión con tu usuario asignado: ${userData.usuario_asignado}`,
            sender: 'bot'
          }]);
        }

      } catch (error) {
        console.error("Error al buscar usuario:", error);
        setMessages(prev => [...prev, { text: "Hubo un error al buscar tu información. Intenta más tarde.", sender: 'bot' }]);
      }

      setCollectingInfo(null);
      return;
    }

    if (collectingInfo) {
      const lowerInput = inputValue.toLowerCase().trim();

      if (lowerInput === 'si' || lowerInput === 'sí') {
        setMessages(prev => [...prev, {
          text: "OK, hemos recibido tu información. Nuestro administrador se pondrá en contacto contigo pronto.",
          sender: 'bot'
        }]);
        setCollectingInfo(false);

        try {
          // Obtener administrador
          const res = await fetch('/api/usuarios/por-tipo?tipo=Administrador');
          const data = await res.json();
          
          if (!data.usuarios || data.usuarios.length === 0) {
            throw new Error('No se encontró ningún administrador');
          }
          
          const admin = data.usuarios[0];

          // Registrar usuario
          const regRes = await fetch('/api/usuario/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nombre: userInfo.nombres,
              apellido: userInfo.apellidos,
              email: userInfo.email,
              ci: userInfo.ci || Date.now().toString(),
              usuario_asignado: 'Aun no tiene',
              contrasena: 'Aun no tiene',
              tipo: 'Usuario'
            })
          });

          const usuarioData = await regRes.json();
          
          if (!usuarioData.success) {
            throw new Error(usuarioData.message || 'Error al registrar usuario');
          }

          // Crear reporte
          const reporteRes = await fetch('/api/reportes/crear', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ID_Usuario_Emisor: usuarioData.idUsuario || usuarioData.userId,
              ID_Usuario_Destinatario: admin.ID_Usuario,
              descripcion: `Nuevo reporte desde chatbot (${currentFlowText}):\nNombre: ${userInfo.nombres} ${userInfo.apellidos}\nEmail: ${userInfo.email}\nTeléfono: ${userInfo.telefono}`,
              estado: 'Pendiente'
            })
          });

          const reporteData = await reporteRes.json();
          
          if (!reporteData.success) {
            throw new Error(reporteData.message || 'Error al crear reporte');
          }

        } catch (error) {
          console.error("Error enviando datos:", error);
          setMessages(prev => [...prev, {
            text: "Hubo un error al procesar tu solicitud. Por favor intenta nuevamente más tarde.",
            sender: 'bot'
          }]);
        }

        setTimeout(() => {
          setMessages(prev => [...prev, {
            text: "¿Necesitas ayuda con algo más?",
            sender: 'bot'
          }]);
          setShowOptions(true);
        }, 2000);
        return;
      } else if (lowerInput === 'no') {
          setMessages(prev => [...prev, {
            text: "Entendido. Por favor, vuelve a ingresar tus datos: nombres, apellidos, email, teléfono y cédula.",
            sender: 'bot'
          }]);
          setUserInfo({ nombres: '', apellidos: '', email: '', telefono: '', ci: '' });
          return;
        }

        if (!userInfo.nombres) {
          setUserInfo({ ...userInfo, nombres: inputValue });
          setMessages(prev => [...prev, { text: "Gracias. Ahora por favor ingresa tus apellidos:", sender: 'bot' }]);
        } else if (!userInfo.apellidos) {
          setUserInfo({ ...userInfo, apellidos: inputValue });
          setMessages(prev => [...prev, { text: "Perfecto. Ahora necesitamos tu email:", sender: 'bot' }]);
        } else if (!userInfo.email) {
          setUserInfo({ ...userInfo, email: inputValue });
          setMessages(prev => [...prev, { text: "Ahora, por favor ingresa tu teléfono:", sender: 'bot' }]);
        } else if (!userInfo.telefono) {
          const updated = { ...userInfo, telefono: inputValue };
          setUserInfo(updated);
          setMessages(prev => [...prev, { text: "Por último, ingresa tu número de cédula:", sender: 'bot' }]);
        } else if (!userInfo.ci) {
          const updated = { ...userInfo, ci: inputValue };
          setUserInfo(updated);
          const confirm = {
            text: `¿Esta información es correcta?\nNombres: ${updated.nombres}\nApellidos: ${updated.apellidos}\nEmail: ${updated.email}\nTeléfono: ${updated.telefono}\nCI: ${updated.ci}\nResponde SI o NO`,
            sender: 'bot'
          };
          setMessages(prev => [...prev, confirm]);
        }
        return;
      }

    let matchedOption = null;
    const userInput = inputValue.toLowerCase().trim();
    
    for (const option of options) {
      const optionLower = option.toLowerCase();
      if (userInput.includes(optionLower) || optionLower.includes(userInput)) {
        matchedOption = option;
        break;
      }
    }

    const responseText = matchedOption ? responses[matchedOption] : "Lo siento, no entendí tu consulta.";

    setTimeout(() => {
      setMessages(prev => [...prev, { text: responseText, sender: 'bot' }]);

      if (matchedOption === "No puedo iniciar sesión y ya trabajo en la empresa") {
        setCollectingInfo("buscar-email");
        setMessages(prev => [...prev, { text: "Por favor ingresa tu correo electrónico:", sender: 'bot' }]);
        return;
      } else if (
        matchedOption === "Tengo un problema técnico con una máquina, quiero que me ayuden" || 
        matchedOption === "Quiero reportar un problema con un comercio asociado, quiero que me ayuden"
      ) {
        const flowKey = matchedOption.includes('comercio') ? 'commerce_issue' : 'tech_issue';
        setCurrentFlow(flowKey);
        setCurrentFlowText(matchedOption);
        setCollectingInfo(true);
        setMessages(prev => [...prev, { text: "Por favor ingresa tus nombres:", sender: 'bot' }]);
        return;
      } else {
        setTimeout(() => {
          setMessages(prev => [...prev, { text: "¿Necesitas ayuda con algo más?", sender: 'bot' }]);
          setShowOptions(true);
        }, 1500);
      }
    }, 800);
  };

  const handleOptionSelect = (option) => {
    setInputValue(option);
    handleSendMessage();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSendMessage();
  };

return (
  <div className="chatbot-container">
    <div className="chatbot-header">
      <h3>Asistente Virtual</h3>
       <button onClick={handleClose} className="close-button">
          ✖
        </button>
    </div>

    <div className="chatbot-messages">
      {messages.map((msg, i) => (
        <div key={i} className={`message ${msg.sender}`}>
          {msg.text.split('\n').map((line, j) => (
            <p key={j}>{line}</p>
          ))}
          {msg.isButton && (
            <button
              onClick={msg.onClick}
              className="chatbot-button-link"
            >
              {msg.buttonText || 'Solicitud de reactivación de cuenta'}
            </button>
          )}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>

    {showOptions && (
      <div className="chatbot-options">
        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleOptionSelect(opt)}
            className="option-button"
          >
            {opt}
          </button>
        ))}
      </div>
    )}

    <div className="chatbot-input">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Escribe tu mensaje..."
      />
      <button onClick={handleSendMessage}>Enviar</button>
    </div>
  </div>
);
};

export default Chatbot;