import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function AdminOverview() {
  const [counts, setCounts] = useState({ letters: 0, posts: 0, users: 0, drafts: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [lettersRes, postsRes, usersRes, draftsRes] = await Promise.all([
        supabase.from('letters').select('id', { count: 'exact' }).eq('status', 'published'),
        supabase.from('posts').select('id', { count: 'exact' }).eq('status', 'published'),
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('letters').select('id', { count: 'exact' }).eq('status', 'draft'),
      ]);
      setCounts({
        letters: lettersRes.count ?? 0,
        posts: postsRes.count ?? 0,
        users: usersRes.count ?? 0,
        drafts: draftsRes.count ?? 0,
      });
      setLoading(false);
    }
    load();
  }, []);

  const stats = [
    { label: 'Published Letters', value: counts.letters, href: '/admin/letters', color: '#c9a84c' },
    { label: 'Published Posts', value: counts.posts, href: '/admin/posts', color: '#c9a84c' },
    { label: 'Draft Letters', value: counts.drafts, href: '/admin/letters', color: '#8a8a8a' },
    { label: 'Registered Users', value: counts.users, href: '/admin/users', color: '#c9a84c' },
  ];

  return (
    <div className="admin-overview">
      <div className="page-header">
        <h1>Admin Overview</h1>
        <p className="page-sub">Portal management dashboard.</p>
      </div>

      {loading ? (
        <div className="loading">Loading…</div>
      ) : (
        <>
          <div className="stats-grid">
            {stats.map(stat => (
              <a href={stat.href} key={stat.label} className="stat-card">
                <span className="stat-value" style={{ color: stat.color }}>{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </a>
            ))}
          </div>

          <div className="quick-actions">
            <h2>Quick Actions</h2>
            <div className="action-buttons">
              <a href="/admin/letters" className="action-btn">Upload New Letter</a>
              <a href="/admin/posts" className="action-btn">Write News Post</a>
              <a href="/admin/users" className="action-btn">Invite Investor</a>
            </div>
          </div>
        </>
      )}

      <style>{`
        .loading { padding: 2rem; color: #8a8a8a; }
        .page-header { margin-bottom: 2rem; }
        .page-header h1 { font-family: 'EB Garamond', serif; font-size: 2rem; font-weight: 400; color: #0f1d2f; margin-bottom: 0.25rem; }
        .page-sub { color: #8a8a8a; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2.5rem; }
        .stat-card {
          background: #fff;
          border: 1px solid #e0ddd6;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          text-decoration: none;
          transition: box-shadow 0.2s, transform 0.2s;
          border-radius: 2px;
        }
        .stat-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.07); transform: translateY(-1px); }
        .stat-value { font-size: 2.5rem; font-family: 'EB Garamond', serif; font-weight: 400; line-height: 1; }
        .stat-label { font-size: 0.8rem; color: #8a8a8a; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 500; }
        .quick-actions h2 { font-family: 'EB Garamond', serif; font-size: 1.3rem; font-weight: 400; color: #0f1d2f; margin-bottom: 1rem; }
        .action-buttons { display: flex; gap: 0.75rem; flex-wrap: wrap; }
        .action-btn {
          padding: 0.7rem 1.5rem;
          background: #0f1d2f;
          color: #fff;
          border-radius: 2px;
          font-size: 0.875rem;
          font-weight: 500;
          text-decoration: none;
          transition: background 0.2s;
        }
        .action-btn:hover { background: #1a2f47; color: #fff; }
        @media (max-width: 768px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
      `}</style>
    </div>
  );
}
