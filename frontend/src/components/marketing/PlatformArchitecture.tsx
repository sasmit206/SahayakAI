import { Reveal, Stagger, itemVariants } from './Reveal';
import { motion } from 'framer-motion';
import { Cpu, Sparkles, Layers } from 'lucide-react';

const pillars = [
  {
    icon: Cpu,
    eyebrow: 'Layer 01',
    title: 'Deterministic eligibility engine',
    body: 'Every recommendation is backed by an explainable, rule-based eligibility check — no black boxes, no hallucinated approvals.',
    bullets: ['Per-scheme rule evaluation', 'Explainable match reasons', 'Audit-ready decision trail'],
  },
  {
    icon: Sparkles,
    eyebrow: 'Layer 02',
    title: 'AI assistance layer',
    body: 'Language models handle the conversation — interpreting the citizen’s story, extracting a structured profile, and explaining rationale in plain language.',
    bullets: ['Natural intake dialogue', 'Profile field extraction', 'Plain-language reasoning'],
  },
  {
    icon: Layers,
    eyebrow: 'Layer 03',
    title: 'Hybrid retrieval system',
    body: 'A multi-stage retrieval pipeline combines metadata filters, dense and sparse search, RRF fusion, and re-ranking for high-precision shortlists.',
    bullets: ['Metadata pre-filtering', 'Dense + sparse hybrid search', 'Cross-encoder re-ranking'],
  },
];

export default function PlatformArchitecture() {
  return (
    <section id="architecture" className="relative border-t border-white/[0.06] bg-ink-900 py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <Reveal>
          <div className="max-w-3xl">
            <span className="eyebrow">Platform architecture</span>
            <h2 className="mt-4 font-display text-4xl lg:text-5xl text-white tracking-tightest font-semibold">
              Three layers, one accountable decision.
            </h2>
            <p className="mt-5 text-ink-300 text-base leading-relaxed">
              Sahayak separates what AI is good at — language and retrieval — from
              what citizens deserve: deterministic, explainable eligibility decisions.
            </p>
          </div>
        </Reveal>

        <Stagger className="mt-16 grid gap-6 md:grid-cols-3">
          {pillars.map((p) => (
            <motion.div
              key={p.title}
              variants={itemVariants}
              className="surface p-7 flex flex-col gap-5"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-ink-400 uppercase tracking-[0.14em]">
                  {p.eyebrow}
                </span>
                <p.icon className="h-5 w-5 text-ink-200" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-white text-[18px] font-semibold tracking-tight">{p.title}</h3>
                <p className="mt-3 text-[14px] leading-relaxed text-ink-300">{p.body}</p>
              </div>
              <ul className="mt-2 space-y-2 border-t border-white/[0.05] pt-4">
                {p.bullets.map((b) => (
                  <li key={b} className="text-[13px] text-ink-200 flex items-start gap-2">
                    <span className="mt-2 h-1 w-1 rounded-full bg-accent" />
                    {b}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
