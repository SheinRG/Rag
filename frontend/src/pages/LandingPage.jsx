import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';

const steps = [
  { icon: '☁️', label: 'STEP 01', title: 'Upload', desc: 'Drop your PDF, TXT, or Markdown files. We process them in seconds.', color: '#06b6d4' },
  { icon: '💬', label: 'STEP 02', title: 'Ask', desc: 'Type any question in natural language. Our AI understands context.', color: '#8b5cf6' },
  { icon: '⚙', label: 'STEP 03', title: 'Get Answers', desc: 'Receive grounded answers with exact source citations from your documents.', color: '#10b981' },
];

const features = [
  { icon: '🔒', title: 'Private & Secure', desc: 'Your documents are stored in your private account. No one else can access them.', color: '#f59e0b' },
  { icon: '⚡', title: 'Instant Answers', desc: 'Powered by state-of-the-art LLMs with sub-second response times via Groq.', color: '#f59e0b' },
  { icon: '📎', title: 'Source Citations', desc: 'Every answer shows exactly which document and section it came from.', color: '#8b5cf6' },
];

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background)' }}>
      <Navbar />

      {/* Hero */}
      <section style={{
        paddingTop: '8rem', paddingBottom: '5rem',
        textAlign: 'center', maxWidth: '900px', margin: '0 auto', padding: '8rem 1.5rem 5rem',
        background: 'linear-gradient(180deg, rgba(99,102,241,0.08) 0%, transparent 60%)',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          background: 'white', border: '1px solid var(--color-border)',
          borderRadius: '999px', padding: '0.4rem 1rem', fontSize: '0.85rem',
          color: 'var(--color-text-secondary)', marginBottom: '2rem',
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></span>
          Powered by AI • Free to use
        </div>

        <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: '1.5rem' }}>
          Ask Questions.<br />
          <span style={{ background: 'linear-gradient(135deg, var(--color-primary-500), #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Get Answers.
          </span><br />
          From Your Documents.
        </h1>

        <p style={{ fontSize: '1.15rem', color: 'var(--color-text-secondary)', maxWidth: '600px', margin: '0 auto 2.5rem', lineHeight: 1.6 }}>
          Upload any PDF, TXT, or Markdown file and instantly ask natural-language questions.
          DocMind AI reads your documents so you don't have to.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/signup" style={{
            padding: '0.85rem 2rem', background: 'var(--color-primary-600)', color: 'white',
            borderRadius: '12px', fontWeight: 600, fontSize: '1rem', textDecoration: 'none',
          }}>Get Started Free →</Link>
          <a href="#how-it-works" style={{
            padding: '0.85rem 2rem', background: 'white', color: 'var(--color-text)',
            borderRadius: '12px', fontWeight: 600, fontSize: '1rem', textDecoration: 'none',
            border: '1px solid var(--color-border)',
          }}>See How It Works</a>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" style={{ padding: '5rem 1.5rem', maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Three steps to instant answers</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem', marginBottom: '3rem' }}>No setup required. Works in your browser.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
          {steps.map((s) => (
            <div key={s.title} style={{
              background: 'white', borderRadius: '16px', padding: '2rem',
              border: '1px solid var(--color-border)', textAlign: 'left',
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: '12px',
                background: `linear-gradient(135deg, ${s.color}22, ${s.color}44)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.25rem', marginBottom: '1.5rem',
              }}>{s.icon}</div>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>{s.label}</p>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{s.title}</h3>
              <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{
        padding: '5rem 1.5rem',
        background: 'linear-gradient(180deg, rgba(99,102,241,0.05) 0%, transparent 100%)',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Built for privacy and speed</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem', marginBottom: '3rem' }}>Enterprise-grade features, free for everyone.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            {features.map((f) => (
              <div key={f.title} style={{
                background: 'white', borderRadius: '16px', padding: '2rem',
                border: '1px solid var(--color-border)', textAlign: 'left',
              }}>
                <span style={{ fontSize: '1.5rem', marginBottom: '1rem', display: 'block' }}>{f.icon}</span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>{f.title}</h3>
                <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: '4rem 1.5rem', margin: '0 1.5rem 3rem',
        background: 'linear-gradient(135deg, var(--color-primary-600), #7c3aed)',
        borderRadius: '24px', textAlign: 'center', color: 'white',
      }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem' }}>Start for free. No credit card required.</h2>
        <p style={{ opacity: 0.85, marginBottom: '2rem', fontSize: '1.1rem' }}>
          Join thousands of users who save hours every week with DocMind AI.
        </p>
        <Link to="/signup" style={{
          padding: '0.85rem 2rem', background: 'white', color: 'var(--color-primary-700)',
          borderRadius: '12px', fontWeight: 700, fontSize: '1rem', textDecoration: 'none',
        }}>Create Free Account →</Link>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '2rem 1.5rem', borderTop: '1px solid var(--color-border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        maxWidth: '1280px', margin: '0 auto', color: 'var(--color-text-muted)', fontSize: '0.85rem',
      }}>
        <span>DocMind AI</span>
        <span>© 2026 DocMind AI. All rights reserved.</span>
      </footer>
    </div>
  );
}
