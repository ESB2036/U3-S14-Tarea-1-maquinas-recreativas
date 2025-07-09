import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import "../css/modulo_contabilidad/mainContabilidad.css";
import { AdminHeader } from '../modulo_usuario/AdminHeader';

export default function Contabilidad() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch financial summary
        const summaryRes = await fetch('/api/contabilidad/resumen-recaudaciones');
        const summaryData = await summaryRes.json();
        
        // Fetch recent transactions
        const transactionsRes = await fetch('/api/contabilidad/recaudaciones?limit=5');
        const transactionsData = await transactionsRes.json();
        
        if (summaryData.success) setSummary(summaryData.resumen);
        if (transactionsData.success) setRecentTransactions(transactionsData.recaudaciones);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        Cargando dashboard de contabilidad...
      </div>
    );
  }

  return (
    <div className="contabilidad-container">
      <AdminHeader/>
      
      <main className="contabilidad-content">
        <section className="welcome-section">
          <h2>Bienvenido al área de contabilidad</h2>
          <p>Aquí podrás gestionar todos los aspectos financieros del sistema</p>
        </section>

        <div className="contabilidad-grid">
          <div className="contabilidad-card">
            <h3>Resumen Financiero</h3>
            {summary ? (
            <div className="summary-content">
              {summary.map((item, index) => (
                <div key={index} className="summary-item">
                  <h4>{item.Tipo_Comercio}</h4>
                  <p>Recaudaciones: {item.TotalRecaudaciones}</p>
                  <p>Total: ${Number(item.TotalRecaudado || 0).toFixed(2)}</p>
                  <p>Empresa: ${Number(item.TotalEmpresa || 0).toFixed(2)}</p>
                  <p>Comercio: ${Number(item.TotalComercio || 0).toFixed(2)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p>No hay datos disponibles</p>
          )}
          </div>
          
          <div className="contabilidad-card">
            <h3>Recaudación mensual</h3>
            <div className="action-buttons">
              <button onClick={() => navigate('/contabilidad/gestion-recaudacion')}>
                Gestionar recaudación mensual
              </button>
            </div>
          </div>

          <div className="contabilidad-card">
            <h3>Transacciones Recientes</h3>
            {recentTransactions.length > 0 ? (
              <ul className="transactions-list">
                {recentTransactions.map(tx => (
                  <li key={tx.ID_Recaudacion}> 
                    <span>{tx.Nombre_Maquina}</span> <br />
                    <span>${Number(tx.Monto_Total || 0).toFixed(2)}</span><br />
                    <span>{new Date(tx.fecha).toLocaleDateString()}</span><br />
                  </li>
                ))}
              </ul>
            ) : (
              <p>No hay transacciones recientes</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}