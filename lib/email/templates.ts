import { env } from "@/lib/env";
import type { EmailMessage } from "@/lib/email";

const BG = "#07080d";
const CARD = "#0c0e16";
const FG = "#eef0fb";
const MUTED = "#9aa0be";
const BORDER = "#252a3d";

function shell(heading: string, body: string, cta?: { label: string; href: string }) {
  return `
  <div style="margin:0;padding:32px 0;background:${BG};font-family:ui-sans-serif,system-ui,Segoe UI,Helvetica,Arial,sans-serif;">
    <div style="max-width:480px;margin:0 auto;padding:0 20px;">
      <div style="font-size:18px;font-weight:600;letter-spacing:-0.02em;color:${FG};padding-bottom:20px;">Aetheria</div>
      <div style="background:${CARD};border:1px solid ${BORDER};border-radius:16px;padding:28px;">
        <div style="height:2px;background:linear-gradient(90deg,#4fd1c5,#8b5cf6,#f472b6);border-radius:2px;margin-bottom:22px;"></div>
        <h1 style="margin:0 0 12px;font-size:20px;color:${FG};">${heading}</h1>
        <div style="font-size:14px;line-height:1.7;color:${MUTED};">${body}</div>
        ${
          cta
            ? `<a href="${cta.href}" style="display:inline-block;margin-top:22px;padding:11px 20px;border-radius:12px;background:linear-gradient(110deg,#4fd1c5,#8b5cf6 50%,#f472b6);color:#07080d;font-weight:600;font-size:14px;text-decoration:none;">${cta.label}</a>`
            : ""
        }
      </div>
      <p style="font-size:11px;color:#6a6f8f;padding:16px 4px 0;">Aetheria, automated social scheduling and analytics.</p>
    </div>
  </div>`;
}

export function welcomeEmail(to: string, name: string): EmailMessage {
  return {
    to,
    subject: "Welcome to Aetheria",
    html: shell(
      `Welcome, ${escapeHtml(name)}`,
      "Your workspace is ready. Connect a channel, draft your first signal and drop it on The Dial. The worker takes it from there.",
      { label: "Open the studio", href: `${appUrl()}/studio` },
    ),
  };
}

export function resetPasswordEmail(to: string, link: string): EmailMessage {
  return {
    to,
    subject: "Reset your Aetheria password",
    html: shell(
      "Reset your password",
      "Someone asked to reset the password for this account. If that was you, use the link below. It expires in one hour. If it was not you, you can ignore this email.",
      { label: "Choose a new password", href: link },
    ),
  };
}

export function publishFailedEmail(
  to: string,
  postTitle: string,
  reasons: string[],
): EmailMessage {
  return {
    to,
    subject: `A scheduled signal could not be published`,
    html: shell(
      "A signal failed to publish",
      `"${escapeHtml(postTitle)}" ran out of retries. Reasons:<br/><br/>${reasons
        .map((r) => `&bull; ${escapeHtml(r)}`)
        .join("<br/>")}<br/><br/>Check the channel's token health in the Token Vault, then reschedule it from the Signal Queue.`,
      { label: "Open the Signal Queue", href: `${appUrl()}/studio/queue` },
    ),
  };
}

function appUrl() {
  return env.appUrl.replace(/\/+$/, "");
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
