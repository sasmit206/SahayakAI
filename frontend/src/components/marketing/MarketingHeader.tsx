import { Link, useLocation } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <Link to="/" className={`group inline-flex items-center gap-2.5 ${className}`}>
      <span className="grid place-items-center h-7 w-7 rounded-md bg-white text-ink-950 font-display font-bold text-[13px]">
        S
      </span>
      <span className="font-display font-semibold tracking-tight text-[15px] text-white">
        Sahayak<span className="text-ink-300 font-normal"> AI</span>
      </span>
    </Link>
  );
}

export default function MarketingHeader() {
  const { pathname } = useLocation();
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-ink-950/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 h-16 flex items-center justify-between">
        <Wordmark />
        <nav className="hidden md:flex items-center gap-8 text-sm text-ink-200">
          <a href="#how" className="hover:text-white transition-colors">How it works</a>
          <a href="#architecture" className="hover:text-white transition-colors">Architecture</a>
          <a href="#pipeline" className="hover:text-white transition-colors">Retrieval</a>
          <a href="#benefits" className="hover:text-white transition-colors">Caseworkers</a>
        </nav>
        <Link
          to="/assessment"
          className="btn-primary text-[13px]"
          aria-current={pathname === '/assessment' ? 'page' : undefined}
        >
          Start case assessment
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </header>
  );
}
