import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError || !data.user) {
      setError(authError?.message || 'Sign in failed. Please check your credentials.');
      setLoading(false);
      return;
    }

    // Fetch the user's role to determine redirect destination
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (profile?.role === 'admin') {
      window.location.href = '/admin';
    } else {
      window.location.href = '/portal';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      {error && <div className="login-error">{error}</div>}

      <div className="form-group">
        <label htmlFor="email">Email address</label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          disabled={loading}
        />
      </div>

      <button type="submit" className="login-btn" disabled={loading}>
        {loading ? 'Signing in…' : 'Sign In'}
      </button>

      <style>{`
        .login-form { display: flex; flex-direction: column; gap: 1.25rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.4rem; }
        label { font-size: 0.875rem; font-weight: 500; color: rgba(255,255,255,0.85); }
        input {
          padding: 0.8rem 1rem;
          background: rgba(255,255,255,0.08);
          border: 1.5px solid rgba(255,255,255,0.15);
          border-radius: 2px;
          color: #fff;
          font-family: inherit;
          font-size: 0.95rem;
          transition: border-color 0.2s;
        }
        input::placeholder { color: rgba(255,255,255,0.3); }
        input:focus { outline: none; border-color: #c9a84c; }
        input:disabled { opacity: 0.6; }
        .login-btn {
          padding: 0.85rem;
          background: #c9a84c;
          color: #0f1d2f;
          border: none;
          border-radius: 2px;
          font-family: inherit;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
          letter-spacing: 0.03em;
        }
        .login-btn:hover:not(:disabled) { background: #e8c878; }
        .login-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .login-error {
          padding: 0.75rem 1rem;
          background: rgba(192,57,43,0.2);
          border: 1px solid rgba(192,57,43,0.4);
          border-radius: 2px;
          color: #ff8a80;
          font-size: 0.875rem;
        }
      `}</style>
    </form>
  );
}
