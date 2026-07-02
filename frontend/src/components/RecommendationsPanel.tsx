/**
 * RecommendationsPanel.tsx
 * Redesigned recommendation cards with:
 *   - Match score indicator bar
 *   - Department / category badges
 *   - Eligibility chips
 *   - Better hierarchy and spacing
 *   - PDF print button using PdfReport component
 *   - Full i18n support
 */
import React, { useState, useRef } from 'react';
import { SchemeRecommendation, CitizenProfile } from '../services/api';
import {
  CheckCircle2, ChevronRight, Award, Compass, FileText,
  ClipboardList, Loader2, Printer, MapPin, Tag, Star,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLang } from '../context/LanguageContext';
import { buildPdfHtml } from './PdfReport';
import { translateSchemeField } from '../i18n/translations';

interface RecommendationsPanelProps {
  recommendations: SchemeRecommendation[];
  report: string | null;
  onApplyScheme: (schemeId: string, schemeName: string) => void;
  isApplying: boolean;
  profile: CitizenProfile;
}

/** Opens the PDF report in a new window and triggers print */
function handlePrintReport(
  profile: CitizenProfile,
  recommendations: SchemeRecommendation[],
  applicationId: string,
  language: 'en' | 'hi'
) {
  const html = buildPdfHtml({
    profile, recommendations, applicationId, language,
    generatedDate: new Date().toLocaleString(),
  });
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
  // Delay print until browser has painted the content
  setTimeout(() => win.print(), 800);
}

export const RecommendationsPanel: React.FC<RecommendationsPanelProps> = ({
  recommendations, report, onApplyScheme, isApplying, profile,
}) => {
  const { t, language } = useLang();
  const [activeTab, setActiveTab] = useState<'schemes' | 'report'>('schemes');
  const appIdRef = useRef(`APP-${Date.now().toString(36).toUpperCase()}`);

  return (
    <div className="surface flex flex-col h-full overflow-hidden">
      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 pt-4">
        <div className="flex gap-1">
          <TabButton
            active={activeTab === 'schemes'}
            onClick={() => setActiveTab('schemes')}
            icon={<Compass className="h-3.5 w-3.5" strokeWidth={1.6} />}
            label={t.recTitle}
            badge={recommendations.length}
          />
          <TabButton
            active={activeTab === 'report'}
            onClick={() => setActiveTab('report')}
            icon={<FileText className="h-3.5 w-3.5" strokeWidth={1.6} />}
            label="Report"
            disabled={!report}
          />
        </div>
        <div className="flex items-center gap-2 mb-3">
          {recommendations.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => handlePrintReport(profile, recommendations, appIdRef.current, language)}
              className="btn-ghost text-[11.5px] px-2.5 py-1.5"
              title="Print PDF report"
            >
              <Printer className="h-3.5 w-3.5" />
              PDF
            </motion.button>
          )}
          <span className="pill-neutral font-mono">Hybrid retrieval</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'schemes' ? (
          recommendations.length === 0 ? (
            <EmptyState message={t.recEmpty} />
          ) : (
            <div className="space-y-4">
              <AnimatePresence initial={false}>
                {recommendations.map((rec, idx) => (
                  <SchemeCard
                    key={rec.schemeId}
                    rec={rec}
                    idx={idx}
                    onApply={onApplyScheme}
                    isApplying={isApplying}
                    t={t}
                  />
                ))}
              </AnimatePresence>
            </div>
          )
        ) : (
          <div className="surface-muted p-6 report-prose">{report}</div>
        )}
      </div>
    </div>
  );
};

/** Individual scheme card — separated for clarity */
const SchemeCard: React.FC<{
  rec: SchemeRecommendation;
  idx: number;
  onApply: (id: string, name: string) => void;
  isApplying: boolean;
  t: any;
}> = ({ rec, idx, onApply, isApplying, t }) => {
  const { language } = useLang();
  const scorePct = Math.min(100, Math.round((rec.score / 15) * 100));

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="surface-muted rounded-xl overflow-hidden hover:border-white/[0.12] transition-colors"
    >
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05] bg-ink-800/40">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[11px] text-ink-500 bg-ink-800 px-2 py-0.5 rounded">
            #{String(idx + 1).padStart(2, '0')}
          </span>
          <h3 className="text-[14px] text-white font-semibold tracking-tight leading-tight">
            {rec.schemeName}
          </h3>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Star className="h-3 w-3 text-warning" strokeWidth={1.8} />
          <span className="text-[12px] text-warning font-semibold">{rec.score}</span>
        </div>
      </div>

      <div className="p-4 space-y-3.5">
        {/* Badges row */}
        <div className="flex items-center gap-2 flex-wrap">
          {rec.level && (
            <span className="pill-accent text-[10px]">
              <MapPin className="h-2.5 w-2.5" />
              {translateSchemeField(rec.level, language)}
            </span>
          )}
          {rec.category.slice(0, 2).map((c, i) => (
            <span key={i} className="pill-neutral text-[10px]">
              <Tag className="h-2.5 w-2.5" />
              {translateSchemeField(c, language)}
            </span>
          ))}
        </div>

        {/* Match score bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10.5px] text-ink-400 font-medium uppercase tracking-[0.08em]">
              Match score
            </span>
            <span className="text-[10.5px] text-accent font-semibold">{scorePct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${scorePct}%` }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              className="h-full bg-gradient-to-r from-accent/70 to-accent rounded-full"
            />
          </div>
        </div>

        {/* Benefits */}
        <div className="flex items-start gap-2">
          <Award className="h-3.5 w-3.5 mt-0.5 text-ink-400 shrink-0" strokeWidth={1.5} />
          <p className="text-[12.5px] text-ink-200 leading-relaxed line-clamp-2">{rec.benefits}</p>
        </div>

        {/* Eligibility reasons chips */}
        {rec.reasons.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-[0.1em] text-ink-500 font-medium">Eligibility match</p>
            <div className="flex flex-wrap gap-1.5">
              {rec.reasons.slice(0, 3).map((r, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-[11px] text-success bg-success/10 border border-success/20 rounded-full px-2.5 py-0.5"
                >
                  <CheckCircle2 className="h-3 w-3 shrink-0" strokeWidth={2} />
                  {r}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tags + Apply button */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex flex-wrap gap-1 text-[10px] text-ink-500 font-mono">
            {rec.tags.slice(0, 3).map((tag, i) => <span key={i}>#{tag}</span>)}
          </div>
          <motion.button
            onClick={() => onApply(rec.schemeId, rec.schemeName)}
            disabled={isApplying}
            whileHover={{ scale: isApplying ? 1 : 1.04 }}
            whileTap={{ scale: isApplying ? 1 : 0.96 }}
            className="btn-primary text-[12px] px-3 py-2 shrink-0"
          >
            {isApplying ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" />{t.recApplying}</>
            ) : (
              <>{t.recApply}<ChevronRight className="h-3.5 w-3.5" /></>
            )}
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
};

function TabButton({ active, onClick, icon, label, badge, disabled }: {
  active: boolean; onClick: () => void; icon: React.ReactNode;
  label: string; badge?: number; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative flex items-center gap-2 px-3 py-2.5 -mb-px text-[13px] font-medium transition-colors ${
        disabled ? 'opacity-40 cursor-not-allowed text-ink-500'
        : active ? 'text-white' : 'text-ink-300 hover:text-white'
      }`}
    >
      {icon}{label}
      {typeof badge === 'number' && (
        <span className="font-mono text-[11px] text-ink-400">({badge})</span>
      )}
      {active && (
        <motion.span layoutId="rec-tab-underline" className="absolute -bottom-px left-0 right-0 h-px bg-white" />
      )}
    </button>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-10">
      <ClipboardList className="h-7 w-7 text-ink-500 mb-3" strokeWidth={1.5} />
      <p className="text-[14px] text-white font-medium">No recommendations yet</p>
      <p className="mt-1.5 text-[12.5px] text-ink-400 max-w-xs leading-relaxed">{message}</p>
    </div>
  );
}

export default RecommendationsPanel;
