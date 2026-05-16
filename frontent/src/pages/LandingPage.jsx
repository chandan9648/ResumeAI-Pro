import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Target, FileText, BarChart2, Shield, Star, CheckCircle } from 'lucide-react';

const features = [
  { icon: '🤖', title: 'AI-Powered Optimization', desc: 'GPT-4o rewrites your resume to pass ATS and impress recruiters.' },
  { icon: '📊', title: 'ATS Score Engine', desc: 'Get a detailed compatibility score with actionable improvement tips.' },
  { icon: '🎯', title: 'JD Matcher', desc: 'Paste any job description and see your match score instantly.' },
  { icon: '✏️', title: 'Live Editor', desc: 'Edit every section with a rich real-time preview.' },
  { icon: '📄', title: '4 Pro Templates', desc: 'Modern, ATS-friendly, Minimal, and Creative templates.' },
  { icon: '💾', title: 'Version Control', desc: 'Save unlimited versions. Download anytime as PDF.' },
];

const stats = [
  { value: '50K+', label: 'Resumes Optimized' },
  { value: '92%', label: 'ATS Pass Rate' },
  { value: '3x', label: 'More Interviews' },
  { value: '4.9★', label: 'User Rating' },
];

const testimonials = [
  { name: 'Priya S.', role: 'Software Engineer at Google', text: 'My ATS score went from 42% to 91% after using ResumeAI Pro. Got 3 interview calls in a week!', avatar: 'P' },
  { name: 'Arjun M.', role: 'Data Analyst at Amazon', text: 'The JD matcher is incredible. It showed me exactly what skills were missing and optimized my resume in seconds.', avatar: 'A' },
  { name: 'Sneha K.', role: 'Product Manager at Flipkart', text: 'Best resume tool I have used. The AI rewrites are professional and the ATS score breakdown is super helpful.', avatar: 'S' },
];

export default function LandingPage() {
  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* Navbar */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(10,14,26,0.8)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px', height: '72px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px',
            background: 'var(--gradient-main)',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px',
          }}>📄</div>
          <span style={{ fontWeight: 800, fontSize: '18px' }}>
            Resume<span className="gradient-text">AI</span> Pro
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link to="/login" className="btn-secondary" style={{ padding: '8px 20px' }}>Login</Link>
          <Link to="/signup" className="btn-primary" style={{ padding: '8px 20px' }}>
            Get Started Free <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        paddingTop: '160px', paddingBottom: '100px',
        textAlign: 'center', position: 'relative',
        maxWidth: '900px', margin: '0 auto', padding: '160px 24px 100px',
      }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute', top: '100px', left: '50%',
          transform: 'translateX(-50%)',
          width: '600px', height: '400px',
          background: 'radial-gradient(ellipse, rgba(79,142,247,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(79,142,247,0.1)',
            border: '1px solid rgba(79,142,247,0.3)',
            borderRadius: '20px', padding: '6px 16px',
            fontSize: '13px', color: 'var(--accent-blue)',
            fontWeight: 600, marginBottom: '32px',
          }}>
            <Zap size={14} fill="currentColor" />
            AI-Powered Resume Optimization
          </div>

          <h1 style={{
            fontSize: 'clamp(40px, 6vw, 72px)',
            fontWeight: 900,
            lineHeight: 1.1,
            marginBottom: '24px',
            color: 'white',
          }}>
            Land Your Dream Job<br />
            with an <span className="gradient-text">ATS-Optimized</span><br />
            Resume
          </h1>

          <p style={{
            fontSize: '18px', color: 'var(--text-secondary)',
            maxWidth: '600px', margin: '0 auto 40px',
            lineHeight: 1.7,
          }}>
            Upload your resume, paste a job description, and let our AI optimize it for ATS systems in seconds. 
            Get more interviews, land better jobs.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/signup" className="btn-primary" style={{ padding: '14px 32px', fontSize: '16px' }}>
              Start for Free — 2 Uploads <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="btn-secondary" style={{ padding: '14px 32px', fontSize: '16px' }}>
              Sign In
            </Link>
          </div>

          <div style={{ marginTop: '20px', fontSize: '13px', color: 'var(--text-muted)' }}>
            ✓ No credit card required &nbsp;·&nbsp; ✓ 2 free optimizations &nbsp;·&nbsp; ✓ Cancel anytime
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section style={{ padding: '60px 48px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{ textAlign: 'center' }}
            >
              <div style={{ fontSize: '40px', fontWeight: 900, background: 'var(--gradient-main)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '100px 48px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontSize: '40px', fontWeight: 800, marginBottom: '16px' }}>
              Everything You Need to <span className="gradient-text">Get Hired</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
              Powerful AI tools designed to maximize your job application success rate.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass"
                style={{ padding: '28px', cursor: 'default' }}
              >
                <div style={{ fontSize: '36px', marginBottom: '16px' }}>{f.icon}</div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px' }}>{f.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: '80px 48px', background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '36px', fontWeight: 800, textAlign: 'center', marginBottom: '48px' }}>
            Loved by <span className="gradient-text">Job Seekers</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {testimonials.map((t) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="glass"
                style={{ padding: '28px' }}
              >
                <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
                  {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="var(--accent-yellow)" color="var(--accent-yellow)" />)}
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.7, marginBottom: '20px' }}>
                  "{t.text}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: 'var(--gradient-main)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, color: 'white',
                  }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{t.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section style={{ padding: '100px 48px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '40px', fontWeight: 800, marginBottom: '16px' }}>
            Simple, <span className="gradient-text">Transparent Pricing</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '56px' }}>
            Start free, upgrade when you need more power.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Free */}
            <div className="glass" style={{ padding: '36px', textAlign: 'left' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Free</div>
              <div style={{ fontSize: '40px', fontWeight: 900, marginBottom: '4px' }}>₹0</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '28px' }}>Forever free</div>
              {['2 Resume uploads', 'Basic ATS score', 'Resume editing', 'PDF download'].map((f) => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <CheckCircle size={16} color="var(--accent-green)" />
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{f}</span>
                </div>
              ))}
              <Link to="/signup" className="btn-secondary" style={{ width: '100%', marginTop: '20px', justifyContent: 'center' }}>
                Get Started
              </Link>
            </div>

            {/* Premium */}
            <div style={{
              padding: '36px', textAlign: 'left',
              background: 'linear-gradient(135deg, rgba(79,142,247,0.15) 0%, rgba(139,92,246,0.15) 100%)',
              border: '2px solid rgba(79,142,247,0.4)',
              borderRadius: '16px', position: 'relative',
            }}>
              <div style={{
                position: 'absolute', top: '-12px', right: '20px',
                background: 'var(--gradient-main)',
                color: 'white', fontSize: '11px', fontWeight: 700,
                padding: '4px 12px', borderRadius: '20px',
              }}>MOST POPULAR</div>
              <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Premium</div>
              <div style={{ fontSize: '40px', fontWeight: 900, marginBottom: '4px' }}>
                <span className="gradient-text">₹499</span>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '28px' }}>per month</div>
              {['Unlimited uploads', 'AI optimization (GPT-4o)', 'Advanced ATS scoring', 'All 4 templates', 'JD matching insights', 'AI cover letter'].map((f) => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <CheckCircle size={16} color="var(--accent-blue)" />
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{f}</span>
                </div>
              ))}
              <Link to="/signup" className="btn-primary" style={{ width: '100%', marginTop: '20px', justifyContent: 'center' }}>
                <Zap size={14} /> Start Premium
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: '80px 48px', textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(79,142,247,0.08) 0%, rgba(139,92,246,0.08) 100%)',
        borderTop: '1px solid var(--border)',
      }}>
        <h2 style={{ fontSize: '40px', fontWeight: 800, marginBottom: '16px' }}>
          Ready to Land Your <span className="gradient-text">Dream Job?</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '16px' }}>
          Join 50,000+ job seekers who optimized their resumes with ResumeAI Pro.
        </p>
        <Link to="/signup" className="btn-primary" style={{ padding: '16px 40px', fontSize: '18px' }}>
          Get Started Free <ArrowRight size={18} />
        </Link>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '32px 48px',
        borderTop: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        color: 'var(--text-muted)', fontSize: '13px',
      }}>
        <div>© 2024 ResumeAI Pro. All rights reserved.</div>
        <div style={{ display: 'flex', gap: '24px' }}>
          <a href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Privacy</a>
          <a href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Terms</a>
          <a href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Support</a>
        </div>
      </footer>
    </div>
  );
}
