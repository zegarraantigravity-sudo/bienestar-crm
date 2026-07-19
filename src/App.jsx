import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Columns, Users, Plus, RefreshCw, LogOut } from 'lucide-react';
import { supabase } from './lib/supabaseClient';

// Views
import DashboardView from './components/DashboardView';
import KanbanView from './components/KanbanView';
import LeadTableView from './components/LeadTableView';
import LoginView from './components/LoginView';

// Modals
import LeadModal from './components/LeadModal';

export default function App() {
  const [session, setSession] = useState(null);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  // Monitor Supabase Authentication state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setLeads([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch leads from Supabase (only if logged in)
  const fetchLeads = async () => {
    if (!session) return;
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
    if (session) {
      fetchLeads();
    }
  }, [session]);

  const handleLogout = async () => {
    if (window.confirm('¿Deseas cerrar sesión?')) {
      await supabase.auth.signOut();
    }
  };

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

  // If not logged in, render the Login View
  if (!session) {
    return <LoginView />;
  }

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

        <div className="sidebar-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="user-avatar">
              {session.user.email.substring(0, 2).toUpperCase()}
            </div>
            <div className="user-info">
              <span className="user-name" style={{ maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {session.user.email}
              </span>
              <span className="user-role">Administrador</span>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="btn-icon-only" 
            title="Cerrar Sesión"
            style={{ padding: '6px', border: 'none', background: 'transparent' }}
          >
            <LogOut size={16} style={{ color: 'hsl(var(--color-perdido))' }} />
          </button>
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
