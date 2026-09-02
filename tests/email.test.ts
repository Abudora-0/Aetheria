import { afterEach, describe, expect, it, vi } from "vitest";
import { sendEmail } from "@/lib/email";
import { resetPasswordEmail, welcomeEmail } from "@/lib/email/templates";

afterEach(() => vi.restoreAllMocks());

describe("email fallback", () => {
  it("logs the message to the console when no API key is set", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const res = await sendEmail({ to: "a@b.test", subject: "Hi", html: "<p>Body text</p>" });
    expect(res.ok).toBe(true);
    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0]).toContain("a@b.test");
    expect(spy.mock.calls[0][0]).toContain("Body text");
  });
});

describe("email templates", () => {
  it("welcome email targets the recipient and links to the studio", () => {
    const msg = welcomeEmail("nova@studio.test", "Nova");
    expect(msg.to).toBe("nova@studio.test");
    expect(msg.subject).toMatch(/welcome/i);
    expect(msg.html).toContain("Nova");
    expect(msg.html).toContain("/studio");
  });

  it("reset email embeds the provided link", () => {
    const link = "https://aetheria.test/reset?token=abc123";
    const msg = resetPasswordEmail("x@y.test", link);
    expect(msg.html).toContain(link);
    expect(msg.subject).toMatch(/reset/i);
  });

  it("escapes html in user supplied names", () => {
    const msg = welcomeEmail("x@y.test", "<script>alert(1)</script>");
    expect(msg.html).not.toContain("<script>alert(1)</script>");
    expect(msg.html).toContain("&lt;script&gt;");
  });
});
