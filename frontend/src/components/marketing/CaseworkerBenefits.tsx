import { Link } from 'react-router-dom';
import { Reveal, Stagger, itemVariants } from './Reveal';
import { motion } from 'framer-motion';
import { Gauge, ScaleIcon, HandHeart, ArrowRight } from 'lucide-react';

const benefits = [
  {
    icon: Gauge,
    metric: '5–10×',
    title: 'Faster assessments',
    body: 'Replace hours of scheme look-up with a guided conversation that converges on eligible options in minutes.',
  },
  {
    icon: ScaleIcon,
    metric: 'Deterministic',
    title: 'Consistent eligibility',
    body: 'Every caseworker, every citizen, every state — the same explainable rules applied uniformly across schemes.',
  },
  {
    icon: HandHeart,
    metric: 'Better outcomes',
    title: 'For the citizens you serve',
    body: 'Surface schemes citizens would never have found on their own, and walk them through application end-to-end.',
  },
];

export default function CaseworkerBenefits() {
  return (
    <section id="benefits" className="relative border-t border-white/[0.06] bg-ink-900 py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <Reveal>
          <div className="max-w-3xl">
            <span className="eyebrow">Caseworker benefits</span>
            <h2 className="mt-4 font-display text-4xl lg:text-5xl text-white tracking-tightest font-semibold">
              Built for the people doing the work.
            </h2>
          </div>
        </Reveal>

        <Stagger className="mt-14 grid gap-6 md:grid-cols-3">
          {benefits.map((b) => (
            <motion.div key={b.title} variants={itemVariants} className="surface p-7">
              <b.icon className="h-5 w-5 text-ink-200" strokeWidth={1.5} />
              <div className="mt-8 font-display text-3xl text-white font-semibold tracking-tightest">
                {b.metric}
              </div>
              <div className="mt-4 text-white font-semibold text-[15px]">{b.title}</div>
              <p className="mt-2 text-[13.5px] text-ink-300 leading-relaxed">{b.body}</p>
            </motion.div>
          ))}
        </Stagger>

        <Reveal delay={0.1}>
          <div className="mt-20 surface p-10 lg:p-14 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div className="max-w-2xl">
              <span className="eyebrow">Ready when you are</span>
              <h3 className="mt-4 font-display text-3xl lg:text-4xl text-white tracking-tightest font-semibold">
                Start a case assessment in under a minute.
              </h3>
              <p className="mt-4 text-ink-300 text-[15px] leading-relaxed">
                No setup, no forms. Open the assistant, describe the citizen in your own
                words, and Sahayak will take it from there.
              </p>
            </div>
            <Link to="/assessment" className="btn-primary text-sm px-5 py-3 self-start lg:self-auto">
              Open assessment workspace
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
