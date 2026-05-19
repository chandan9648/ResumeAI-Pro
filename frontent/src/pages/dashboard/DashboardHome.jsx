import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, FileText, TrendingUp, Zap, ArrowRight, Plus } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useResumeStore from '../../store/resumeStore';
import AdminPage from '../AdminPage';

export default function DashboardHome() {
  const { user } = useAuthStore();
  const { resumes, fetchResumes, loading } = useResumeStore();
  const navigate = useNavigate();

  if (user?.role === 'admin') {
    return <AdminPage />;
  }

  useEffect(() => { fetchResumes(); }, []);

  const avgATS = resumes.length
    ? Math.round(resumes.reduce((s, r) => s + (r.atsScore || 0), 0) / resumes.length)
    : 0;

  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--accent-green)';
    if (score >= 60) return 'var(--accent-blue)';
    if (score >= 40) return 'var(--accent-yellow)';
    return 'var(--accent-red)';
  };

  const quickStats = [
    { label: 'Total Resumes', value: resumes.length, icon: FileText, color: 'var(--accent-blue)' },
    { label: 'Average ATS Score', value: `${avgATS}%`, icon: TrendingUp, color: getScoreColor(avgATS) },
    { label: 'Optimized', value: resumes.filter((r) => r.isOptimized).length, icon: Zap, color: 'var(--accent-purple)' },
    {
      label: 'Uploads Remaining',
      value: user?.subscriptionPlan === 'premium' ? '∞' : Math.max(0, 2 - (user?.uploadCount || 0)),
      icon: Upload,
      color: 'var(--accent-cyan)',
    },
  ];

  return (
    <div className="page-container">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>
          Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
          {resumes.length === 0
            ? 'Upload your first resume to get started with AI optimization.'
            : `You have ${resumes.length} resume${resumes.length > 1 ? 's' : ''}. Keep optimizing!`}
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {quickStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass"
            style={{ padding: '24px' }}
          >
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: `${stat.color}20`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '16px',
            }}>
              <stat.icon size={20} color={stat.color} />
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: stat.color, marginBottom: '4px' }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Free plan reminder */}
      {user?.subscriptionPlan === 'free' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass"
          style={{
            padding: '20px 24px',
            background: 'linear-gradient(135deg, rgba(79,142,247,0.08) 0%, rgba(139,92,246,0.08) 100%)',
            border: '1px solid rgba(79,142,247,0.2)',
            borderRadius: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '32px',
          }}
        >
          <div>
            <div style={{ fontWeight: 700, marginBottom: '4px' }}>
              ⚡ You have {Math.max(0, 2 - (user?.uploadCount || 0))} free upload{Math.max(0, 2 - (user?.uploadCount || 0)) !== 1 ? 's' : ''} remaining
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              Upgrade to Premium for unlimited uploads & AI optimization
            </div>
          </div>
          <Link to="/dashboard/billing" className="btn-primary" style={{ whiteSpace: 'nowrap' }}>
            <Zap size={14} /> Upgrade Now
          </Link>
        </motion.div>
      )}

      {/* Recent Resumes */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="section-title">Recent Resumes</h2>
        <Link to="/dashboard/versions" style={{ color: 'var(--accent-blue)', fontSize: '14px', textDecoration: 'none', fontWeight: 500 }}>
          View all <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />
        </Link>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: '140px', borderRadius: '16px' }} />
          ))}
        </div>
      ) : resumes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass"
          style={{ padding: '60px', textAlign: 'center' }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>No resumes yet</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Upload your first resume to start AI optimization
          </p>
          <Link to="/dashboard/upload" className="btn-primary">
            <Upload size={16} /> Upload Resume
          </Link>
        </motion.div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {/* Upload New Card */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            onClick={() => navigate('/dashboard/upload')}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '32px', borderRadius: '16px',
              border: '2px dashed rgba(79,142,247,0.3)',
              background: 'rgba(79,142,247,0.04)',
              cursor: 'pointer', gap: '12px',
              minHeight: '140px',
            }}
          >
            <Plus size={24} color="var(--accent-blue)" />
            <span style={{ color: 'var(--accent-blue)', fontWeight: 600, fontSize: '14px' }}>Upload New Resume</span>
          </motion.div>

          {resumes.slice(0, 5).map((r, i) => (
            <motion.div
              key={r._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ translateY: -2 }}
              className="glass"
              style={{ padding: '24px', cursor: 'pointer' }}
              onClick={() => navigate(`/dashboard/editor/${r._id}`)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ fontSize: '24px' }}>📄</div>
                <div style={{
                  fontSize: '20px', fontWeight: 800,
                  color: getScoreColor(r.atsScore),
                }}>
                  {r.atsScore || 0}%
                </div>
              </div>
              <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px', color: 'white' }}>
                {r.title}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {r.isOptimized && <span className="badge badge-green">AI Optimized</span>}
                <span className="badge badge-blue">{r.templateId}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
