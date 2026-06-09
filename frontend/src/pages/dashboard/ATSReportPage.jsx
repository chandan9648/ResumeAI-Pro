import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { ArrowLeft, AlertTriangle, CheckCircle, TrendingUp, Lightbulb } from 'lucide-react';
import useResumeStore from '../../store/resumeStore';

const ScoreBadge = ({ score }) => {
  if (score >= 80) return <span className="badge badge-green">Excellent</span>;
  if (score >= 60) return <span className="badge badge-blue">Good</span>;
  if (score >= 40) return <span className="badge badge-yellow">Fair</span>;
  return <span className="badge badge-red">Poor</span>;
};

const getColor = (score) => {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#4f8ef7';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
};

const categoryLabels = {
  keywordMatch: 'Keyword Match',
  skillMatch: 'Skill Match',
  sectionCompleteness: 'Section Completeness',
  formatting: 'Formatting Quality',
  readability: 'Readability',
};

const categoryWeights = {
  keywordMatch: 35,
  skillMatch: 25,
  sectionCompleteness: 20,
  formatting: 10,
  readability: 10,
};

const improvements = {
  keywordMatch: 'Add more keywords from the job description throughout your resume.',
  skillMatch: 'Include the required technical skills from the JD in your Skills section.',
  sectionCompleteness: 'Ensure your resume has: Name, Email, Phone, Summary, Skills, Experience, and Education.',
  formatting: 'Use clear section headers, bullet points, and avoid tables or graphics.',
  readability: 'Keep bullet points concise (8–20 words). Use strong action verbs.',
};

export default function ATSReportPage() {
  const { id } = useParams();
  const { currentResume, fetchResume, loading } = useResumeStore();

  useEffect(() => { if (id) fetchResume(id); }, [id]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div className="spinner spinner-lg" />
    </div>
  );

  if (!currentResume) return (
    <div className="page-container" style={{ textAlign: 'center', paddingTop: '60px' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
      <p style={{ color: 'var(--text-secondary)' }}>Resume not found</p>
      <Link to="/dashboard/versions" className="btn-primary" style={{ marginTop: '16px', display: 'inline-flex' }}>Back to Resumes</Link>
    </div>
  );

  const score = currentResume.atsScore || 0;
  const breakdown = currentResume.atsBreakdown || {};

  return (
    <div className="page-container">
      <Link to={`/dashboard/editor/${id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '14px', marginBottom: '24px' }}>
        <ArrowLeft size={16} /> Back to Editor
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="section-title">ATS Compatibility Report</h1>
        <p className="section-subtitle">{currentResume.title}</p>

        {/* Main Score */}
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px', marginBottom: '32px' }}>
          <div className="glass" style={{ padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '140px', height: '140px', marginBottom: '20px' }}>
              <CircularProgressbar
                value={score}
                text={`${score}%`}
                styles={buildStyles({
                  textSize: '18px',
                  textColor: getColor(score),
                  pathColor: getColor(score),
                  trailColor: 'rgba(255,255,255,0.08)',
                  pathTransitionDuration: 1,
                })}
              />
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>ATS Score</div>
            <ScoreBadge score={score} />
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', marginTop: '12px', lineHeight: 1.5 }}>
              {score >= 80 ? 'Your resume is highly ATS-compatible.' :
               score >= 60 ? 'Good score — a few tweaks will improve it further.' :
               score >= 40 ? 'Fair — optimize your resume using the JD to improve.' :
               'Your resume needs significant optimization to pass ATS systems.'}
            </p>
          </div>

          {/* Breakdown */}
          <div className="glass" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>Score Breakdown</h3>
            {Object.entries(categoryLabels).map(([key, label]) => {
              const val = breakdown[key] || 0;
              return (
                <div key={key} style={{ marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div>
                      <span style={{ fontSize: '14px', fontWeight: 500 }}>{label}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>({categoryWeights[key]}% weight)</span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: getColor(val) }}>{val}%</span>
                  </div>
                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${val}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      style={{ height: '100%', background: getColor(val), borderRadius: '4px' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Missing Skills */}
        {currentResume.atsBreakdown && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
            <div className="glass" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={16} color="var(--accent-yellow)" /> Areas to Improve
              </h3>
              {Object.entries(breakdown)
                .filter(([_, v]) => v < 70)
                .map(([key, val]) => (
                  <div key={key} style={{ marginBottom: '12px', padding: '12px', background: 'rgba(245,158,11,0.06)', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.1)' }}>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--accent-yellow)', marginBottom: '4px' }}>
                      {categoryLabels[key]} — {val}%
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {improvements[key]}
                    </div>
                  </div>
                ))}
              {Object.values(breakdown).every((v) => v >= 70) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-green)' }}>
                  <CheckCircle size={16} /> All categories are performing well!
                </div>
              )}
            </div>

            <div className="glass" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lightbulb size={16} color="var(--accent-blue)" /> Quick Wins
              </h3>
              {[
                { check: (breakdown.keywordMatch || 0) < 70, tip: 'Run the JD analyzer and use the keywords it identifies.' },
                { check: (breakdown.skillMatch || 0) < 70, tip: 'Add skills listed in the JD that you actually have.' },
                { check: (breakdown.sectionCompleteness || 0) < 80, tip: 'Add a professional Summary section of 3–4 sentences.' },
                { check: true, tip: 'Click "Optimize AI" in the editor to auto-improve all sections.' },
              ].filter((q) => q.check).map((q, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <TrendingUp size={14} color="var(--accent-blue)" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{q.tip}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link to={`/dashboard/editor/${id}`} className="btn-primary">
            ✏️ Go to Editor & Optimize
          </Link>
          <Link to="/dashboard/upload" className="btn-secondary">
            📤 Upload New Resume
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
