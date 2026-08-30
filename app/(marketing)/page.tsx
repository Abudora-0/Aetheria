import { Hero } from "@/components/marketing/hero";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { Workflow } from "@/components/marketing/workflow";
import { AnalyticsPreview } from "@/components/marketing/analytics-preview";
import { CtaBand } from "@/components/marketing/cta";
import { generateDemoDataset } from "@/lib/demo/generate";
import { computeAnalytics } from "@/lib/analytics/service";

export default function LandingPage() {
  const data = generateDemoDataset();
  const to = new Date();
  const from = new Date(to.getTime() - 90 * 24 * 60 * 60 * 1000);
  const bundle = computeAnalytics(data.metrics, from, to, 90);

  return (
    <>
      <Hero />
      <FeatureGrid />
      <AnalyticsPreview bundle={bundle} />
      <Workflow />
      <CtaBand />
    </>
  );
}
