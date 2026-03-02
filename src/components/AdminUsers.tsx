import { useState, useEffect } from 'react';
import { supabase, type Profile } from '../lib/supabase';

export default function AdminUsers() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviting, setInviting] = useState(false);
  const [msg, setMsg] = useState('');

  async function loadUsers() {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setUsers(data);
    setLoading(false);
  }

  useEffect(() => { loadUsers(); }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setMsg('');

    // Use Supabase Admin invite (requires service role key on server — here we use signUp for demo)
    // In production, wire this to a server endpoint that calls supabase.auth.admin.inviteUserByEmail()
    const { error } = await supabase.auth.signUp({
      email: inviteEmail,
      password: Math.random().toString(36).slice(-10) + 'Aa1!',
      options: {
        data: { full_name: inviteName, role: 'investor' },
        emailRedirectTo: `${window.location.origin}/portal/login`,
      },
    });

    if (error) {
      setMsg(`Error: ${error.message}`);
    } else {
      setMsg(`Invitation sent to ${inviteEmail}. They will receive an email to set their password.`);
      setInviteEmail('');
      setInviteName('');
      await loadUsers();
    }
    setInviting(false);
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="admin-users">
      <div className="page-header">
        <h1>User Management</h1>
        <p className="page-sub">Invite investors and manage user accounts.</p>
      </div>

      <section className="invite-section">
        <h2>Invite New Investor</h2>
        <p className="invite-note">
          The investor will receive an email with a link to set their password and access the portal.
        </p>
        <form onSubmit={handleInvite} className="invite-form">
          {msg && <div className={`msg ${msg.startsWith('Error') ? 'msg-error' : 'msg-ok'}`}>{msg}</div>}
          <div className="form-row">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={inviteName}
                onChange={e => setInviteName(e.target.value)}
                placeholder="Investor name"
              />
            </div>
            <div className="form-group">
              <label>Email Address *</label>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="investor@example.com"
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={inviting}>
            {inviting ? 'Sending…' : 'Send Invitation'}
          </button>
        </form>
      </section>

      <section className="users-section">
        <h2>Current Users ({loading ? '…' : users.length})</h2>
        {loading ? (
          <p className="loading">Loading…</p>
        ) : users.length === 0 ? (
          <p className="empty">No users found.</p>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.full_name || <span className="na">—</span>}</td>
                  <td className="email-cell">{user.email}</td>
                  <td>
                    <span className={`role-badge ${user.role}`}>{user.role}</span>
                  </td>
                  <td className="date-cell">{formatDate(user.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <style>{`
        .page-header { margin-bottom: 2rem; }
        .page-header h1 { font-family: 'EB Garamond', serif; font-size: 2rem; font-weight: 400; color: #0f1d2f; margin-bottom: 0.25rem; }
        .page-sub { color: #8a8a8a; }
        .invite-section, .users-section { background: #fff; border: 1px solid #e0ddd6; padding: 2rem; margin-bottom: 1.5rem; border-radius: 2px; }
        h2 { font-family: 'EB Garamond', serif; font-size: 1.3rem; font-weight: 400; color: #0f1d2f; margin-bottom: 0.75rem; }
        .invite-note { font-size: 0.875rem; color: #666; margin-bottom: 1.25rem; line-height: 1.55; }
        .invite-form { display: flex; flex-direction: column; gap: 1rem; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.35rem; }
        label { font-size: 0.8rem; font-weight: 600; color: #444; text-transform: uppercase; letter-spacing: 0.05em; }
        input {
          padding: 0.65rem 0.85rem; border: 1.5px solid #e0ddd6; border-radius: 2px;
          font-family: inherit; font-size: 0.9rem; color: #1a1a2e; background: #fafaf9;
          transition: border-color 0.2s;
        }
        input:focus { outline: none; border-color: #c9a84c; }
        .btn { display: inline-block; padding: 0.65rem 1.5rem; border-radius: 2px; font-family: inherit; font-size: 0.875rem; font-weight: 500; cursor: pointer; border: none; transition: all 0.2s; align-self: flex-start; }
        .btn-primary { background: #c9a84c; color: #0f1d2f; }
        .btn-primary:hover:not(:disabled) { background: #e8c878; }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .msg { padding: 0.65rem 1rem; border-radius: 2px; font-size: 0.875rem; }
        .msg-ok { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .msg-error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .loading, .empty { color: #8a8a8a; font-size: 0.9rem; font-style: italic; }
        .users-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
        .users-table th { text-align: left; padding: 0.6rem 0.75rem; border-bottom: 2px solid #e0ddd6; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; color: #8a8a8a; font-weight: 600; }
        .users-table td { padding: 0.85rem 0.75rem; border-bottom: 1px solid #e0ddd6; color: #1a1a2e; }
        .users-table tr:last-child td { border-bottom: none; }
        .email-cell { color: #555; font-size: 0.85rem; }
        .date-cell { white-space: nowrap; color: #8a8a8a; font-size: 0.82rem; }
        .na { color: #ccc; }
        .role-badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
        .role-badge.admin { background: #0f1d2f; color: #c9a84c; }
        .role-badge.investor { background: #e8f4f8; color: #1a4a6b; }
        @media (max-width: 600px) { .form-row { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
