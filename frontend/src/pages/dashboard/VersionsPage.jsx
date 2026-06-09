import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Edit2, Copy, Trash2, Download, BarChart2, Search, Plus } from 'lucide-react';
import useResumeStore from '../../store/resumeStore';
import toast from 'react-hot-toast';

const getScoreColor = (s) => {
  if (s >= 80) return 'var(--accent-green)';
  if (s >= 60) return 'var(--accent-blue)';
  if (s >= 40) return 'var(--accent-yellow)';
  return 'var(--accent-red)';
};

export default function VersionsPage() {
  const { resumes, fetchResumes, duplicateResume, deleteResume, loading } = useResumeStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => { fetchResumes(); }, []);

  const filtered = resumes.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleDuplicate = async (id) => {
    const result = await duplicateResume(id);
    if (result.success) toast.success('Resume duplicated!');
    else toast.error(result.message);
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    const result = await deleteResume(id);
    setDeleting(null);
    if (result.success) toast.success('Resume deleted');
    else toast.error(result.message);
  };

  const handleDownload = async (resume) => {
    toast('Preparing PDF download...', { icon: '📥' });
    // Navigate to editor to trigger PDF download
    navigate(`/dashboard/editor/${resume._id}`);
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 className="section-title">My Resumes</h1>
          <p className="section-subtitle">Manage, edit, and download all your resume versions</p>
        </div>
        <button onClick={() => navigate('/dashboard/upload')} className="btn-primary">
          <Plus size={16} /> Upload New
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '24px', maxWidth: '400px' }}>
        <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          className="input"
          placeholder="Search resumes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: '42px' }}
        />
      </div>

      {loading ? (
        <div style={{ display: 'grid', gap: '12px' }}>
          {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: '88px', borderRadius: '14px' }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass" style={{ padding: '60px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📂</div>
          <h3 style={{ fontWeight: 700, marginBottom: '8px' }}>
            {search ? 'No resumes match your search' : 'No resumes yet'}
          </h3>
          {!search && (
            <button onClick={() => navigate('/dashboard/upload')} className="btn-primary" style={{ marginTop: '16px' }}>
              Upload Your First Resume
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map((resume, i) => (
            <motion.div
              key={resume._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass"
              style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}
            >
              {/* Score Circle */}
              <div style={{
                width: '56px', height: '56px', flexShrink: 0,
                borderRadius: '50%',
                border: `3px solid ${getScoreColor(resume.atsScore)}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column',
              }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: getScoreColor(resume.atsScore) }}>
                  {resume.atsScore || 0}
                </div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>ATS</div>
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>{resume.title}</div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {new Date(resume.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <span className={`badge badge-${resume.templateId === 'modern' ? 'blue' : resume.templateId === 'creative' ? 'purple' : 'yellow'}`}>
                    {resume.templateId}
                  </span>
                  {resume.isOptimized && <span className="badge badge-green">AI Optimized</span>}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <ActionBtn icon={<Edit2 size={14} />} label="Edit" onClick={() => navigate(`/dashboard/editor/${resume._id}`)} />
                <ActionBtn icon={<BarChart2 size={14} />} label="ATS" onClick={() => navigate(`/dashboard/ats/${resume._id}`)} />
                <ActionBtn icon={<Copy size={14} />} label="Copy" onClick={() => handleDuplicate(resume._id)} />
                <ActionBtn
                  icon={deleting === resume._id ? <div className="spinner" style={{ width: '12px', height: '12px' }} /> : <Trash2 size={14} />}
                  label="Delete" danger
                  onClick={() => handleDelete(resume._id)}
                  disabled={deleting === resume._id}
                />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function ActionBtn({ icon, label, onClick, danger = false, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      style={{
        display: 'flex', alignItems: 'center', gap: '4px',
        padding: '7px 12px', borderRadius: '8px',
        background: danger ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${danger ? 'rgba(239,68,68,0.2)' : 'var(--border)'}`,
        color: danger ? 'var(--accent-red)' : 'var(--text-secondary)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '12px', fontWeight: 500,
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => !disabled && (e.currentTarget.style.opacity = '0.8')}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
    >
      {icon}
      <span style={{ display: 'none' }}>{label}</span>
    </button>
  );
}
