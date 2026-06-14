import { Wordmark } from './MarketingHeader';

export default function MarketingFooter() {
  return (
    <footer className="border-t border-white/[0.06] bg-ink-950 py-12">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex items-center gap-4">
          <Wordmark />
          <span className="pill-neutral">v1.0 · CSV index</span>
        </div>
        <p className="text-[12.5px] text-ink-400 max-w-md">
          Sahayak AI is a decision-support tool for caseworkers. All eligibility
          determinations are advisory; final approvals rest with the issuing department.
        </p>
      </div>
    </footer>
  );
}
