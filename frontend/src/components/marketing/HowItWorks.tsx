import { Reveal, Stagger, itemVariants } from './Reveal';
import { motion } from 'framer-motion';
import { MessagesSquare, UserSquare2, Scale, ListChecks, FileCheck2 } from 'lucide-react';

const steps = [
  { icon: MessagesSquare, title: 'Citizen intake', body: 'Conversational caseworker dialogue captures the citizen’s story in their own words — no rigid forms.' },
  { icon: UserSquare2, title: 'Profile extraction', body: 'Sahayak extracts a structured citizen profile: age, state, income, occupation, category, and disability status.' },
  { icon: Scale, title: 'Eligibility analysis', body: 'A deterministic engine evaluates each scheme against the profile with explainable rule-level reasons.' },
  { icon: ListChecks, title: 'Scheme recommendation', body: 'Eligible schemes are ranked by hybrid retrieval and re-ranked for the citizen’s specific context.' },
  { icon: FileCheck2, title: 'Application support', body: 'Guided application flow walks caseworkers through the documents and questions for the chosen scheme.' },
];

export default function HowItWorks() {
  return (
    <section id="how" className="relative border-t border-white/[0.06] bg-ink-950 py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <Reveal>
          <div className="max-w-3xl">
            <span className="eyebrow">How it works</span>
            <h2 className="mt-4 font-display text-4xl lg:text-5xl text-white tracking-tightest font-semibold">
              A five-step workflow
            </h2>
            <p className="mt-5 text-ink-300 text-base leading-relaxed">
              From the first conversation to a completed application, Sahayak keeps the
              caseworker in control while doing the heavy lifting on eligibility,
              retrieval, and rationale.
            </p>
          </div>
        </Reveal>

        <Stagger className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-white/[0.06] md:grid-cols-5 bg-white/[0.06]">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              variants={itemVariants}
              className="bg-ink-900 p-6 lg:p-7 flex flex-col gap-5 min-h-[240px]"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-ink-400">0{i + 1}</span>
                <s.icon className="h-5 w-5 text-ink-200" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-white font-semibold text-[15px] tracking-tight">{s.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-ink-300">{s.body}</p>
              </div>
            </motion.div>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
