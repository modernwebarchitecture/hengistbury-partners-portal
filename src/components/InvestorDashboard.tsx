import { useState, useEffect } from 'react';
import { supabase, type Letter, type Post } from '../lib/supabase';

export default function InvestorDashboard() {
  const [latestLetter, setLatestLetter] = useState<Letter | null>(null);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [letterRes, postsRes] = await Promise.all([
        supabase
          .from('letters')
          .select('*')
          .eq('status', 'published')
          .order('date', { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from('posts')
          .select('*')
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(3),
      ]);
      if (letterRes.data) setLatestLetter(letterRes.data);
      if (postsRes.data) setRecentPosts(postsRes.data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="loading">Loading…</div>;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Investor Dashboard</h1>
        <p className="dashboard-sub">Welcome to the Hengistbury Investment Partners portal.</p>
      </div>

      <div className="dashboard-grid">
        {/* Latest letter */}
        <section className="dash-card dash-card--featured">
          <div className="dash-card-label">Latest Quarterly Letter</div>
          {latestLetter ? (
            <>
              <h2>{latestLetter.title}</h2>
              <p className="dash-meta">
                {new Date(latestLetter.date).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'long', year: 'numeric'
                })}
              </p>
              {latestLetter.description && (
                <p className="dash-desc">{latestLetter.description}</p>
              )}
              <div className="dash-card-actions">
                {latestLetter.file_url && (
                  <a href={latestLetter.file_url} target="_blank" rel="noreferrer" className="btn btn-primary">
                    Download PDF
                  </a>
                )}
                <a href="/portal/letters" className="btn btn-outline">All Letters</a>
              </div>
            </>
          ) : (
            <p className="dash-empty">No letters published yet.</p>
          )}
        </section>

        {/* Recent news */}
        <section className="dash-card">
          <div className="dash-card-label">Recent News</div>
          {recentPosts.length > 0 ? (
            <div className="news-list">
              {recentPosts.map(post => (
                <article key={post.id} className="news-item">
                  <h3>{post.title}</h3>
                  {post.excerpt && <p className="news-excerpt">{post.excerpt}</p>}
                  <span className="news-date">
                    {new Date(post.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </span>
                </article>
              ))}
              <a href="/portal/news" className="view-all">View all news →</a>
            </div>
          ) : (
            <p className="dash-empty">No news posts yet.</p>
          )}
        </section>
      </div>

      <style>{`
        .loading { padding: 3rem; text-align: center; color: #8a8a8a; }
        .dashboard-header { margin-bottom: 2rem; }
        .dashboard-header h1 { font-family: 'EB Garamond', serif; font-size: 2rem; font-weight: 400; color: #0f1d2f; margin-bottom: 0.25rem; }
        .dashboard-sub { color: #8a8a8a; font-size: 0.95rem; }
        .dashboard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        .dash-card {
          background: #fff;
          border: 1px solid #e0ddd6;
          padding: 2rem;
          border-radius: 2px;
        }
        .dash-card--featured { border-top: 3px solid #c9a84c; }
        .dash-card-label {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-weight: 600;
          color: #c9a84c;
          margin-bottom: 1rem;
        }
        .dash-card h2 {
          font-family: 'EB Garamond', serif;
          font-size: 1.4rem;
          font-weight: 400;
          color: #0f1d2f;
          margin-bottom: 0.4rem;
        }
        .dash-meta { font-size: 0.85rem; color: #8a8a8a; margin-bottom: 0.75rem; }
        .dash-desc { color: #555; font-size: 0.9rem; line-height: 1.65; margin-bottom: 1.5rem; }
        .dash-card-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
        .btn {
          display: inline-block; padding: 0.6rem 1.25rem; border-radius: 2px;
          font-family: inherit; font-size: 0.875rem; font-weight: 500; cursor: pointer; border: none;
          text-decoration: none; transition: all 0.2s;
        }
        .btn-primary { background: #c9a84c; color: #0f1d2f; }
        .btn-primary:hover { background: #e8c878; }
        .btn-outline { background: transparent; border: 1.5px solid #c9a84c; color: #c9a84c; }
        .btn-outline:hover { background: #c9a84c; color: #0f1d2f; }
        .dash-empty { color: #8a8a8a; font-size: 0.9rem; font-style: italic; }
        .news-list { display: flex; flex-direction: column; gap: 0; }
        .news-item {
          padding: 1rem 0;
          border-bottom: 1px solid #e0ddd6;
        }
        .news-item:first-child { padding-top: 0; }
        .news-item h3 {
          font-family: 'EB Garamond', serif;
          font-size: 1.05rem;
          font-weight: 400;
          color: #0f1d2f;
          margin-bottom: 0.25rem;
        }
        .news-excerpt { font-size: 0.85rem; color: #666; line-height: 1.5; margin-bottom: 0.4rem; }
        .news-date { font-size: 0.78rem; color: #8a8a8a; }
        .view-all {
          display: inline-block; margin-top: 1rem;
          color: #c9a84c; font-size: 0.875rem; font-weight: 500;
          text-decoration: none;
        }
        .view-all:hover { text-decoration: underline; }
        @media (max-width: 768px) { .dashboard-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
