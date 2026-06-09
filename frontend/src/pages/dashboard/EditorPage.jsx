import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Save, Download, BarChart2, Zap, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import useResumeStore from '../../store/resumeStore';
import useJDStore from '../../store/jdStore';
import useAuthStore from '../../store/authStore';
import useUIStore from '../../store/uiStore';
import toast from 'react-hot-toast';

// ── Small helpers ────────────────────────────────────────────────────────────

const X_ICON = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const SectionField = ({ label, value, onChange, multiline = false, placeholder = '' }) => (
  <div style={{ marginBottom: '12px' }}>
    <label className="label">{label}</label>
    {multiline ? (
      <textarea className="input" value={value || ''} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} style={{ minHeight: '80px', resize: 'vertical' }} />
    ) : (
      <input type="text" className="input" value={value || ''} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)} />
    )}
  </div>
);

function SectionPanel({ title, expanded, onToggle, children }) {
  return (
    <div className="glass" style={{ padding: '14px' }}>
      <button onClick={onToggle} style={{
        width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'none', border: 'none', cursor: 'pointer', color: 'white',
        fontWeight: 600, fontSize: '13px', marginBottom: expanded ? '12px' : 0,
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
      <input className="input" placeholder="Add skill…" value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && val.trim()) { onAdd(val.trim()); setVal(''); } }}
        style={{ flex: 1, fontSize: '13px', padding: '8px 12px' }} />
      <button onClick={() => { if (val.trim()) { onAdd(val.trim()); setVal(''); } }}
        style={{ background: 'rgba(79,142,247,0.2)', border: '1px solid rgba(79,142,247,0.3)', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: 'var(--accent-blue)' }}>
        <Plus size={16} />
      </button>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function EditorPage() {
  const { id } = useParams();
  const { currentResume, fetchResume, updateResume, optimizeResume, reparseResume, loading, optimizing } = useResumeStore();
  const { analyzeJD, analyzing, missingSkills } = useJDStore();
  const { user } = useAuthStore();
  const { openSubscriptionModal } = useUIStore();

  const [sections, setSections] = useState(null);
  const [jdText, setJdText] = useState('');
  const [showJD, setShowJD] = useState(false);
  const [expanded, setExpanded] = useState({ personal: true, summary: true, experience: true, education: true, skills: true });
  const [saving, setSaving] = useState(false);
  const [reparsing, setReparsing] = useState(false);
  const [useOptimized, setUseOptimized] = useState(false);

  useEffect(() => { if (id) fetchResume(id); }, [id]);

  useEffect(() => {
    if (currentResume) {
      const s = useOptimized && currentResume.optimizedSections
        ? currentResume.optimizedSections
        : currentResume.parsedSections;
      setSections(JSON.parse(JSON.stringify(s)));
    }
  }, [currentResume, useOptimized]);

  const toggle = (sec) => setExpanded((p) => ({ ...p, [sec]: !p[sec] }));

  const updateField = (path, value) => {
    setSections((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const parts = path.split('.');
      let obj = next;
      for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
      obj[parts[parts.length - 1]] = value;
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await updateResume(id, { parsedSections: sections });
    setSaving(false);
    if (result.success) toast.success('Resume saved!');
    else toast.error(result.message || 'Save failed');
  };

  const handleReparse = async () => {
    setReparsing(true);
    const result = await reparseResume(id);
    setReparsing(false);
    if (result.success) {
      toast.success('Resume re-parsed with improved AI parser!');
      setUseOptimized(false);
    } else {
      toast.error(result.message || 'Re-parse failed');
    }
  };

  const handleAnalyzeJD = async () => {
    if (!jdText.trim()) return toast.error('Please paste a job description');
    const result = await analyzeJD({ description: jdText, resumeId: id });
    if (result.success) toast.success(`Analyzed! Match score: ${result.matchScore}%`);
    else toast.error(result.message);
  };

  const handleOptimize = async () => {
    if (!jdText.trim()) { toast.error('Paste a job description first'); setShowJD(true); return; }
    const result = await optimizeResume(id, jdText, missingSkills);
    if (result.success) { setUseOptimized(true); toast.success('AI Optimized! 🎉'); }
    else toast.error(result.message);
  };

  const handleDownloadPDF = async () => {
    const { default: html2pdf } = await import('html2pdf.js');
    const element = document.getElementById('resume-preview');
    if (!element) return toast.error('Preview not visible');
    html2pdf().set({
      margin: [10, 10, 10, 10],
      filename: `${currentResume?.title || 'resume'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    }).from(element).save();
    toast.success('Downloading PDF…');
  };

  // Experience helpers
  const addExperience = () => {
    const exps = [...(sections.experience || []), { company: '', title: '', duration: '', bullets: [''] }];
    updateField('experience', exps);
  };
  const removeExperience = (i) => {
    const exps = [...sections.experience]; exps.splice(i, 1);
    updateField('experience', exps);
  };
  const updateExp = (i, field, val) => {
    const exps = JSON.parse(JSON.stringify(sections.experience));
    exps[i][field] = val; updateField('experience', exps);
  };
  const addBullet = (i) => {
    const exps = JSON.parse(JSON.stringify(sections.experience));
    exps[i].bullets = [...(exps[i].bullets || []), ''];
    updateField('experience', exps);
  };
  const updateBullet = (ei, bi, val) => {
    const exps = JSON.parse(JSON.stringify(sections.experience));
    exps[ei].bullets[bi] = val; updateField('experience', exps);
  };
  const removeBullet = (ei, bi) => {
    const exps = JSON.parse(JSON.stringify(sections.experience));
    exps[ei].bullets.splice(bi, 1); updateField('experience', exps);
  };

  // Education helpers
  const addEducation = () => {
    const eds = [...(sections.education || []), { institution: '', degree: '', year: '', gpa: '' }];
    updateField('education', eds);
  };
  const removeEducation = (i) => {
    const eds = [...sections.education]; eds.splice(i, 1);
    updateField('education', eds);
  };
  const updateEdu = (i, field, val) => {
    const eds = JSON.parse(JSON.stringify(sections.education));
    eds[i][field] = val; updateField('education', eds);
  };

  if (loading || !sections) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div className="spinner spinner-lg" />
    </div>
  );

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>

      {/* ── Left Panel: Editor ── */}
      <div style={{
        width: '420px', flexShrink: 0,
        borderRight: '1px solid var(--border)',
        overflowY: 'auto', padding: '20px',
        display: 'flex', flexDirection: 'column', gap: '12px',
      }}>
        {/* Header */}
        <div>
          <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '4px' }}>{currentResume?.title}</h2>
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
              <BarChart2 size={14} /> ATS
            </button>
          </Link>
          <button onClick={handleReparse} disabled={reparsing} className="btn-secondary"
            style={{ flex: 1, justifyContent: 'center', padding: '8px', fontSize: '12px', color: 'var(--accent-purple)', borderColor: 'rgba(139,92,246,0.3)' }}
            title="Re-run the parser on the original file to fix garbled data">
            {reparsing ? <div className="spinner" style={{ width: '12px', height: '12px' }} /> : '🔄'}
            Re-parse
          </button>
        </div>

        {/* Optimized Toggle */}
        {currentResume?.optimizedSections && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <input type="checkbox" id="useOpt" checked={useOptimized} onChange={(e) => setUseOptimized(e.target.checked)} style={{ cursor: 'pointer' }} />
            <label htmlFor="useOpt" style={{ fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>Show AI-optimized version</label>
          </div>
        )}

        {/* JD Section */}
        <div className="glass" style={{ padding: '14px' }}>
          <button onClick={() => setShowJD(!showJD)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'white', fontWeight: 600, fontSize: '13px' }}>
            <span>🎯 Job Description</span>
            {showJD ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showJD && (
            <div style={{ marginTop: '10px' }}>
              <textarea className="input" placeholder="Paste job description here…" value={jdText} onChange={(e) => setJdText(e.target.value)} style={{ minHeight: '120px', fontSize: '13px' }} />
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button onClick={handleAnalyzeJD} disabled={analyzing} className="btn-secondary" style={{ flex: 1, fontSize: '12px', padding: '8px' }}>
                  {analyzing ? <div className="spinner" style={{ width: '12px', height: '12px' }} /> : null} Analyze
                </button>
                <button onClick={handleOptimize} disabled={optimizing} className="btn-primary" style={{ flex: 1, fontSize: '12px', padding: '8px' }}>
                  {optimizing ? <div className="spinner" style={{ width: '12px', height: '12px' }} /> : <Zap size={12} />} Optimize
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Personal Info */}
        <SectionPanel title="Personal Info" expanded={expanded.personal} onToggle={() => toggle('personal')}>
          <SectionField label="Full Name" value={sections.name} onChange={(v) => updateField('name', v)} placeholder="Your full name" />
          <SectionField label="Email" value={sections.email} onChange={(v) => updateField('email', v)} placeholder="email@example.com" />
          <SectionField label="Phone" value={sections.phone} onChange={(v) => updateField('phone', v)} placeholder="+91 9999999999" />
          <SectionField label="Location" value={sections.location} onChange={(v) => updateField('location', v)} placeholder="City, State" />
          <SectionField label="LinkedIn" value={sections.linkedin} onChange={(v) => updateField('linkedin', v)} placeholder="linkedin.com/in/username" />
        </SectionPanel>

        {/* Summary */}
        <SectionPanel title="Professional Summary" expanded={expanded.summary} onToggle={() => toggle('summary')}>
          <SectionField label="Summary" value={sections.summary} onChange={(v) => updateField('summary', v)} multiline placeholder="Write a concise professional summary…" />
        </SectionPanel>

        {/* Experience */}
        <SectionPanel title="Work Experience" expanded={expanded.experience} onToggle={() => toggle('experience')}>
          {(sections.experience || []).map((exp, i) => (
            <div key={i} style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Experience {i + 1}</span>
                <button onClick={() => removeExperience(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-red)', padding: '2px' }}>
                  <Trash2 size={13} />
                </button>
              </div>
              <SectionField label="Job Title" value={exp.title} onChange={(v) => updateExp(i, 'title', v)} placeholder="e.g. Software Engineer" />
              <SectionField label="Company" value={exp.company} onChange={(v) => updateExp(i, 'company', v)} placeholder="e.g. Google" />
              <SectionField label="Duration" value={exp.duration} onChange={(v) => updateExp(i, 'duration', v)} placeholder="e.g. Jan 2022 – Present" />
              {/* Bullets */}
              <div style={{ marginTop: '4px' }}>
                <label className="label">Bullet Points</label>
                {(exp.bullets || []).map((b, bi) => (
                  <div key={bi} style={{ display: 'flex', gap: '6px', marginBottom: '6px', alignItems: 'flex-start' }}>
                    <textarea className="input" value={b} onChange={(e) => updateBullet(i, bi, e.target.value)}
                      placeholder="Describe achievement…"
                      style={{ flex: 1, minHeight: '52px', fontSize: '12px', resize: 'vertical' }} />
                    <button onClick={() => removeBullet(i, bi)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-red)', paddingTop: '4px' }}>
                      <X_ICON size={12} />
                    </button>
                  </div>
                ))}
                <button onClick={() => addBullet(i)} style={{ fontSize: '12px', color: 'var(--accent-blue)', background: 'none', border: '1px dashed rgba(79,142,247,0.4)', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', width: '100%' }}>
                  + Add Bullet
                </button>
              </div>
            </div>
          ))}
          <button onClick={addExperience} className="btn-secondary" style={{ width: '100%', justifyContent: 'center', padding: '8px', fontSize: '13px' }}>
            <Plus size={14} /> Add Experience
          </button>
        </SectionPanel>

        {/* Education */}
        <SectionPanel title="Education" expanded={expanded.education} onToggle={() => toggle('education')}>
          {(sections.education || []).map((edu, i) => (
            <div key={i} style={{ marginBottom: '14px', paddingBottom: '14px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Education {i + 1}</span>
                <button onClick={() => removeEducation(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-red)' }}>
                  <Trash2 size={13} />
                </button>
              </div>
              <SectionField label="Institution" value={edu.institution} onChange={(v) => updateEdu(i, 'institution', v)} placeholder="University name" />
              <SectionField label="Degree" value={edu.degree} onChange={(v) => updateEdu(i, 'degree', v)} placeholder="e.g. B.Tech Computer Science" />
              <SectionField label="Year" value={edu.year} onChange={(v) => updateEdu(i, 'year', v)} placeholder="e.g. 2022" />
              <SectionField label="GPA (optional)" value={edu.gpa} onChange={(v) => updateEdu(i, 'gpa', v)} placeholder="e.g. 8.5/10" />
            </div>
          ))}
          <button onClick={addEducation} className="btn-secondary" style={{ width: '100%', justifyContent: 'center', padding: '8px', fontSize: '13px' }}>
            <Plus size={14} /> Add Education
          </button>
        </SectionPanel>

        {/* Skills */}
        <SectionPanel title="Skills" expanded={expanded.skills} onToggle={() => toggle('skills')}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
            {(sections.skills || []).map((skill, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(79,142,247,0.1)', border: '1px solid rgba(79,142,247,0.2)', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', color: 'var(--accent-blue)' }}>
                {skill}
                <button onClick={() => { const s = [...sections.skills]; s.splice(i, 1); updateField('skills', s); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-red)', padding: '0', lineHeight: 1 }}>
                  <X_ICON size={10} />
                </button>
              </div>
            ))}
          </div>
          <SkillAdder onAdd={(skill) => updateField('skills', [...(sections.skills || []), skill])} />
        </SectionPanel>
      </div>

      {/* ── Right Panel: Resume Preview ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px', background: '#e8ecf0' }}>
        <ResumePreview sections={sections} title={currentResume?.title} />
      </div>
    </div>
  );
}

// ── Resume Preview Component ─────────────────────────────────────────────────

function ResumePreview({ sections }) {
  if (!sections) return null;

  return (
    <div id="resume-preview" style={{
      background: 'white',
      color: '#1a1a2e',
      maxWidth: '780px',
      margin: '0 auto',
      padding: '48px 56px',
      fontFamily: '"Times New Roman", Georgia, serif',
      boxShadow: '0 4px 32px rgba(0,0,0,0.18)',
      minHeight: '1100px',
      position: 'relative',
    }}>

      {/* ── NAME & CONTACT ── */}
      <div style={{ textAlign: 'center', borderBottom: '2px solid #1e3a8a', paddingBottom: '16px', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#1e3a8a', fontFamily: 'Arial, sans-serif', marginBottom: '8px' }}>
          {sections.name || 'Your Name'}
        </h1>
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '6px 20px', fontSize: '12px', color: '#444' }}>
          {sections.email && <span>✉ {sections.email}</span>}
          {sections.phone && <span>📞 {sections.phone}</span>}
          {sections.location && <span>📍 {sections.location}</span>}
          {sections.linkedin && <span>🔗 {sections.linkedin}</span>}
        </div>
      </div>

      {/* ── PROFESSIONAL SUMMARY ── */}
      {sections.summary && (
        <Section title="Professional Summary">
          <p style={{ fontSize: '13px', lineHeight: 1.75, color: '#333', margin: 0 }}>{sections.summary}</p>
        </Section>
      )}

      {/* ── WORK EXPERIENCE ── */}
      {sections.experience?.length > 0 && (
        <Section title="Work Experience">
          {sections.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: i < sections.experience.length - 1 ? '16px' : 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2px' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#1e293b', fontFamily: 'Arial, sans-serif' }}>
                    {exp.title || (exp.company ? '' : '(No title)')}
                  </div>
                  {exp.company && (
                    <div style={{ fontSize: '13px', color: '#1e3a8a', fontStyle: 'italic' }}>{exp.company}</div>
                  )}
                </div>
                {exp.duration && (
                  <div style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap', marginLeft: '12px', marginTop: '2px' }}>{exp.duration}</div>
                )}
              </div>
              {exp.bullets?.filter(b => b?.trim()).length > 0 && (
                <ul style={{ margin: '6px 0 0', paddingLeft: '18px' }}>
                  {exp.bullets.filter(b => b?.trim()).map((b, j) => (
                    <li key={j} style={{ fontSize: '13px', color: '#333', marginBottom: '3px', lineHeight: 1.6 }}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </Section>
      )}

      {/* ── EDUCATION ── */}
      {sections.education?.length > 0 && (
        <Section title="Education">
          {sections.education.map((edu, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: i < sections.education.length - 1 ? '12px' : 0 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px', color: '#1e293b', fontFamily: 'Arial, sans-serif' }}>{edu.institution}</div>
                <div style={{ fontSize: '13px', color: '#555' }}>{edu.degree}</div>
                {edu.gpa && <div style={{ fontSize: '12px', color: '#64748b' }}>GPA: {edu.gpa}</div>}
              </div>
              {edu.year && <div style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap', marginLeft: '12px' }}>{edu.year}</div>}
            </div>
          ))}
        </Section>
      )}

      {/* ── TECHNICAL SKILLS ── */}
      {sections.skills?.length > 0 && (
        <Section title="Technical Skills">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {sections.skills.map((skill, i) => (
              <span key={i} style={{
                background: '#eff6ff', color: '#1d4ed8',
                border: '1px solid #bfdbfe', borderRadius: '3px',
                padding: '2px 9px', fontSize: '12px', fontFamily: 'Arial, sans-serif',
              }}>{skill}</span>
            ))}
          </div>
        </Section>
      )}

      {/* ── PROJECTS ── */}
      {sections.projects?.length > 0 && (
        <Section title="Projects">
          {sections.projects.map((proj, i) => (
            <div key={i} style={{ marginBottom: i < sections.projects.length - 1 ? '12px' : 0 }}>
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#1e293b', fontFamily: 'Arial, sans-serif' }}>{proj.name}</div>
              {proj.description && <p style={{ fontSize: '13px', color: '#444', margin: '3px 0 0', lineHeight: 1.6 }}>{proj.description}</p>}
              {proj.technologies?.length > 0 && (
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
                  <em>Technologies: {proj.technologies.join(', ')}</em>
                </div>
              )}
            </div>
          ))}
        </Section>
      )}

      {/* ── CERTIFICATIONS ── */}
      {sections.certifications?.length > 0 && (
        <Section title="Certifications">
          {sections.certifications.map((cert, i) => (
            <div key={i} style={{ fontSize: '13px', color: '#333', marginBottom: '4px' }}>• {cert}</div>
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <h2 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#1e3a8a', fontFamily: 'Arial, sans-serif', margin: 0 }}>
          {title}
        </h2>
        <div style={{ flex: 1, height: '1px', background: '#1e3a8a', opacity: 0.3 }} />
      </div>
      {children}
    </div>
  );
}
