import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import useResumeStore from '../../store/resumeStore';
import useAuthStore from '../../store/authStore';
import useUIStore from '../../store/uiStore';
import toast from 'react-hot-toast';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const { uploadResume, uploading } = useResumeStore();
  const { user, refreshProfile } = useAuthStore();
  const { openSubscriptionModal } = useUIStore();
  const navigate = useNavigate();

  const uploadsRemaining = user?.subscriptionPlan === 'premium'
    ? Infinity
    : Math.max(0, 2 - (user?.uploadCount || 0));

  const onDrop = useCallback((accepted, rejected) => {
    if (rejected.length > 0) {
      toast.error('Only PDF and DOCX files are accepted (max 5MB)');
      return;
    }
    if (accepted.length > 0) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
  });

  const handleUpload = async () => {
    if (!file) return toast.error('Please select a file first');

    if (uploadsRemaining <= 0) {
      openSubscriptionModal();
      return;
    }

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('title', title || file.name.replace(/\.\w+$/, ''));

    const result = await uploadResume(formData);

    if (result.limitReached) {
      openSubscriptionModal();
      return;
    }

    if (result.success) {
      await refreshProfile();
      toast.success('Resume uploaded and parsed successfully! 🎉');
      navigate(`/dashboard/editor/${result.resume._id}`);
    } else {
      toast.error(result.message || 'Upload failed');
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '700px' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="section-title">Upload Resume</h1>
        <p className="section-subtitle">Upload your PDF or DOCX resume for AI-powered parsing and optimization</p>

        {/* Upload Limit Warning */}
        {user?.subscriptionPlan === 'free' && (
          <div style={{
            padding: '14px 18px',
            borderRadius: '10px',
            background: uploadsRemaining > 0 ? 'rgba(79,142,247,0.08)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${uploadsRemaining > 0 ? 'rgba(79,142,247,0.2)' : 'rgba(239,68,68,0.2)'}`,
            marginBottom: '24px',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            {uploadsRemaining > 0
              ? <><CheckCircle size={16} color="var(--accent-blue)" /> <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}><strong style={{ color: 'var(--accent-blue)' }}>{uploadsRemaining} free upload{uploadsRemaining !== 1 ? 's' : ''}</strong> remaining</span></>
              : <><AlertCircle size={16} color="var(--accent-red)" /> <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Free limit reached. <strong style={{ color: 'var(--accent-red)' }}>Upgrade to Premium</strong> for unlimited uploads.</span></>
            }
          </div>
        )}

        {/* Drop Zone */}
        <div
          {...getRootProps()}
          style={{
            border: `2px dashed ${file ? 'var(--accent-green)' : dragOver ? 'var(--accent-blue)' : 'var(--border)'}`,
            borderRadius: '16px',
            padding: '60px 40px',
            textAlign: 'center',
            cursor: 'pointer',
            background: file ? 'rgba(16,185,129,0.05)' : dragOver ? 'rgba(79,142,247,0.05)' : 'rgba(255,255,255,0.02)',
            transition: 'all 0.2s ease',
            marginBottom: '24px',
          }}
          onDragEnter={() => setDragOver(true)}
          onDragLeave={() => setDragOver(false)}
          onDrop={() => setDragOver(false)}
        >
          <input {...getInputProps()} />

          {file ? (
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
              <CheckCircle size={48} color="var(--accent-green)" style={{ margin: '0 auto 16px' }} />
              <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '4px', color: 'white' }}>{file.name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                {(file.size / 1024).toFixed(0)} KB · {file.name.endsWith('.pdf') ? 'PDF' : 'DOCX'}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                style={{
                  marginTop: '16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: '8px', padding: '6px 16px', color: 'var(--accent-red)',
                  fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px',
                }}
              >
                <X size={12} /> Remove
              </button>
            </motion.div>
          ) : (
            <>
              <Upload size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
              <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '8px' }}>
                Drop your resume here, or <span style={{ color: 'var(--accent-blue)' }}>browse</span>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                Supports PDF and DOCX · Max 5MB
              </div>
            </>
          )}
        </div>

        {/* Title Input */}
        <div style={{ marginBottom: '24px' }}>
          <label className="label">Resume Title (optional)</label>
          <input
            type="text"
            className="input"
            placeholder={file ? file.name.replace(/\.\w+$/, '') : 'e.g., Software Engineer Resume'}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '15px' }}
        >
          {uploading ? (
            <><div className="spinner" /> Parsing Resume...</>
          ) : (
            <><FileText size={18} /> Parse & Analyze Resume</>
          )}
        </button>

        {/* Tips */}
        <div className="glass" style={{ padding: '20px', marginTop: '24px' }}>
          <div style={{ fontWeight: 600, marginBottom: '12px', fontSize: '14px' }}>💡 Tips for best results</div>
          {[
            'Use a text-based PDF (not scanned/image)',
            'Include clear section headers (Experience, Skills, Education)',
            'Avoid tables and complex formatting',
            'Make sure your contact info is at the top',
          ].map((tip) => (
            <div key={tip} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
              <span style={{ color: 'var(--accent-blue)', marginTop: '2px' }}>→</span>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{tip}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
