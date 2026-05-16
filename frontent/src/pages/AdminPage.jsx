import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, TrendingUp, DollarSign, FileText, Shield, Trash2, Crown, ArrowLeft, BarChart2 } from 'lucide-react';
import { adminService } from '../services/adminService';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [analyticsRes, usersRes] = await Promise.all([
          adminService.getAnalytics(),
          adminService.getUsers(),
        ]);
        setAnalytics(analyticsRes.data.data);
        setUsers(usersRes.data.data.users);
      } catch (err) {
        toast.error('Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleTogglePlan = async (userId, currentPlan) => {
    const newPlan = currentPlan === 'premium' ? 'free' : 'premium';
    const result = await adminService.updateUserPlan(userId, newPlan);
    if (result.data.success) {
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, subscriptionPlan: newPlan } : u));
      toast.success(`User plan changed to ${newPlan}`);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Delete this user and all their data?')) return;
    const result = await adminService.deleteUser(userId);
    if (result.data.success) {
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      toast.success('User deleted');
    }
  };

  const stats = analytics?.stats;

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', padding: '32px 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '14px' }}>
          <ArrowLeft size={16} /> Dashboard
        </Link>
        <span style={{ color: 'var(--border)' }}>|</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={20} color="var(--accent-purple)" />
          <h1 style={{ fontSize: '22px', fontWeight: 800 }}>Admin Dashboard</h1>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
          <div className="spinner spinner-lg" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            {[
              { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'var(--accent-blue)' },
              { label: 'Premium Users', value: stats?.premiumUsers || 0, icon: Crown, color: 'var(--accent-purple)' },
              { label: 'Free Users', value: stats?.freeUsers || 0, icon: Users, color: 'var(--accent-cyan)' },
              { label: 'Total Resumes', value: stats?.totalResumes || 0, icon: FileText, color: 'var(--accent-green)' },
              { label: 'Total Revenue', value: stats?.revenueFormatted || '₹0', icon: DollarSign, color: 'var(--accent-yellow)' },
            ].map((s) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="glass" style={{ padding: '20px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: `${s.color}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px',
                }}>
                  <s.icon size={18} color={s.color} />
                </div>
                <div style={{ fontSize: '26px', fontWeight: 800, color: s.color, marginBottom: '4px' }}>{s.value}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Recent Payments */}
          {analytics?.recentPayments?.length > 0 && (
            <div className="glass" style={{ padding: '24px', marginBottom: '32px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart2 size={16} color="var(--accent-green)" /> Recent Payments
              </h2>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['User', 'Plan', 'Amount', 'Status', 'Date'].map((h) => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {analytics.recentPayments.map((p) => (
                    <tr key={p._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '12px 16px', fontSize: '13px' }}>{p.userId?.name || 'N/A'}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>{p.plan}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px' }}>₹{((p.amount || 0) / 100).toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px 16px' }}><span className="badge badge-green">{p.status}</span></td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                        {new Date(p.createdAt).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Users Table */}
          <div className="glass" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={16} color="var(--accent-blue)" /> All Users ({users.length})
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['User', 'Email', 'Plan', 'Uploads', 'Joined', 'Actions'].map((h) => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            background: 'var(--gradient-main)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '13px', fontWeight: 700, color: 'white',
                          }}>
                            {u.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: 500 }}>{u.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className={`badge ${u.subscriptionPlan === 'premium' ? 'badge-purple' : 'badge-blue'}`}>
                          {u.subscriptionPlan}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>{u.uploadCount || 0}</td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                        {new Date(u.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleTogglePlan(u._id, u.subscriptionPlan)}
                            style={{
                              padding: '5px 10px', borderRadius: '6px', fontSize: '11px',
                              background: u.subscriptionPlan === 'premium' ? 'rgba(239,68,68,0.1)' : 'rgba(139,92,246,0.1)',
                              border: `1px solid ${u.subscriptionPlan === 'premium' ? 'rgba(239,68,68,0.2)' : 'rgba(139,92,246,0.2)'}`,
                              color: u.subscriptionPlan === 'premium' ? 'var(--accent-red)' : 'var(--accent-purple)',
                              cursor: 'pointer',
                            }}
                          >
                            {u.subscriptionPlan === 'premium' ? 'Downgrade' : 'Upgrade'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u._id)}
                            style={{
                              padding: '5px 8px', borderRadius: '6px', fontSize: '11px',
                              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
                              color: 'var(--accent-red)', cursor: 'pointer',
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
