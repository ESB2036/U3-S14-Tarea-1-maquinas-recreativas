import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

const login = async (credentials) => {
  try {
    const response = await fetch('/api/usuario/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    
    const data = await response.json();
    
    if (data.success && data.usuario) {
      // Asegurarse de que el UUID viene del backend
      if (!data.usuario.ID_Usuario) {
        throw new Error('El servidor no devolvió un ID de usuario válido');
      }
      
      const userData = {
        ...data.usuario,
        uuid: data.usuario.ID_Usuario, // Usar ID_Usuario como UUID
        tipo: data.usuario.tipo === 'Tecnico' ? 'Técnico' : data.usuario.tipo
      };
      
      localStorage.setItem('user', JSON.stringify(userData));
      setCurrentUser(userData);
      return { success: true };
    } else {
      return { success: false, message: data.message || 'Error en el login' };
    }
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'Error de conexión' };
  }
};

    const logout = async () => {
        try {
            const response = await fetch('/api/usuario/logout', { 
                method: 'POST',
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (data.success) {
                localStorage.removeItem('user');
                setCurrentUser(null);
                return { success: true };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, message: 'Error al cerrar sesión' };
        }
    };
// En AuthContext.jsx
useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
        try {
            const user = JSON.parse(stored);
            
            // Validar estructura básica del usuario
            if (!user || typeof user !== 'object') {
                throw new Error('Datos de usuario inválidos');
            }

            // Validar UUID
            if (!user.uuid || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.uuid)) {
                console.error('UUID de usuario no válido en localStorage:', user.uuid);
                localStorage.removeItem('user');
                return;
            }

            setCurrentUser(user);
        } catch (error) {
            console.error('Error al parsear usuario de localStorage:', error);
            localStorage.removeItem('user');
        }
    }
    setLoading(false);
}, []);


    const value = {
        currentUser,
        setCurrentUser,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de un AuthProvider');
    }
    return context;
}