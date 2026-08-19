import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Columns, Users, Plus, RefreshCw, LogOut, ShieldCheck, UserCheck } from 'lucide-react';
import { supabase } from './lib/supabaseClient';
import { isSuperAdmin, getUserDisplayName, getUserRoleLabel, canUserViewLead } from './lib/utils';

// Views
import DashboardView from './components/DashboardView';
import KanbanView from './components/KanbanView';
import LeadTableView from './components/LeadTableView';
import LoginView from './components/LoginView';

// Modals
import LeadModal from './components/LeadModal';
import WhatsAppModal from './components/WhatsAppModal';
import LostReasonModal from './components/LostReasonModal';

export default function App() {
  const [session, setSession] = useState(null);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  
  // Super Admin view filter (Alberto can filter between seeing all, his own, or Luis's)
  const [adminAdvisorFilter, setAdminAdvisorFilter] = useState('todos');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  // WhatsApp Modal State
  const [whatsAppModalLead, setWhatsAppModalLead] = useState(null);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

  // Lost Reason Modal State
  const [lostReasonLead, setLostReasonLead] = useState(null);
  const [isLostReasonModalOpen, setIsLostReasonModalOpen] = useState(false);
  const [pendingLostStatus, setPendingLostStatus] = useState('cerrado_perdido');

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

  const userEmail = session?.user?.email || '';
  const isAdmin = isSuperAdmin(userEmail);

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
      alert('Error al conectar con la base de datos de Supabase. Revisa tu consola y conexión.');
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
        const updated = [...prev];
        updated[index] = savedLead;
        return updated;
      } else {
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

  const handleOpenWhatsAppModal = (lead) => {
    setWhatsAppModalLead(lead);
    setIsWhatsAppModalOpen(true);
  };

  const handleRequestLostReason = (lead, targetStatus) => {
    setLostReasonLead(lead);
    setPendingLostStatus(targetStatus || 'cerrado_perdido');
    setIsLostReasonModalOpen(true);
  };

  const handleConfirmLostReason = async (fullReasonText, reasonCode) => {
    if (!lostReasonLead) return;

    let notesList = [];
    let nextActionText = '';
    let nextActionDate = '';
    try {
      const parsed = JSON.parse(lostReasonLead.notes || '[]');
      if (Array.isArray(parsed)) {
        notesList = parsed;
      } else if (parsed && typeof parsed === 'object') {
        notesList = parsed.timeline || [];
        nextActionText = parsed.next_action || '';
        nextActionDate = parsed.next_action_date || '';
      } else {
        notesList = lostReasonLead.notes ? [{ date: lostReasonLead.created_at || new Date().toISOString(), text: lostReasonLead.notes }] : [];
      }
    } catch (err) {
      notesList = lostReasonLead.notes ? [{ date: lostReasonLead.created_at || new Date().toISOString(), text: lostReasonLead.notes }] : [];
    }

    // Append lost reason note to timeline
    const lostNote = {
      date: new Date().toISOString(),
      text: `❌ Lead marcado como Cerrado Perdido. Motivo: ${fullReasonText}`
    };
    const updatedNotesList = [lostNote, ...notesList];

    try {
      const notesPayload = JSON.stringify({
        timeline: updatedNotesList,
        next_action: nextActionText,
        next_action_date: nextActionDate,
        lost_reason: reasonCode,
        lost_reason_label: fullReasonText
      });

      const { data, error } = await supabase
        .from('leads')
        .update({
          status: pendingLostStatus,
          notes: notesPayload,
          last_interaction: new Date().toISOString()
        })
        .eq('id', lostReasonLead.id)
        .select();

      if (error) throw error;
      handleSaveLead(data[0]);
    } catch (err) {
      console.error('Error confirming lost reason:', err);
      alert('Error al actualizar el lead: ' + err.message);
    }
  };

  // If not logged in, render the Login View
  if (!session) {
    return <LoginView />;
  }

  // Filter leads based on user permissions:
  // - Alberto (Super Admin) can see all leads
  // - Luis (Seller) ONLY sees leads assigned to him
  const allowedLeads = leads.filter(lead => canUserViewLead(lead, userEmail));

  // If Super Admin, apply advisor sub-filter if selected
  const visibleLeads = allowedLeads.filter(lead => {
    if (!isAdmin || adminAdvisorFilter === 'todos') return true;
    const assigned = (lead.assigned_to || '').toLowerCase().trim();
    if (adminAdvisorFilter === 'alberto') {
      return assigned.includes('alberto') || (!assigned.includes('luis') && !assigned.includes('hakim'));
    }
    if (adminAdvisorFilter === 'luis') {
      return assigned.includes('luis') || assigned.includes('hakim') || assigned.includes('toro');
    }
    return true;
  });

  const displayName = getUserDisplayName(userEmail);
  const roleLabel = getUserRoleLabel(userEmail);
  const userInitials = displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'US';

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="user-avatar" style={{ backgroundColor: isAdmin ? 'hsl(var(--color-presentacion))' : 'hsl(var(--color-cita))' }}>
              {userInitials}
            </div>
            <div className="user-info">
              <span className="user-name" style={{ maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayName}
              </span>
              <span className="user-role" style={{ color: isAdmin ? 'hsl(var(--color-presentacion))' : 'hsl(var(--text-muted))', fontSize: '0.7rem' }}>
                {roleLabel}
              </span>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1>
                {activeView === 'dashboard' && 'Panel de Controladores'}
                {activeView === 'kanban' && 'Tablero Kanban'}
                {activeView === 'table' && 'Directorio de Leads'}
              </h1>
              {isAdmin && (
                <span style={{ fontSize: '0.75rem', backgroundColor: 'hsla(35, 100%, 55%, 0.15)', color: 'hsl(var(--color-presentacion))', padding: '2px 8px', borderRadius: '6px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={12} /> Super Admin
                </span>
              )}
            </div>
            <p>
              {activeView === 'dashboard' && 'Métricas de rendimiento comercial en tiempo real'}
              {activeView === 'kanban' && 'Flujo visual del embudo de prospección y ventas'}
              {activeView === 'table' && 'Registro completo y bitácoras de llamadas de clientes'}
            </p>
          </div>

          <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Super Admin filter dropdown */}
            {isAdmin && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <select
                  value={adminAdvisorFilter}
                  onChange={(e) => setAdminAdvisorFilter(e.target.value)}
                  className="select-filter"
                  style={{ fontSize: '0.8rem', padding: '6px 12px', borderColor: 'hsla(35, 100%, 55%, 0.3)' }}
                >
                  <option value="todos">👥 Todos los Vendedores ({allowedLeads.length})</option>
                  <option value="alberto">👤 Mis Leads (Alberto)</option>
                  <option value="luis">👤 Leads de Luis</option>
                </select>
              </div>
            )}

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
            {activeView === 'dashboard' && <DashboardView leads={visibleLeads} />}
            {activeView === 'kanban' && (
              <KanbanView 
                leads={visibleLeads} 
                onUpdateLead={handleSaveLead}
                onSelectLead={handleOpenEditModal}
                onOpenWhatsApp={handleOpenWhatsAppModal}
                onRequestLostReason={handleRequestLostReason}
              />
            )}
            {activeView === 'table' && (
              <LeadTableView 
                leads={visibleLeads} 
                onSelectLead={handleOpenEditModal}
                onAddNewLead={handleOpenAddModal}
                onOpenWhatsApp={handleOpenWhatsAppModal}
              />
            )}
          </div>
        )}
      </main>

      {/* Detail/Create Lead Modal */}
      <LeadModal
        isOpen={isModalOpen}
        lead={selectedLead}
        userEmail={userEmail}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveLead}
        onDelete={handleDeleteLead}
        onOpenWhatsApp={handleOpenWhatsAppModal}
      />

      {/* WhatsApp Template Selector Modal */}
      <WhatsAppModal
        isOpen={isWhatsAppModalOpen}
        lead={whatsAppModalLead}
        onClose={() => setIsWhatsAppModalOpen(false)}
      />

      {/* Lost Reason Prompt Modal */}
      <LostReasonModal
        isOpen={isLostReasonModalOpen}
        lead={lostReasonLead}
        onClose={() => setIsLostReasonModalOpen(false)}
        onConfirm={handleConfirmLostReason}
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
