import type { APIRoute } from 'astro';
import { Resend } from 'resend';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);

  if (!body || !body.name || !body.email || !body.message) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const resend = new Resend(import.meta.env.RESEND_API_KEY);

  const { name, email, company, message } = body;

  const { error } = await resend.emails.send({
    from: 'Hengistbury Partners Portal <onboarding@resend.dev>',
    to: 'jimmy@modernwebarchitecture.com',
    replyTo: email,
    subject: `New enquiry from ${name}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
        <div style="background: #0f1d2f; padding: 24px 32px;">
          <p style="color: #c9a84c; font-size: 13px; letter-spacing: 0.1em; margin: 0; text-transform: uppercase;">Hengistbury Investment Partners</p>
          <h1 style="color: #f8f6f0; font-size: 22px; margin: 8px 0 0;">New Website Enquiry</h1>
        </div>
        <div style="padding: 32px; background: #f8f6f0; border: 1px solid #e0ddd6; border-top: none;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e0ddd6; font-size: 13px; color: #666; width: 130px; vertical-align: top;">Name</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #e0ddd6; font-size: 15px;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e0ddd6; font-size: 13px; color: #666; vertical-align: top;">Email</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #e0ddd6; font-size: 15px;"><a href="mailto:${email}" style="color: #0f1d2f;">${email}</a></td>
            </tr>
            ${company ? `
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e0ddd6; font-size: 13px; color: #666; vertical-align: top;">Organisation</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #e0ddd6; font-size: 15px;">${company}</td>
            </tr>` : ''}
            <tr>
              <td style="padding: 10px 0; font-size: 13px; color: #666; vertical-align: top;">Message</td>
              <td style="padding: 10px 0; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${message}</td>
            </tr>
          </table>
          <p style="margin: 32px 0 0; font-size: 12px; color: #999;">
            Reply directly to this email to respond to ${name}. Sent via hengistburypartners.com.
          </p>
        </div>
      </div>
    `,
  });

  if (error) {
    console.error('Resend error:', error);
    return new Response(JSON.stringify({ error: 'Failed to send email' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
