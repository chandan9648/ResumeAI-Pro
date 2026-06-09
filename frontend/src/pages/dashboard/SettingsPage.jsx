import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Eye, EyeOff, Save, Shield } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (password && password !== confirmPass) return toast.error('Passwords do not match');
    if (password && password.length < 6) return toast.error('Password must be at least 6 characters');

    setSaving(true);
    try {
      const payload = { name };
      if (password) payload.password = password;
      await authService.updateProfile(payload);
      updateUser({ name });
      toast.success('Profile updated successfully!');
      setPassword('');
      setConfirmPass('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '600px' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="section-title">Account Settings</h1>
        <p className="section-subtitle">Manage your profile and security settings</p>

        {/* Profile Card */}
        <div className="glass" style={{ padding: '32px', marginBottom: '24px' }}>
          {/* Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: 'var(--gradient-main)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '28px', fontWeight: 800, color: 'white',
            }}>
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '18px', marginBottom: '4px' }}>{user?.name}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{user?.email}</div>
              {user?.role !== 'admin' && (
                <div style={{ marginTop: '6px' }}>
                  <span className={`badge ${user?.subscriptionPlan === 'premium' ? 'badge-purple' : 'badge-blue'}`}>
                    {user?.subscriptionPlan === 'premium' ? '⭐ Premium' : 'Free Plan'}
                  </span>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSave}>
            {/* Name */}
            <div style={{ marginBottom: '16px' }}>
              <label className="label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" className="input" value={name} onChange={(e) => setName(e.target.value)} style={{ paddingLeft: '42px' }} />
              </div>
            </div>

            {/* Email (readonly) */}
            <div style={{ marginBottom: '24px' }}>
              <label className="label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="email" className="input" value={user?.email || ''} readOnly
                  style={{ paddingLeft: '42px', opacity: 0.6, cursor: 'not-allowed' }} />
              </div>
            </div>

            <div style={{ height: '1px', background: 'var(--border)', marginBottom: '24px' }} />

            {/* Password */}
            <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={16} color="var(--accent-blue)" /> Change Password
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <label className="label">New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type={showPass ? 'text' : 'password'} className="input"
                  placeholder="Leave blank to keep current"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '42px', paddingRight: '42px' }} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '28px' }}>
              <label className="label">Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type={showPass ? 'text' : 'password'} className="input"
                  placeholder="Confirm password"
                  value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)}
                  style={{ paddingLeft: '42px' }} />
              </div>
            </div>

            <button type="submit" disabled={saving} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px' }}>
              {saving ? <><div className="spinner" /> Saving...</> : <><Save size={16} /> Save Changes</>}
            </button>
          </form>
        </div>

        {user?.role !== 'admin' && (
          <div className="glass" style={{ padding: '24px' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '16px', fontSize: '14px' }}>Account Stats</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {[
                { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'N/A' },
                { label: 'Resumes Uploaded', value: user?.uploadCount || 0 },
                { label: 'Plan', value: user?.subscriptionPlan === 'premium' ? '⭐ Premium' : '🆓 Free' },
                { label: 'Role', value: user?.role === 'admin' ? '🛡️ Admin' : '👤 User' },
              ].map((s) => (
                <div key={s.label}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>{s.label}</div>
                  <div style={{ fontWeight: 600, fontSize: '15px' }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
