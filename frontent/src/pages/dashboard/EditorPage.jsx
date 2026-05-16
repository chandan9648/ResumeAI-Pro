import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Save, Download, Zap, BarChart2, Eye, Edit2, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import useResumeStore from '../../store/resumeStore';
import useJDStore from '../../store/jdStore';
import useAuthStore from '../../store/authStore';
import useUIStore from '../../store/uiStore';
import toast from 'react-hot-toast';

const SectionField = ({ label, value, onChange, multiline = false }) => (
  <div style={{ marginBottom: '14px' }}>
    <label className="label">{label}</label>
    {multiline ? (
      <textarea className="input" value={value || ''} onChange={(e) => onChange(e.target.value)}
        style={{ minHeight: '100px' }} />
    ) : (
      <input type="text" className="input" value={value || ''} onChange={(e) => onChange(e.target.value)} />
    )}
  </div>
);

export default function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentResume, fetchResume, updateResume, optimizeResume, loading, optimizing } = useResumeStore();
  const { analyzeJD, analyzing, missingSkills } = useJDStore();
  const { isPremium } = useAuthStore();
  const { openSubscriptionModal } = useUIStore();

  const [sections, setSections] = useState(null);
  const [jdText, setJdText] = useState('');
  const [showJD, setShowJD] = useState(false);
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'preview'
  const [expandedSections, setExpandedSections] = useState({ personal: true, summary: true, skills: true, experience: true, education: true });
  const [saving, setSaving] = useState(false);
  const [useOptimized, setUseOptimized] = useState(false);

  useEffect(() => {
    if (id) fetchResume(id);
  }, [id]);

  useEffect(() => {
    if (currentResume) {
      const s = useOptimized && currentResume.optimizedSections
        ? currentResume.optimizedSections
        : currentResume.parsedSections;
      setSections(JSON.parse(JSON.stringify(s)));
    }
  }, [currentResume, useOptimized]);

  const handleSave = async () => {
    setSaving(true);
    const result = await updateResume(id, { parsedSections: sections });
    setSaving(false);
    if (result.success) toast.success('Resume saved!');
    else toast.error(result.message);
  };

  const handleAnalyzeJD = async () => {
    if (!jdText.trim()) return toast.error('Please paste a job description');
    const result = await analyzeJD({ description: jdText, resumeId: id });
    if (result.success) {
      toast.success(`JD analyzed! Match score: ${result.matchScore}%`);
    } else toast.error(result.message);
  };

  const handleOptimize = async () => {
    if (!jdText.trim()) {
      toast.error('Please paste a job description first');
      setShowJD(true);
      return;
    }
    const result = await optimizeResume(id, jdText, missingSkills);
    if (result.success) {
      setUseOptimized(true);
      toast.success('Resume optimized with AI! 🎉');
    } else toast.error(result.message);
  };

  const handleDownloadPDF = async () => {
    const { default: html2pdf } = await import('html2pdf.js');
    const element = document.getElementById('resume-preview');
    if (!element) return toast.error('Preview not visible');
    html2pdf().set({
      margin: 10,
      filename: `${currentResume?.title || 'resume'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    }).from(element).save();
    toast.success('Downloading PDF...');
  };

  const toggle = (sec) => setExpandedSections((p) => ({ ...p, [sec]: !p[sec] }));

  const updateField = (path, value) => {
    setSections((prev) => {
      const next = { ...prev };
      const parts = path.split('.');
      let obj = next;
      for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
      obj[parts[parts.length - 1]] = value;
      return { ...next };
    });
  };

  if (loading || !sections) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div className="spinner spinner-lg" />
    </div>
  );

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      {/* Left Panel — Editor */}
      <div style={{
        width: '420px', flexShrink: 0,
        borderRight: '1px solid var(--border)',
        overflowY: 'auto',
        padding: '24px',
        display: 'flex', flexDirection: 'column', gap: '16px',
      }}>
        {/* Header */}
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>{currentResume?.title}</h2>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span className="badge badge-blue">ATS {currentResume?.atsScore || 0}%</span>
            {currentResume?.isOptimized && <span className="badge badge-green">AI Optimized</span>}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={handleSave} disabled={saving} className="btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: '8px' }}>
            {saving ? <div className="spinner" style={{ width: '14px', height: '14px' }} /> : <Save size={14} />}
            Save
          </button>
          <button onClick={handleDownloadPDF} className="btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: '8px' }}>
            <Download size={14} /> PDF
          </button>
          <Link to={`/dashboard/ats/${id}`} style={{ flex: 1 }}>
            <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center', padding: '8px' }}>
              <BarChart2 size={14} /> ATS Report
            </button>
          </Link>
        </div>

        {/* Optimized Toggle */}
        {currentResume?.optimizedSections && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '12px', borderRadius: '10px',
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.2)',
          }}>
            <input type="checkbox" id="useOpt" checked={useOptimized} onChange={(e) => setUseOptimized(e.target.checked)} style={{ cursor: 'pointer' }} />
            <label htmlFor="useOpt" style={{ fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              Show AI-optimized version
            </label>
          </div>
        )}

        {/* JD Section */}
        <div className="glass" style={{ padding: '16px' }}>
          <button
            onClick={() => setShowJD(!showJD)}
            style={{
              width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'none', border: 'none', cursor: 'pointer', color: 'white', fontWeight: 600, fontSize: '14px',
            }}
          >
            <span>🎯 Job Description</span>
            {showJD ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showJD && (
            <div style={{ marginTop: '12px' }}>
              <textarea
                className="input"
                placeholder="Paste job description here..."
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                style={{ minHeight: '140px', fontSize: '13px' }}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button onClick={handleAnalyzeJD} disabled={analyzing} className="btn-secondary" style={{ flex: 1, fontSize: '12px', padding: '8px' }}>
                  {analyzing ? <div className="spinner" style={{ width: '12px', height: '12px' }} /> : null}
                  Analyze
                </button>
                <button onClick={handleOptimize} disabled={optimizing} className="btn-primary" style={{ flex: 1, fontSize: '12px', padding: '8px' }}>
                  {optimizing ? <div className="spinner" style={{ width: '12px', height: '12px' }} /> : <Zap size={12} />}
                  Optimize AI
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Editable Sections ── */}
        {/* Personal Info */}
        <SectionPanel title="Personal Info" expanded={expandedSections.personal} onToggle={() => toggle('personal')}>
          <SectionField label="Full Name" value={sections.name} onChange={(v) => updateField('name', v)} />
          <SectionField label="Email" value={sections.email} onChange={(v) => updateField('email', v)} />
          <SectionField label="Phone" value={sections.phone} onChange={(v) => updateField('phone', v)} />
          <SectionField label="Location" value={sections.location} onChange={(v) => updateField('location', v)} />
          <SectionField label="LinkedIn" value={sections.linkedin} onChange={(v) => updateField('linkedin', v)} />
        </SectionPanel>

        {/* Summary */}
        <SectionPanel title="Professional Summary" expanded={expandedSections.summary} onToggle={() => toggle('summary')}>
          <SectionField label="Summary" value={sections.summary} onChange={(v) => updateField('summary', v)} multiline />
        </SectionPanel>

        {/* Skills */}
        <SectionPanel title="Skills" expanded={expandedSections.skills} onToggle={() => toggle('skills')}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
            {(sections.skills || []).map((skill, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                background: 'rgba(79,142,247,0.1)', border: '1px solid rgba(79,142,247,0.2)',
                borderRadius: '6px', padding: '4px 10px', fontSize: '12px', color: 'var(--accent-blue)',
              }}>
                {skill}
                <button onClick={() => {
                  const s = [...sections.skills]; s.splice(i, 1);
                  updateField('skills', s);
                }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-red)', padding: '0', lineHeight: 1 }}>
                  <X_ICON size={10} />
                </button>
              </div>
            ))}
          </div>
          <SkillAdder onAdd={(skill) => updateField('skills', [...(sections.skills || []), skill])} />
        </SectionPanel>

        {/* Experience */}
        <SectionPanel title="Experience" expanded={expandedSections.experience} onToggle={() => toggle('experience')}>
          {(sections.experience || []).map((exp, i) => (
            <div key={i} style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
              <SectionField label="Company" value={exp.company} onChange={(v) => {
                const exps = [...sections.experience]; exps[i] = { ...exps[i], company: v };
                updateField('experience', exps);
              }} />
              <SectionField label="Job Title" value={exp.title} onChange={(v) => {
                const exps = [...sections.experience]; exps[i] = { ...exps[i], title: v };
                updateField('experience', exps);
              }} />
              <SectionField label="Duration" value={exp.duration} onChange={(v) => {
                const exps = [...sections.experience]; exps[i] = { ...exps[i], duration: v };
                updateField('experience', exps);
              }} />
            </div>
          ))}
        </SectionPanel>

        {/* Education */}
        <SectionPanel title="Education" expanded={expandedSections.education} onToggle={() => toggle('education')}>
          {(sections.education || []).map((edu, i) => (
            <div key={i} style={{ marginBottom: '12px' }}>
              <SectionField label="Institution" value={edu.institution} onChange={(v) => {
                const eds = [...sections.education]; eds[i] = { ...eds[i], institution: v };
                updateField('education', eds);
              }} />
              <SectionField label="Degree" value={edu.degree} onChange={(v) => {
                const eds = [...sections.education]; eds[i] = { ...eds[i], degree: v };
                updateField('education', eds);
              }} />
              <SectionField label="Year" value={edu.year} onChange={(v) => {
                const eds = [...sections.education]; eds[i] = { ...eds[i], year: v };
                updateField('education', eds);
              }} />
            </div>
          ))}
        </SectionPanel>
      </div>

      {/* Right Panel — Preview */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px', background: '#f8fafc' }}>
        <ResumePreview sections={sections} title={currentResume?.title} />
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

const X_ICON = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

function SectionPanel({ title, expanded, onToggle, children }) {
  return (
    <div className="glass" style={{ padding: '16px' }}>
      <button onClick={onToggle} style={{
        width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'none', border: 'none', cursor: 'pointer', color: 'white', fontWeight: 600, fontSize: '13px', marginBottom: expanded ? '14px' : 0,
      }}>
        <span>{title}</span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {expanded && children}
    </div>
  );
}

function SkillAdder({ onAdd }) {
  const [val, setVal] = useState('');
  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <input className="input" placeholder="Add skill..." value={val} onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && val.trim()) { onAdd(val.trim()); setVal(''); } }}
        style={{ flex: 1, fontSize: '13px', padding: '8px 12px' }} />
      <button onClick={() => { if (val.trim()) { onAdd(val.trim()); setVal(''); } }}
        style={{ background: 'rgba(79,142,247,0.2)', border: '1px solid rgba(79,142,247,0.3)', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: 'var(--accent-blue)' }}>
        <Plus size={16} />
      </button>
    </div>
  );
}

function ResumePreview({ sections, title }) {
  if (!sections) return null;
  return (
    <div id="resume-preview" style={{
      background: 'white', color: '#1a1a1a',
      maxWidth: '700px', margin: '0 auto',
      padding: '48px 56px',
      fontFamily: 'Georgia, serif',
      boxShadow: '0 8px 48px rgba(0,0,0,0.15)',
      borderRadius: '4px',
      minHeight: '1000px',
    }}>
      {/* Header */}
      <div style={{ borderBottom: '3px solid #2563eb', paddingBottom: '20px', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1e3a5f', marginBottom: '8px', fontFamily: 'Arial, sans-serif' }}>
          {sections.name || 'Your Name'}
        </h1>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '13px', color: '#555' }}>
          {sections.email && <span>✉ {sections.email}</span>}
          {sections.phone && <span>📞 {sections.phone}</span>}
          {sections.location && <span>📍 {sections.location}</span>}
          {sections.linkedin && <span>🔗 {sections.linkedin}</span>}
        </div>
      </div>

      {/* Summary */}
      {sections.summary && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#2563eb', marginBottom: '10px', fontFamily: 'Arial, sans-serif' }}>Professional Summary</h2>
          <p style={{ fontSize: '14px', lineHeight: 1.7, color: '#333' }}>{sections.summary}</p>
        </div>
      )}

      {/* Skills */}
      {sections.skills?.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#2563eb', marginBottom: '10px', fontFamily: 'Arial, sans-serif' }}>Technical Skills</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {sections.skills.map((skill, i) => (
              <span key={i} style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '4px', padding: '3px 10px', fontSize: '12px', fontFamily: 'Arial, sans-serif' }}>
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Experience */}
      {sections.experience?.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#2563eb', marginBottom: '10px', fontFamily: 'Arial, sans-serif' }}>Work Experience</h2>
          {sections.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: '#1e3a5f', fontFamily: 'Arial, sans-serif' }}>{exp.title || 'Position'}</div>
                  <div style={{ color: '#555', fontSize: '13px', fontStyle: 'italic' }}>{exp.company}</div>
                </div>
                {exp.duration && <div style={{ fontSize: '12px', color: '#888' }}>{exp.duration}</div>}
              </div>
              {exp.bullets?.length > 0 && (
                <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                  {exp.bullets.map((b, j) => (
                    <li key={j} style={{ fontSize: '13px', color: '#333', marginBottom: '4px', lineHeight: 1.6 }}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {sections.education?.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#2563eb', marginBottom: '10px', fontFamily: 'Arial, sans-serif' }}>Education</h2>
          {sections.education.map((edu, i) => (
            <div key={i} style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: '#1e3a5f', fontFamily: 'Arial, sans-serif' }}>{edu.institution}</div>
                <div style={{ fontSize: '13px', color: '#555' }}>{edu.degree}</div>
              </div>
              {edu.year && <div style={{ fontSize: '12px', color: '#888' }}>{edu.year}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Projects */}
      {sections.projects?.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#2563eb', marginBottom: '10px', fontFamily: 'Arial, sans-serif' }}>Projects</h2>
          {sections.projects.map((proj, i) => (
            <div key={i} style={{ marginBottom: '12px' }}>
              <div style={{ fontWeight: 700, fontSize: '14px', color: '#1e3a5f', fontFamily: 'Arial, sans-serif' }}>{proj.name}</div>
              <p style={{ fontSize: '13px', color: '#333', lineHeight: 1.6 }}>{proj.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Certifications */}
      {sections.certifications?.length > 0 && (
        <div>
          <h2 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#2563eb', marginBottom: '10px', fontFamily: 'Arial, sans-serif' }}>Certifications</h2>
          {sections.certifications.map((cert, i) => (
            <div key={i} style={{ fontSize: '13px', color: '#333', marginBottom: '4px' }}>• {cert}</div>
          ))}
        </div>
      )}
    </div>
  );
}
