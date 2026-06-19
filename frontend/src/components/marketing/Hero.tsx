import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import hero from '@/assets/hero.jpg';

export default function Hero() {
  const reduce = useReducedMotion();
  const rise = (delay: number) =>
    reduce
      ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0, transition: { duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] } },
        };

  return (
    <section className="relative overflow-hidden">
      {/* Image background */}
      <div className="absolute inset-0">
        <img
          src={hero}
          alt=""
          width={1920}
          height={1080}
          className="h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950/85 via-ink-950/75 to-ink-950" />
        <div className="absolute inset-0 bg-grid opacity-[0.5]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-10 pt-24 pb-32 lg:pt-36 lg:pb-44">
        <motion.div {...rise(0)} className="inline-flex items-center gap-2 pill-neutral">
          <ShieldCheck className="h-3.5 w-3.5 text-success" />
          <span className="text-[10.5px] uppercase tracking-[0.14em] text-ink-200">
            For NGO &amp; social caseworkers · India
          </span>
        </motion.div>

        <motion.h1
          {...rise(0.08)}
          className="mt-7 font-display text-white text-[56px] sm:text-[72px] lg:text-[96px] leading-[0.95] tracking-tightest font-semibold max-w-5xl"
        >
          Sahayak AI
        </motion.h1>

        <motion.p
          {...rise(0.18)}
          className="mt-6 max-w-2xl text-lg sm:text-xl text-ink-200 leading-relaxed"
        >
          AI-powered welfare scheme recommendation and caseworker decision support
          platform — combining a deterministic eligibility engine with a hybrid retrieval
          layer to surface the right schemes for every citizen.
        </motion.p>

        <motion.div {...rise(0.28)} className="mt-10 flex flex-wrap items-center gap-3">
          <Link to="/assessment" className="btn-primary text-sm px-5 py-3">
            Start case assessment
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a href="#how" className="btn-ghost text-sm px-5 py-3">
            See how it works
          </a>
        </motion.div>

        {/* Stat strip */}
        <motion.div
          {...rise(0.38)}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-x-10 gap-y-6 border-t border-white/[0.06] pt-8 max-w-4xl"
        >
          {[
            ['1,200+', 'Schemes indexed'],
            ['28', 'States & UTs supported'],
            ['9', 'Eligibility signals'],
            ['100%', 'Deterministic decisions'],
          ].map(([k, v]) => (
            <div key={v}>
              <div className="font-display text-2xl text-white font-semibold tracking-tight">{k}</div>
              <div className="mt-1 text-[12px] uppercase tracking-[0.12em] text-ink-300">{v}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
