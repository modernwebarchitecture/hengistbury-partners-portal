import { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { supabase, type Post } from '../lib/supabase';

function MenuBar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null;

  const btn = (action: () => void, label: string, active?: boolean) => (
    <button
      type="button"
      key={label}
      onClick={action}
      className={`tiptap-btn${active ? ' is-active' : ''}`}
      title={label}
    >
      {label}
    </button>
  );

  return (
    <div className="tiptap-menu">
      {btn(() => editor.chain().focus().toggleBold().run(), 'B', editor.isActive('bold'))}
      {btn(() => editor.chain().focus().toggleItalic().run(), 'I', editor.isActive('italic'))}
      {btn(() => editor.chain().focus().toggleHeading({ level: 2 }).run(), 'H2', editor.isActive('heading', { level: 2 }))}
      {btn(() => editor.chain().focus().toggleHeading({ level: 3 }).run(), 'H3', editor.isActive('heading', { level: 3 }))}
      {btn(() => editor.chain().focus().toggleBulletList().run(), '• List', editor.isActive('bulletList'))}
      {btn(() => editor.chain().focus().toggleOrderedList().run(), '1. List', editor.isActive('orderedList'))}
      {btn(() => editor.chain().focus().toggleBlockquote().run(), 'Quote', editor.isActive('blockquote'))}
      {btn(() => editor.chain().focus().setHorizontalRule().run(), '─')}
      {btn(() => editor.chain().focus().undo().run(), '↩')}
      {btn(() => editor.chain().focus().redo().run(), '↪')}
    </div>
  );
}

type EditorProps = {
  post: Post | null;
  onSaved: () => void;
  onCancel: () => void;
};

function PostEditor({ post, onSaved, onCancel }: EditorProps) {
  const [title, setTitle] = useState(post?.title ?? '');
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? '');
  const [status, setStatus] = useState<'draft' | 'published'>(post?.status ?? 'draft');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const editor = useEditor({
    extensions: [StarterKit, Link.configure({ openOnClick: false })],
    content: post?.content ?? '<p>Start writing your post here…</p>',
  });

  async function handleSave() {
    setSaving(true);
    setMsg('');
    const content = editor?.getHTML() ?? '';
    const payload = { title, excerpt: excerpt || null, content, status };

    let error;
    if (post) {
      ({ error } = await supabase.from('posts').update(payload).eq('id', post.id));
    } else {
      ({ error } = await supabase.from('posts').insert(payload));
    }

    setSaving(false);
    if (error) {
      setMsg(`Error: ${error.message}`);
    } else {
      setMsg('Post saved.');
      setTimeout(onSaved, 800);
    }
  }

  return (
    <div className="post-editor">
      <div className="editor-header">
        <h2>{post ? 'Edit Post' : 'New Post'}</h2>
        <button onClick={onCancel} className="cancel-btn">← Back to list</button>
      </div>

      {msg && <div className={`msg ${msg.startsWith('Error') ? 'msg-error' : 'msg-ok'}`}>{msg}</div>}

      <div className="form-group">
        <label>Title *</label>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Post title" required />
      </div>

      <div className="form-group">
        <label>Excerpt</label>
        <input type="text" value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="Short summary (optional)" />
      </div>

      <div className="form-group">
        <label>Content</label>
        <div className="editor-wrap">
          <MenuBar editor={editor} />
          <EditorContent editor={editor} className="tiptap-content" />
        </div>
      </div>

      <div className="editor-footer">
        <select value={status} onChange={e => setStatus(e.target.value as 'draft' | 'published')} className="status-select">
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
        <button onClick={handleSave} disabled={saving || !title} className="btn btn-primary">
          {saving ? 'Saving…' : 'Save Post'}
        </button>
      </div>
    </div>
  );
}

export default function AdminPosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Post | 'new' | null>(null);

  async function loadPosts() {
    const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    if (data) setPosts(data);
    setLoading(false);
  }

  useEffect(() => { loadPosts(); }, []);

  async function handleDelete(id: string) {
    if (!confirm('Delete this post?')) return;
    await supabase.from('posts').delete().eq('id', id);
    setPosts(prev => prev.filter(p => p.id !== id));
  }

  async function toggleStatus(post: Post) {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    await supabase.from('posts').update({ status: newStatus }).eq('id', post.id);
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, status: newStatus } : p));
  }

  if (editing !== null) {
    return (
      <PostEditor
        post={editing === 'new' ? null : editing}
        onSaved={() => { setEditing(null); loadPosts(); }}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <div className="admin-posts">
      <div className="page-header">
        <div>
          <h1>News Posts</h1>
          <p className="page-sub">Create and manage investor news and commentary.</p>
        </div>
        <button onClick={() => setEditing('new')} className="btn btn-primary">New Post</button>
      </div>

      {loading ? (
        <p className="loading">Loading…</p>
      ) : posts.length === 0 ? (
        <div className="empty-state">
          <p>No posts yet.</p>
          <button onClick={() => setEditing('new')} className="btn btn-primary" style={{ marginTop: '1rem' }}>Create first post</button>
        </div>
      ) : (
        <div className="posts-table-wrap">
          <table className="posts-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map(post => (
                <tr key={post.id}>
                  <td className="title-cell">
                    {post.title}
                    {post.excerpt && <p className="excerpt-small">{post.excerpt}</p>}
                  </td>
                  <td>
                    <span className={`badge ${post.status === 'published' ? 'badge-published' : 'badge-draft'}`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="date-cell">
                    {new Date(post.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="actions-cell">
                    <button className="action-link" onClick={() => setEditing(post)}>Edit</button>
                    <button className="action-link" onClick={() => toggleStatus(post)}>
                      {post.status === 'published' ? 'Unpublish' : 'Publish'}
                    </button>
                    <button className="action-link danger" onClick={() => handleDelete(post.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
        .page-header h1 { font-family: 'EB Garamond', serif; font-size: 2rem; font-weight: 400; color: #0f1d2f; margin-bottom: 0.25rem; }
        .page-sub { color: #8a8a8a; }
        .btn { display: inline-block; padding: 0.65rem 1.5rem; border-radius: 2px; font-family: inherit; font-size: 0.875rem; font-weight: 500; cursor: pointer; border: none; transition: all 0.2s; text-decoration: none; }
        .btn-primary { background: #c9a84c; color: #0f1d2f; }
        .btn-primary:hover:not(:disabled) { background: #e8c878; }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .loading { color: #8a8a8a; font-style: italic; }
        .empty-state { background: #fff; border: 1px solid #e0ddd6; padding: 3rem; text-align: center; color: #8a8a8a; }
        .posts-table-wrap { background: #fff; border: 1px solid #e0ddd6; border-radius: 2px; overflow: hidden; }
        .posts-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
        .posts-table th { text-align: left; padding: 0.65rem 1rem; border-bottom: 2px solid #e0ddd6; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; color: #8a8a8a; font-weight: 600; }
        .posts-table td { padding: 0.9rem 1rem; border-bottom: 1px solid #e0ddd6; vertical-align: top; }
        .posts-table tr:last-child td { border-bottom: none; }
        .title-cell { font-weight: 500; color: #0f1d2f; }
        .excerpt-small { font-size: 0.8rem; color: #8a8a8a; font-weight: 400; margin-top: 0.2rem; }
        .date-cell { white-space: nowrap; color: #8a8a8a; font-size: 0.82rem; }
        .badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.72rem; font-weight: 600; text-transform: uppercase; }
        .badge-published { background: #d4edda; color: #155724; }
        .badge-draft { background: #fff3cd; color: #856404; }
        .actions-cell { display: flex; gap: 0.75rem; align-items: center; }
        .action-link { background: none; border: none; cursor: pointer; font-family: inherit; font-size: 0.82rem; color: #c9a84c; padding: 0; transition: color 0.15s; }
        .action-link:hover { color: #0f1d2f; }
        .action-link.danger { color: #c0392b; }
        .action-link.danger:hover { color: #e74c3c; }

        /* Editor styles */
        .post-editor { max-width: 800px; }
        .editor-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .editor-header h2 { font-family: 'EB Garamond', serif; font-size: 1.6rem; font-weight: 400; color: #0f1d2f; }
        .cancel-btn { background: none; border: none; color: #8a8a8a; cursor: pointer; font-family: inherit; font-size: 0.875rem; transition: color 0.15s; }
        .cancel-btn:hover { color: #0f1d2f; }
        .form-group { display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 1.25rem; }
        label { font-size: 0.8rem; font-weight: 600; color: #444; text-transform: uppercase; letter-spacing: 0.05em; }
        input[type="text"] {
          padding: 0.65rem 0.85rem; border: 1.5px solid #e0ddd6; border-radius: 2px;
          font-family: inherit; font-size: 0.9rem; color: #1a1a2e; background: #fafaf9;
          transition: border-color 0.2s;
        }
        input:focus { outline: none; border-color: #c9a84c; }
        .editor-wrap { border: 1.5px solid #e0ddd6; border-radius: 2px; overflow: hidden; }
        .tiptap-menu {
          display: flex; gap: 2px; padding: 0.5rem; background: #f8f6f0;
          border-bottom: 1px solid #e0ddd6; flex-wrap: wrap;
        }
        .tiptap-btn {
          padding: 0.3rem 0.6rem; border: 1px solid transparent; border-radius: 2px;
          background: none; cursor: pointer; font-family: inherit; font-size: 0.82rem;
          font-weight: 500; color: #444; transition: all 0.15s;
        }
        .tiptap-btn:hover { background: #e0ddd6; }
        .tiptap-btn.is-active { background: #0f1d2f; color: #fff; border-color: #0f1d2f; }
        .tiptap-content { padding: 1rem; min-height: 280px; }
        .tiptap-content :global(.ProseMirror) { outline: none; font-size: 0.9rem; line-height: 1.75; color: #1a1a2e; }
        .tiptap-content :global(.ProseMirror p) { margin-bottom: 0.75rem; }
        .tiptap-content :global(.ProseMirror h2) { font-family: 'EB Garamond', serif; font-weight: 400; margin: 1.25rem 0 0.5rem; }
        .tiptap-content :global(.ProseMirror h3) { font-family: 'EB Garamond', serif; font-weight: 400; margin: 1rem 0 0.4rem; }
        .tiptap-content :global(.ProseMirror ul), .tiptap-content :global(.ProseMirror ol) { padding-left: 1.5rem; margin-bottom: 0.75rem; }
        .tiptap-content :global(.ProseMirror blockquote) { border-left: 3px solid #c9a84c; padding-left: 1rem; color: #666; margin: 1rem 0; }
        .editor-footer { display: flex; gap: 1rem; align-items: center; margin-top: 1.25rem; }
        .status-select { padding: 0.6rem 0.85rem; border: 1.5px solid #e0ddd6; border-radius: 2px; font-family: inherit; font-size: 0.875rem; background: #fafaf9; }
        .status-select:focus { outline: none; border-color: #c9a84c; }
        .msg { padding: 0.65rem 1rem; border-radius: 2px; font-size: 0.875rem; margin-bottom: 1rem; }
        .msg-ok { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .msg-error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
      `}</style>
    </div>
  );
}
