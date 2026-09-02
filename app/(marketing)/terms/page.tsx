import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/marketing/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of Aetheria.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="September 2026"
      intro="These terms govern your use of Aetheria, a social media scheduling and analytics application.
        By creating an account or using the app you agree to them."
    >
      <LegalSection heading="The service">
        <p>
          Aetheria lets you draft posts, schedule them, publish automatically to connected social
          networks, and review analytics about their performance. It is an open-source project
          (MIT licensed) provided on an as-is basis, without a service-level guarantee.
        </p>
      </LegalSection>

      <LegalSection heading="Your account">
        <p>
          You are responsible for the accuracy of your account details, for keeping your credentials
          secure, and for all activity that happens under your account. You must be old enough to
          form a binding contract in your jurisdiction. Do not use the app if you cannot agree to
          these terms.
        </p>
      </LegalSection>

      <LegalSection heading="Acceptable use">
        <p>You agree not to use Aetheria to:</p>
        <ul>
          <li>publish content that is unlawful, infringing, deceptive, or that harasses or harms others;</li>
          <li>send spam or automate activity in a way that violates a connected network&apos;s rules;</li>
          <li>circumvent rate limits, security controls or access restrictions;</li>
          <li>publish on behalf of accounts you are not authorized to manage.</li>
        </ul>
        <p>
          You must comply with the terms, policies and API rules of every social network you connect.
          Violations may lead to suspension of your Aetheria account.
        </p>
      </LegalSection>

      <LegalSection heading="Third-party platforms">
        <p>
          Aetheria connects to services operated by X, Meta and LinkedIn. Your use of those platforms
          through Aetheria is also subject to their terms. We do not control their APIs, and we are
          not responsible for their availability, rate limits, permission reviews, policy changes, or
          for any action a platform takes against your account.
        </p>
      </LegalSection>

      <LegalSection heading="Your content">
        <p>
          You keep all rights to the content you create in Aetheria. By connecting a network and
          scheduling a post, you authorize Aetheria to transmit that content and any attached media
          to that network on your behalf at the time you choose.
        </p>
      </LegalSection>

      <LegalSection heading="Availability and changes">
        <p>
          The hosted app is offered without uptime commitments and may be changed, limited or
          discontinued at any time. Features may be added or removed as the project develops.
        </p>
      </LegalSection>

      <LegalSection heading="Disclaimer and liability">
        <p>
          Aetheria is provided &quot;as is&quot; and &quot;as available&quot; without warranties of
          any kind. To the fullest extent permitted by law, the project and its maintainers are not
          liable for any indirect, incidental or consequential damages, or for lost posts, missed
          schedules, lost data, or lost engagement arising from your use of the app.
        </p>
      </LegalSection>

      <LegalSection heading="Termination">
        <p>
          You may stop using Aetheria and delete your account at any time. We may suspend or
          terminate access that violates these terms or that creates risk for the service or other
          users.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          Questions about these terms can be raised at{" "}
          <a href="https://github.com/Abudora-0/Aetheria/issues">
            github.com/Abudora-0/Aetheria/issues
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
