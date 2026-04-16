import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav id="navbar" style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      background: 'rgba(255,255,255,0.75)',
      borderBottom: '1px solid var(--color-border)',
    }}>
      <div style={{
        maxWidth: '1280px', margin: '0 auto',
        padding: '0.75rem 1.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link to={user ? '/dashboard' : '/'} style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          textDecoration: 'none', color: 'inherit',
        }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: '18px',
          }}>⚙</div>
          <span style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--color-primary-700)' }}>DocMind AI</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {user ? (
            <>
              <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{user.email}</span>
              <button onClick={handleLogout} style={{
                padding: '0.5rem 1rem', borderRadius: '8px',
                border: '1px solid var(--color-border)', background: 'white',
                cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500,
              }}>Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ textDecoration: 'none', color: 'var(--color-text)', fontWeight: 500, fontSize: '0.9rem' }}>Log in</Link>
              <Link to="/signup" style={{
                textDecoration: 'none', padding: '0.5rem 1.25rem',
                background: 'var(--color-primary-600)', color: 'white',
                borderRadius: '8px', fontWeight: 600, fontSize: '0.9rem',
              }}>Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
