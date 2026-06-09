import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import useResumeStore from '../../store/resumeStore';
import toast from 'react-hot-toast';

const templates = [
  {
    id: 'modern',
    name: 'Modern Professional',
    description: 'Two-column layout with blue accents. Best for tech roles.',
    tag: 'Popular',
    tagColor: 'badge-blue',
    preview: '📊',
    colors: ['#2563eb', '#1e3a5f', '#f0f7ff'],
  },
  {
    id: 'ats-friendly',
    name: 'ATS-Friendly',
    description: 'Single-column, clean format optimized for ATS parsing.',
    tag: 'Recommended',
    tagColor: 'badge-green',
    preview: '📋',
    colors: ['#111827', '#374151', '#f9fafb'],
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean serif design with elegant whitespace. Great for non-tech.',
    tag: 'Elegant',
    tagColor: 'badge-yellow',
    preview: '✨',
    colors: ['#7c3aed', '#4c1d95', '#faf5ff'],
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Bold gradient design for design/marketing roles.',
    tag: 'Creative',
    tagColor: 'badge-purple',
    preview: '🎨',
    colors: ['#7c3aed', '#db2777', '#1e1b4b'],
  },
];

export default function TemplatesPage() {
  const { resumes, currentResume, updateResume } = useResumeStore();
  const navigate = useNavigate();

  const handleSelect = async (templateId) => {
    if (!currentResume && resumes.length === 0) {
      toast('Upload a resume first, then select a template', { icon: '📤' });
      navigate('/dashboard/upload');
      return;
    }
    const targetId = currentResume?._id || resumes[0]?._id;
    if (targetId) {
      const result = await updateResume(targetId, { templateId });
      if (result.success) {
        toast.success(`Template changed to "${templates.find(t => t.id === templateId)?.name}"!`);
        navigate(`/dashboard/editor/${targetId}`);
      }
    }
  };

  return (
    <div className="page-container">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="section-title">Resume Templates</h1>
        <p className="section-subtitle">Choose a template that matches your industry and style</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
          {templates.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className="glass"
              style={{ overflow: 'hidden', cursor: 'pointer' }}
            >
              {/* Template Preview */}
              <div style={{
                height: '180px',
                background: `linear-gradient(135deg, ${t.colors[0]}22 0%, ${t.colors[1]}22 100%)`,
                borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
              }}>
                <div style={{ fontSize: '64px' }}>{t.preview}</div>

                {/* Mini Resume Preview */}
                <div style={{
                  position: 'absolute', right: '16px', top: '16px', bottom: '16px',
                  width: '90px',
                  background: 'white',
                  borderRadius: '6px',
                  padding: '8px 6px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                  overflow: 'hidden',
                }}>
                  <div style={{ height: '6px', background: t.colors[0], borderRadius: '2px', marginBottom: '6px' }} />
                  <div style={{ height: '3px', background: '#e5e7eb', borderRadius: '2px', marginBottom: '3px', width: '70%' }} />
                  <div style={{ height: '2px', background: '#e5e7eb', borderRadius: '2px', marginBottom: '6px', width: '50%' }} />
                  {[1,2,3,4,5,6].map(n => (
                    <div key={n} style={{ height: '2px', background: '#f3f4f6', borderRadius: '2px', marginBottom: '3px', width: `${60 + (n % 3) * 15}%` }} />
                  ))}
                </div>
              </div>

              {/* Info */}
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{t.name}</h3>
                  <span className={`badge ${t.tagColor}`}>{t.tag}</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6, marginBottom: '16px' }}>
                  {t.description}
                </p>
                <button
                  onClick={() => handleSelect(t.id)}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
                >
                  <Check size={14} /> Use This Template
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
