import { Reveal } from './Reveal';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

const stages = [
  { id: 1, label: 'Metadata filter', detail: 'State, category, occupation pre-filter' },
  { id: 2, label: 'Hybrid search',   detail: 'Dense embeddings + BM25 keyword' },
  { id: 3, label: 'RRF fusion',      detail: 'Reciprocal rank fusion of result sets' },
  { id: 4, label: 'Re-ranking',      detail: 'Cross-encoder context re-rank' },
  { id: 5, label: 'Final recommendations', detail: 'Top-N eligible schemes with rationale' },
];

export default function RetrievalPipeline() {
  const reduce = useReducedMotion();
  return (
    <section id="pipeline" className="relative border-t border-white/[0.06] bg-ink-950 py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <Reveal>
          <div className="max-w-3xl">
            <span className="eyebrow">Retrieval pipeline</span>
            <h2 className="mt-4 font-display text-4xl lg:text-5xl text-white tracking-tightest font-semibold">
              Five stages from query to recommendation.
            </h2>
            <p className="mt-5 text-ink-300 text-base leading-relaxed">
              Every recommendation passes through a deterministic shortlisting funnel,
              ensuring relevance and traceability at each step.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-14 surface p-6 lg:p-10">
            <div className="flex flex-col lg:flex-row lg:items-stretch gap-3 lg:gap-2">
              {stages.map((s, i) => (
                <div key={s.id} className="flex items-center lg:flex-1">
                  <motion.div
                    initial={reduce ? { opacity: 1 } : { opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                    className="flex-1 surface-muted p-5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-ink-400">STAGE {s.id}</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    </div>
                    <h3 className="mt-3 text-white text-[15px] font-semibold tracking-tight">
                      {s.label}
                    </h3>
                    <p className="mt-1.5 text-[12.5px] text-ink-300 leading-relaxed">{s.detail}</p>
                  </motion.div>
                  {i < stages.length - 1 && (
                    <ChevronRight className="hidden lg:block h-4 w-4 mx-2 text-ink-500 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
