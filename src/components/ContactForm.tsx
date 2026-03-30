import { useState } from 'react';

export default function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', company: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'sent') {
    return (
      <div className="form-success">
        <h3>Thank you for your enquiry</h3>
        <p>A member of the team will be in touch shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="contact-form">
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="name">Full name *</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={form.name}
            onChange={handleChange}
            placeholder="Your name"
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email address *</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
          />
        </div>
      </div>
      <div className="form-group">
        <label htmlFor="company">Organisation</label>
        <input
          id="company"
          name="company"
          type="text"
          value={form.company}
          onChange={handleChange}
          placeholder="Your organisation (optional)"
        />
      </div>
      <div className="form-group">
        <label htmlFor="message">Message *</label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          value={form.message}
          onChange={handleChange}
          placeholder="How can we help?"
        />
      </div>
      {status === 'error' && (
        <p className="form-error">Something went wrong — please try again or email us directly at info@hengistburypartners.com.</p>
      )}
      <button type="submit" className="btn btn-primary" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Send Enquiry'}
      </button>

      <style>{`
        .contact-form { display: flex; flex-direction: column; gap: 1.25rem; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.4rem; }
        label { font-size: 0.875rem; font-weight: 500; color: #0f1d2f; }
        input, textarea {
          padding: 0.75rem 1rem;
          border: 1.5px solid #e0ddd6;
          border-radius: 2px;
          font-family: inherit;
          font-size: 0.95rem;
          color: #1a1a2e;
          transition: border-color 0.2s;
          background: #fff;
        }
        input:focus, textarea:focus {
          outline: none;
          border-color: #c9a84c;
        }
        textarea { resize: vertical; }
        .form-error { font-size: 0.875rem; color: #a33; margin: 0; }
        .btn {
          align-self: flex-start;
          padding: 0.75rem 2rem;
          border: none;
          border-radius: 2px;
          background: #c9a84c;
          color: #0f1d2f;
          font-family: inherit;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn:hover:not(:disabled) { background: #e8c878; }
        .btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .form-success {
          padding: 2rem;
          background: #f0f7f0;
          border: 1px solid #c3e6cb;
          border-radius: 4px;
        }
        .form-success h3 {
          font-family: 'EB Garamond', serif;
          font-size: 1.5rem;
          color: #0f1d2f;
          margin-bottom: 0.5rem;
        }
        .form-success p { color: #155724; }
        @media (max-width: 600px) { .form-row { grid-template-columns: 1fr; } }
      `}</style>
    </form>
  );
}
