import { useState, useEffect, useRef } from 'react';
import { supabase, type Letter } from '../lib/supabase';

export default function AdminLetters() {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ title: '', date: '', description: '', status: 'draft' as 'draft' | 'published' });
  const [msg, setMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadLetters() {
    const { data } = await supabase.from('letters').select('*').order('date', { ascending: false });
    if (data) setLetters(data);
    setLoading(false);
  }

  useEffect(() => { loadLetters(); }, []);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setUploading(true);
    setMsg('');

    const file = fileRef.current?.files?.[0];
    let fileUrl: string | null = null;

    if (file) {
      const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file, { contentType: 'application/pdf' });

      if (uploadError) {
        setMsg(`Upload failed: ${uploadError.message}`);
        setUploading(false);
        return;
      }

      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(fileName);
      fileUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from('letters').insert({
      title: form.title,
      date: form.date,
      description: form.description || null,
      file_url: fileUrl,
      status: form.status,
    });

    if (error) {
      setMsg(`Error: ${error.message}`);
    } else {
      setMsg('Letter saved successfully.');
      setForm({ title: '', date: '', description: '', status: 'draft' });
      if (fileRef.current) fileRef.current.value = '';
      await loadLetters();
    }
    setUploading(false);
  }

  async function handleDelete(id: string, fileUrl: string | null) {
    if (!confirm('Delete this letter?')) return;

    if (fileUrl) {
      const path = fileUrl.split('/documents/')[1];
      if (path) await supabase.storage.from('documents').remove([path]);
    }

    await supabase.from('letters').delete().eq('id', id);
    setLetters(prev => prev.filter(l => l.id !== id));
  }

  async function toggleStatus(letter: Letter) {
    const newStatus = letter.status === 'published' ? 'draft' : 'published';
    await supabase.from('letters').update({ status: newStatus }).eq('id', letter.id);
    setLetters(prev => prev.map(l => l.id === letter.id ? { ...l, status: newStatus } : l));
  }

  return (
    <div className="admin-letters">
      <div className="page-header">
        <h1>Letter Management</h1>
        <p className="page-sub">Upload and manage quarterly investor letters.</p>
      </div>

      <section className="upload-section">
        <h2>Upload New Letter</h2>
        <form onSubmit={handleUpload} className="upload-form">
          {msg && <div className={`msg ${msg.startsWith('Error') || msg.startsWith('Upload') ? 'msg-error' : 'msg-ok'}`}>{msg}</div>}
          <div className="form-row">
            <div className="form-group">
              <label>Title *</label>
              <input type="text" required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Q3 2024 Investor Letter" />
            </div>
            <div className="form-group">
              <label>Date *</label>
              <input type="date" required value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief summary (optional)" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>PDF File</label>
              <input type="file" accept="application/pdf" ref={fileRef} />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as 'draft' | 'published' }))}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={uploading}>
            {uploading ? 'Saving…' : 'Save Letter'}
          </button>
        </form>
      </section>

      <section className="letters-section">
        <h2>Existing Letters</h2>
        {loading ? (
          <p className="loading">Loading…</p>
        ) : letters.length === 0 ? (
          <p className="empty">No letters yet.</p>
        ) : (
          <table className="letters-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Title</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {letters.map(letter => (
                <tr key={letter.id}>
                  <td className="date-cell">{letter.date}</td>
                  <td className="title-cell">
                    {letter.title}
                    {letter.description && <p className="desc-small">{letter.description}</p>}
                  </td>
                  <td>
                    <span className={`badge ${letter.status === 'published' ? 'badge-published' : 'badge-draft'}`}>
                      {letter.status}
                    </span>
                  </td>
                  <td className="actions-cell">
                    {letter.file_url && (
                      <a href={letter.file_url} target="_blank" rel="noreferrer" className="action-link">View PDF</a>
                    )}
                    <button className="action-link" onClick={() => toggleStatus(letter)}>
                      {letter.status === 'published' ? 'Unpublish' : 'Publish'}
                    </button>
                    <button className="action-link danger" onClick={() => handleDelete(letter.id, letter.file_url)}>Delete</button>
                  </td>
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
        .upload-section, .letters-section { background: #fff; border: 1px solid #e0ddd6; padding: 2rem; margin-bottom: 1.5rem; border-radius: 2px; }
        h2 { font-family: 'EB Garamond', serif; font-size: 1.3rem; font-weight: 400; color: #0f1d2f; margin-bottom: 1.25rem; }
        .upload-form { display: flex; flex-direction: column; gap: 1rem; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.35rem; }
        label { font-size: 0.82rem; font-weight: 500; color: #444; text-transform: uppercase; letter-spacing: 0.05em; }
        input[type="text"], input[type="date"], textarea, select {
          padding: 0.65rem 0.85rem;
          border: 1.5px solid #e0ddd6;
          border-radius: 2px;
          font-family: inherit;
          font-size: 0.9rem;
          color: #1a1a2e;
          transition: border-color 0.2s;
          background: #fafaf9;
        }
        input:focus, textarea:focus, select:focus { outline: none; border-color: #c9a84c; }
        textarea { resize: vertical; }
        input[type="file"] { padding: 0.5rem 0; border: none; font-size: 0.875rem; background: none; }
        .btn { display: inline-block; padding: 0.65rem 1.5rem; border-radius: 2px; font-family: inherit; font-size: 0.875rem; font-weight: 500; cursor: pointer; border: none; transition: all 0.2s; }
        .btn-primary { background: #c9a84c; color: #0f1d2f; align-self: flex-start; }
        .btn-primary:hover:not(:disabled) { background: #e8c878; }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .msg { padding: 0.65rem 1rem; border-radius: 2px; font-size: 0.875rem; }
        .msg-ok { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .msg-error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .loading, .empty { color: #8a8a8a; font-size: 0.9rem; font-style: italic; }
        .letters-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
        .letters-table th { text-align: left; padding: 0.6rem 0.75rem; border-bottom: 2px solid #e0ddd6; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #8a8a8a; font-weight: 600; }
        .letters-table td { padding: 0.85rem 0.75rem; border-bottom: 1px solid #e0ddd6; vertical-align: top; }
        .letters-table tr:last-child td { border-bottom: none; }
        .date-cell { white-space: nowrap; color: #8a8a8a; font-size: 0.82rem; }
        .title-cell { font-weight: 500; color: #0f1d2f; }
        .desc-small { font-size: 0.8rem; color: #8a8a8a; font-weight: 400; margin-top: 0.2rem; }
        .badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
        .badge-published { background: #d4edda; color: #155724; }
        .badge-draft { background: #fff3cd; color: #856404; }
        .actions-cell { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; }
        .action-link { background: none; border: none; cursor: pointer; font-family: inherit; font-size: 0.82rem; color: #c9a84c; padding: 0; text-decoration: none; transition: color 0.15s; }
        .action-link:hover { color: #0f1d2f; }
        .action-link.danger { color: #c0392b; }
        .action-link.danger:hover { color: #e74c3c; }
        @media (max-width: 600px) { .form-row { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
