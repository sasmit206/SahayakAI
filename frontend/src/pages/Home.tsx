import MarketingHeader from '@/components/marketing/MarketingHeader';
import Hero from '@/components/marketing/Hero';
import HowItWorks from '@/components/marketing/HowItWorks';
import PlatformArchitecture from '@/components/marketing/PlatformArchitecture';
import RetrievalPipeline from '@/components/marketing/RetrievalPipeline';
import CaseworkerBenefits from '@/components/marketing/CaseworkerBenefits';
import MarketingFooter from '@/components/marketing/MarketingFooter';

export default function Home() {
  return (
    <div className="min-h-screen bg-ink-950 text-ink-100">
      <MarketingHeader />
      <main>
        <Hero />
        <HowItWorks />
        <PlatformArchitecture />
        <RetrievalPipeline />
        <CaseworkerBenefits />
      </main>
      <MarketingFooter />
    </div>
  );
}
