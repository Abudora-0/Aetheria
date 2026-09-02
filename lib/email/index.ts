import { env } from "@/lib/env";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

let client: import("resend").Resend | null = null;

async function resend() {
  if (!client) {
    const { Resend } = await import("resend");
    client = new Resend(env.email.apiKey);
  }
  return client;
}

/**
 * Sends transactional email via Resend when RESEND_API_KEY is set. Without it,
 * the message is logged to the server console (same demo-fallback pattern as
 * Stripe and Cloudinary) so flows can still be exercised end to end.
 */
export async function sendEmail(message: EmailMessage): Promise<{ ok: boolean; id?: string }> {
  if (!env.email.apiKey || !env.email.from) {
    console.log(
      `\n[aetheria] email (demo, not sent)\n  to: ${message.to}\n  subject: ${message.subject}\n  ${
        message.text ?? stripHtml(message.html)
      }\n`,
    );
    return { ok: true };
  }
  try {
    const res = await (await resend()).emails.send({
      from: env.email.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text ?? stripHtml(message.html),
    });
    return { ok: !res.error, id: res.data?.id };
  } catch (err) {
    console.error("[aetheria] email send failed", err);
    return { ok: false };
  }
}

function stripHtml(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
