import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/marketing/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Aetheria collects, uses and protects your data and your connected social accounts.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="September 2026"
      intro="Aetheria is a social media scheduling and analytics application. This policy explains what
        information the app handles, why, and the choices you have. It applies to the hosted app at
        aetheriia.vercel.app and to any self-hosted deployment of the open-source project."
    >
      <LegalSection heading="Information we collect">
        <p>We collect only what the product needs to work:</p>
        <ul>
          <li>
            <strong>Account details.</strong> Your name, email address and a securely hashed password
            when you create an account.
          </li>
          <li>
            <strong>Connected social accounts.</strong> When you connect a network (X, Facebook,
            Instagram, LinkedIn), we receive an OAuth access token, an optional refresh token, and
            your public handle and display name on that network. Tokens are stored encrypted and are
            used only to act on your behalf.
          </li>
          <li>
            <strong>Content you create.</strong> Draft posts, schedules, per-network variants and any
            media you upload for publishing.
          </li>
          <li>
            <strong>Performance metrics.</strong> Engagement and impression figures for posts you
            published through Aetheria, retrieved from the connected network&apos;s API to build your
            analytics.
          </li>
          <li>
            <strong>Technical data.</strong> Standard server and request logs (IP address, timestamp,
            user agent) used for security, rate limiting and debugging.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="How we use information">
        <ul>
          <li>To authenticate you and keep your session secure.</li>
          <li>To draft, schedule and automatically publish your posts to the networks you connect.</li>
          <li>To refresh expiring OAuth tokens so scheduled posts do not fail.</li>
          <li>To calculate the analytics shown in your dashboard.</li>
          <li>To send transactional email you have asked for (welcome, password reset, publish failure notices).</li>
        </ul>
        <p>
          We do not sell your data, we do not use it for advertising, and we do not share social
          platform data with third parties except the service providers listed below.
        </p>
      </LegalSection>

      <LegalSection heading="Social platform data">
        <p>
          When you connect a network we request only the permissions required to publish content and
          read the analytics for your own account. You can review and revoke Aetheria&apos;s access at
          any time from that network&apos;s app or connected-apps settings, or by disconnecting the
          channel inside Aetheria, which deletes the stored tokens. Your use of each network through
          Aetheria is also subject to that network&apos;s own terms and privacy policy.
        </p>
      </LegalSection>

      <LegalSection heading="Service providers">
        <p>The hosted app relies on a small number of processors, each receiving only what it needs:</p>
        <ul>
          <li><strong>Vercel</strong> for application hosting and logs.</li>
          <li><strong>MongoDB Atlas</strong> for the database.</li>
          <li><strong>Resend</strong> for transactional email delivery.</li>
          <li><strong>Cloudinary</strong> for storing and serving uploaded media.</li>
          <li><strong>X, Meta (Facebook and Instagram) and LinkedIn</strong> when you publish or read analytics on those networks.</li>
        </ul>
        <p>A self-hosted deployment may use different providers depending on how it is configured.</p>
      </LegalSection>

      <LegalSection heading="Retention and deletion">
        <p>
          Content and metrics are kept while your account is active. Disconnecting a channel deletes
          its tokens immediately. Deleting your account removes your profile, connected-account
          records, drafts, schedules and collected metrics. Backups and server logs age out on a
          rolling basis.
        </p>
      </LegalSection>

      <LegalSection heading="Security">
        <p>
          Passwords are hashed with bcrypt. OAuth tokens are encrypted at rest with AES-256-GCM. All
          traffic is served over HTTPS. No system is perfectly secure, but access to stored
          credentials is limited and encrypted.
        </p>
      </LegalSection>

      <LegalSection heading="Your rights">
        <p>
          You can access and update your profile in settings, export your content, and delete your
          account at any time. If you self-host, you control the data directly. For requests on the
          hosted app, use the contact channel below.
        </p>
      </LegalSection>

      <LegalSection heading="Demo mode">
        <p>
          With no database or network credentials configured, Aetheria runs on a synthetic seeded
          dataset. In demo mode nothing is published to real networks and no personal data is
          collected beyond a local demo session.
        </p>
      </LegalSection>

      <LegalSection heading="Changes">
        <p>
          We may update this policy as the project evolves. Material changes will be reflected in the
          &quot;last updated&quot; date above.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          Aetheria is an open-source project. For privacy questions or data requests, open an issue at{" "}
          <a href="https://github.com/Abudora-0/Aetheria/issues">
            github.com/Abudora-0/Aetheria/issues
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
