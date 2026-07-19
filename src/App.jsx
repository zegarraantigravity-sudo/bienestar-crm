import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Columns, Users, Plus, RefreshCw } from 'lucide-react';
import { supabase } from './lib/supabaseClient';

// Views
import DashboardView from './components/DashboardView';
import KanbanView from './components/KanbanView';
import LeadTableView from './components/LeadTableView';

// Modals
import LeadModal from './components/LeadModal';

export default function App() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  // Fetch leads from Supabase
  const fetchLeads = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('last_interaction', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      alert('Error al conectar con la base de datos de Supabase. Revisa tu consola y asegúrate de haber creado la tabla y configurado las credenciales.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // Update lead in state after modal save or kanban move
  const handleSaveLead = (savedLead) => {
    setLeads(prev => {
      const index = prev.findIndex(l => l.id === savedLead.id);
      if (index >= 0) {
        // Update existing lead
        const updated = [...prev];
        updated[index] = savedLead;
        return updated;
      } else {
        // Add new lead at the beginning
        return [savedLead, ...prev];
      }
    });
  };

  // Remove lead from state after modal delete
  const handleDeleteLead = (deletedId) => {
    setLeads(prev => prev.filter(l => l.id !== deletedId));
  };

  const handleOpenEditModal = (lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  const handleOpenAddModal = () => {
    setSelectedLead(null);
    setIsModalOpen(true);
  };

  return (
    <div className="app-container">
      {/* Sidebar navigation */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <Columns size={20} color="white" />
          </div>
          <span className="logo-text">Bienestar CRM</span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
          <ul className="sidebar-menu">
            <li>
              <button 
                className={`menu-item ${activeView === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveView('dashboard')}
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </button>
            </li>
            <li>
              <button 
                className={`menu-item ${activeView === 'kanban' ? 'active' : ''}`}
                onClick={() => setActiveView('kanban')}
              >
                <Columns size={18} />
                <span>Tablero Kanban</span>
              </button>
            </li>
            <li>
              <button 
                className={`menu-item ${activeView === 'table' ? 'active' : ''}`}
                onClick={() => setActiveView('table')}
              >
                <Users size={18} />
                <span>Directorio Leads</span>
              </button>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="user-avatar">
            SC
          </div>
          <div className="user-info">
            <span className="user-name">Socio Comercial</span>
            <span className="user-role">Administrador</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-viewport">
        
        {/* View Header */}
        <header className="view-header">
          <div className="view-title">
            <h1>
              {activeView === 'dashboard' && 'Panel de Controladores'}
              {activeView === 'kanban' && 'Tablero Kanban'}
              {activeView === 'table' && 'Directorio de Leads'}
            </h1>
            <p>
              {activeView === 'dashboard' && 'Métricas de rendimiento comercial en tiempo real'}
              {activeView === 'kanban' && 'Flujo visual del embudo de prospección y ventas'}
              {activeView === 'table' && 'Registro completo y bitácoras de llamadas de clientes'}
            </p>
          </div>

          <div className="header-actions">
            <button 
              className="btn btn-secondary" 
              onClick={fetchLeads} 
              disabled={loading}
              title="Refrescar Datos"
            >
              <RefreshCw size={16} className={loading ? 'spin-animation' : ''} />
              Refrescar
            </button>
            
            <button className="btn btn-primary" onClick={handleOpenAddModal}>
              <Plus size={16} />
              Registrar Lead
            </button>
          </div>
        </header>

        {/* View Switcher Content */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, gap: '16px' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid hsl(var(--border-color))', borderTopColor: 'hsl(var(--border-focus))', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <span style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.9rem' }}>Cargando información del CRM...</span>
          </div>
        ) : (
          <div style={{ flexGrow: 1 }}>
            {activeView === 'dashboard' && <DashboardView leads={leads} />}
            {activeView === 'kanban' && (
              <KanbanView 
                leads={leads} 
                onUpdateLead={handleSaveLead}
                onSelectLead={handleOpenEditModal}
              />
            )}
            {activeView === 'table' && (
              <LeadTableView 
                leads={leads} 
                onSelectLead={handleOpenEditModal}
                onAddNewLead={handleOpenAddModal}
              />
            )}
          </div>
        )}
      </main>

      {/* Detail/Create Lead Modal */}
      <LeadModal
        isOpen={isModalOpen}
        lead={selectedLead}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveLead}
        onDelete={handleDeleteLead}
      />

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spin-animation {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
