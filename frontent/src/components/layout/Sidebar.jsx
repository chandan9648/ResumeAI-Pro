import { NavLink, useNavigate } from 'react-router-dom';
import useUIStore from '../../store/uiStore';
import useAuthStore from '../../store/authStore';
import {
  LayoutDashboard, Upload, FileText, BarChart2,
  Layers, CreditCard, Settings, Zap, LogOut, Shield, Copy
} from 'lucide-react';

export default function Sidebar() {
  const { sidebarOpen } = useUIStore();
  const { user, logout, isAdmin } = useAuthStore();
  const navigate = useNavigate();

  const navItems = isAdmin()
    ? [
        { to: '/dashboard', label: 'Admin Dashboard', icon: Shield, end: true },
        { to: '/dashboard/settings', label: 'Settings', icon: Settings },
      ]
    : [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
        { to: '/dashboard/upload', label: 'Upload Resume', icon: Upload },
        { to: '/dashboard/versions', label: 'My Resumes', icon: Copy },
        { to: '/dashboard/templates', label: 'Templates', icon: Layers },
        { to: '/dashboard/billing', label: 'Billing', icon: CreditCard },
        { to: '/dashboard/settings', label: 'Settings', icon: Settings },
      ];

  return (
    <aside style={{
      position: 'fixed',
      top: 0, left: 0,
      height: '100vh',
      width: sidebarOpen ? '260px' : '72px',
      background: 'rgba(15, 22, 41, 0.95)',
      backdropFilter: 'blur(20px)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.3s ease',
      zIndex: 200,
      overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{
        padding: '20px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: '12px',
        minHeight: '72px',
      }}>
        <div style={{
          width: '40px', height: '40px', flexShrink: 0,
          background: 'var(--gradient-main)',
          borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '20px',
        }}>
          📄
        </div>
        {sidebarOpen && (
          <div>
            <div style={{ fontWeight: 800, fontSize: '16px', color: 'white' }}>ResumeAI</div>
            <div style={{ fontSize: '11px', color: 'var(--accent-blue)', fontWeight: 600 }}>PRO</div>
          </div>
        )}
      </div>

      {/* Free plan banner */}
      {sidebarOpen && !isAdmin() && user?.subscriptionPlan === 'free' && (
        <div style={{
          margin: '12px 12px 0',
          padding: '12px',
          background: 'var(--gradient-card)',
          border: '1px solid rgba(79,142,247,0.2)',
          borderRadius: '10px',
          fontSize: '12px',
        }}>
          <div style={{ color: 'var(--accent-blue)', fontWeight: 700, marginBottom: '4px' }}>
            ⚡ {Math.max(0, 2 - (user.uploadCount || 0))} uploads remaining
          </div>
          <div style={{ color: 'var(--text-muted)' }}>Upgrade for unlimited</div>
        </div>
      )}

      {/* Nav Items */}
      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '11px 12px',
              borderRadius: '10px',
              marginBottom: '2px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 0.2s ease',
              color: isActive ? 'white' : 'var(--text-secondary)',
              background: isActive ? 'var(--gradient-main)' : 'transparent',
              boxShadow: isActive ? '0 4px 12px rgba(79,142,247,0.3)' : 'none',
            })}
          >
            <Icon size={18} style={{ flexShrink: 0 }} />
            {sidebarOpen && <span>{label}</span>}
          </NavLink>
        ))}

      </nav>

      {/* Upgrade CTA */}
      {sidebarOpen && !isAdmin() && user?.subscriptionPlan === 'free' && (
        <div style={{ padding: '12px' }}>
          <button
            onClick={() => navigate('/dashboard/billing')}
            style={{
              width: '100%',
              padding: '12px',
              background: 'var(--gradient-main)',
              border: 'none',
              borderRadius: '10px',
              color: 'white',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <Zap size={14} />
            Upgrade to Premium
          </button>
        </div>
      )}

      {/* Logout */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '11px 12px', borderRadius: '10px',
            background: 'transparent', border: 'none',
            color: 'var(--text-muted)', fontSize: '14px',
            cursor: 'pointer', fontWeight: 500,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent-red)'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
        >
          <LogOut size={18} style={{ flexShrink: 0 }} />
          {sidebarOpen && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
