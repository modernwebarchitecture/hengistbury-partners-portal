import { useState, useEffect } from 'react';
import { supabase, type Letter } from '../lib/supabase';

export default function LettersArchive() {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('letters')
      .select('*')
      .eq('status', 'published')
      .order('date', { ascending: false })
      .then(({ data }) => {
        if (data) setLetters(data);
        setLoading(false);
      });
  }, []);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  async function openSignedUrl(path: string) {
    const storagePath = path.includes('/documents/') ? path.split('/documents/')[1] : path;
    const { data } = await supabase.storage.from('documents').createSignedUrl(storagePath, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  }

  if (loading) return <div className="loading">Loading letters…</div>;

  return (
    <div className="letters-archive">
      <div className="archive-header">
        <h1>Investor Letters</h1>
        <p className="archive-sub">Quarterly letters to investors — most recent first.</p>
      </div>

      {letters.length === 0 ? (
        <div className="empty-state">
          <p>No letters have been published yet.</p>
        </div>
      ) : (
        <div className="letters-list">
          {letters.map(letter => (
            <article key={letter.id} className="letter-item">
              <div className="letter-info">
                <span className="letter-date">{formatDate(letter.date)}</span>
                <h2>{letter.title}</h2>
                {letter.description && <p className="letter-desc">{letter.description}</p>}
              </div>
              <div className="letter-action">
                {letter.file_url ? (
                  <button
                    onClick={() => openSignedUrl(letter.file_url!)}
                    className="btn btn-primary"
                  >
                    Download PDF
                  </button>
                ) : (
                  <span className="no-file">PDF coming soon</span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <style>{`
        .loading { padding: 3rem; text-align: center; color: #8a8a8a; }
        .archive-header { margin-bottom: 2rem; }
        .archive-header h1 { font-family: 'EB Garamond', serif; font-size: 2rem; font-weight: 400; color: #0f1d2f; margin-bottom: 0.25rem; }
        .archive-sub { color: #8a8a8a; font-size: 0.95rem; }
        .empty-state { padding: 3rem; text-align: center; background: #fff; border: 1px solid #e0ddd6; color: #8a8a8a; }
        .letters-list { display: flex; flex-direction: column; gap: 0; border: 1px solid #e0ddd6; background: #fff; border-radius: 2px; overflow: hidden; }
        .letter-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.75rem 2rem;
          border-bottom: 1px solid #e0ddd6;
          gap: 2rem;
          transition: background 0.15s;
        }
        .letter-item:last-child { border-bottom: none; }
        .letter-item:hover { background: #f8f6f0; }
        .letter-info { flex: 1; }
        .letter-date {
          display: block;
          font-size: 0.78rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #c9a84c;
          font-weight: 600;
          margin-bottom: 0.35rem;
        }
        .letter-info h2 {
          font-family: 'EB Garamond', serif;
          font-size: 1.2rem;
          font-weight: 400;
          color: #0f1d2f;
          margin-bottom: 0.35rem;
        }
        .letter-desc { font-size: 0.875rem; color: #666; line-height: 1.55; }
        .btn {
          display: inline-block; padding: 0.6rem 1.25rem; border-radius: 2px;
          font-family: inherit; font-size: 0.875rem; font-weight: 500;
          text-decoration: none; transition: all 0.2s; border: none; cursor: pointer;
          white-space: nowrap;
        }
        .btn-primary { background: #c9a84c; color: #0f1d2f; }
        .btn-primary:hover { background: #e8c878; }
        .no-file { font-size: 0.82rem; color: #8a8a8a; font-style: italic; }
        @media (max-width: 600px) {
          .letter-item { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </div>
  );
}
