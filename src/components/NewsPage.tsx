import { useState, useEffect } from 'react';
import { supabase, type Post } from '../lib/supabase';

export default function NewsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [selected, setSelected] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('posts')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setPosts(data);
        setLoading(false);
      });
  }, []);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  if (loading) return <div className="loading">Loading news…</div>;

  return (
    <div className="news-page">
      <div className="news-header">
        <h1>News &amp; Commentary</h1>
        <p className="news-sub">Research notes and market commentary from the investment team.</p>
      </div>

      {selected ? (
        <div className="post-view">
          <button className="back-btn" onClick={() => setSelected(null)}>← Back to news</button>
          <article className="post-article">
            <header className="post-head">
              <span className="post-date">{formatDate(selected.created_at)}</span>
              <h2>{selected.title}</h2>
            </header>
            <div
              className="post-content"
              dangerouslySetInnerHTML={{ __html: selected.content ?? '' }}
            />
          </article>
        </div>
      ) : (
        <>
          {posts.length === 0 ? (
            <div className="empty-state"><p>No posts published yet.</p></div>
          ) : (
            <div className="posts-list">
              {posts.map(post => (
                <article
                  key={post.id}
                  className="post-card"
                  onClick={() => setSelected(post)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && setSelected(post)}
                >
                  <span className="post-date">{formatDate(post.created_at)}</span>
                  <h2>{post.title}</h2>
                  {post.excerpt && <p className="post-excerpt">{post.excerpt}</p>}
                  <span className="read-more">Read more →</span>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      <style>{`
        .loading { padding: 3rem; text-align: center; color: #8a8a8a; }
        .news-header { margin-bottom: 2rem; }
        .news-header h1 { font-family: 'EB Garamond', serif; font-size: 2rem; font-weight: 400; color: #0f1d2f; margin-bottom: 0.25rem; }
        .news-sub { color: #8a8a8a; font-size: 0.95rem; }
        .empty-state { padding: 3rem; text-align: center; background: #fff; border: 1px solid #e0ddd6; color: #8a8a8a; }

        .posts-list { display: flex; flex-direction: column; gap: 0; border: 1px solid #e0ddd6; background: #fff; border-radius: 2px; overflow: hidden; }
        .post-card {
          padding: 1.75rem 2rem;
          border-bottom: 1px solid #e0ddd6;
          cursor: pointer;
          transition: background 0.15s;
        }
        .post-card:last-child { border-bottom: none; }
        .post-card:hover { background: #f8f6f0; }
        .post-date {
          display: block;
          font-size: 0.78rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #c9a84c;
          font-weight: 600;
          margin-bottom: 0.4rem;
        }
        .post-card h2 {
          font-family: 'EB Garamond', serif;
          font-size: 1.25rem;
          font-weight: 400;
          color: #0f1d2f;
          margin-bottom: 0.4rem;
        }
        .post-excerpt { font-size: 0.875rem; color: #666; line-height: 1.55; margin-bottom: 0.75rem; }
        .read-more { font-size: 0.82rem; color: #c9a84c; font-weight: 500; }

        /* Single post view */
        .back-btn {
          background: none;
          border: none;
          color: #8a8a8a;
          cursor: pointer;
          font-family: inherit;
          font-size: 0.875rem;
          padding: 0;
          margin-bottom: 1.5rem;
          transition: color 0.15s;
        }
        .back-btn:hover { color: #0f1d2f; }
        .post-article {
          background: #fff;
          border: 1px solid #e0ddd6;
          padding: 2.5rem;
          max-width: 720px;
          border-top: 3px solid #c9a84c;
        }
        .post-head { margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid #e0ddd6; }
        .post-head .post-date { display: block; margin-bottom: 0.5rem; }
        .post-head h2 {
          font-family: 'EB Garamond', serif;
          font-size: 1.8rem;
          font-weight: 400;
          color: #0f1d2f;
        }
        .post-content p { color: #444; line-height: 1.8; margin-bottom: 1rem; font-size: 0.95rem; }
        .post-content h2, .post-content h3 {
          font-family: 'EB Garamond', serif;
          font-weight: 400;
          color: #0f1d2f;
          margin: 1.5rem 0 0.5rem;
        }
        .post-content h2 { font-size: 1.35rem; }
        .post-content h3 { font-size: 1.1rem; }
        .post-content ul, .post-content ol { color: #444; padding-left: 1.5rem; margin-bottom: 1rem; line-height: 1.8; }
      `}</style>
    </div>
  );
}
