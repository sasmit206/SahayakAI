/**
 * RecommendationsPanel
 * - Translatable labels via useLang()
 * - Animated scheme cards
 * - Apply button with loading state
 */
import React, { useState } from 'react';
import { SchemeRecommendation } from '../services/api';
import { CheckCircle2, ChevronRight, Award, Compass, FileText, ClipboardList, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLang } from '../context/LanguageContext';

interface RecommendationsPanelProps {
  recommendations: SchemeRecommendation[];
  report: string | null;
  onApplyScheme: (schemeId: string, schemeName: string) => void;
  isApplying: boolean;
}

export const RecommendationsPanel: React.FC<RecommendationsPanelProps> = ({
  recommendations, report, onApplyScheme, isApplying,
}) => {
  const { t } = useLang();
  const [activeTab, setActiveTab] = useState<'schemes' | 'report'>('schemes');

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
            label={t.recReportTab}
            disabled={!report}
          />
        </div>
        <span className="pill-neutral mb-3 font-mono">{t.recHybridBadge}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {activeTab === 'schemes' ? (
          recommendations.length === 0 ? (
            <EmptyState message={t.recEmpty} />
          ) : (
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {recommendations.map((rec, idx) => (
                  <motion.article
                    key={rec.schemeId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: idx * 0.04, ease: [0.16, 1, 0.3, 1] }}
                    className="surface-muted p-5 hover:border-white/[0.1] transition-colors"
                  >
                    <div className="flex items-start gap-5">
                      {/* Rank rail */}
                      <div className="shrink-0 text-center w-12">
                        <div className="font-mono text-[10px] text-ink-400 uppercase tracking-[0.1em]">{t.recRankLabel}</div>
                        <div className="mt-1 font-display text-2xl font-semibold text-white">
                          {String(idx + 1).padStart(2, '0')}
                        </div>
                        <div className="mt-2 pt-2 border-t border-white/[0.06]">
                          <div className="font-mono text-[10px] text-ink-400 uppercase tracking-[0.1em]">{t.recMatchLabel}</div>
                          <div className="text-[13px] text-accent font-semibold mt-0.5">{rec.matchPercentage}%</div>
                        </div>
                        <div className="mt-1.5">
                          <div className="font-mono text-[10px] text-ink-400 uppercase tracking-[0.1em]">{t.recScoreLabel}</div>
                          <div className="text-[12px] text-ink-300 font-medium mt-0.5">+{rec.score}</div>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="pill-accent">{rec.level}</span>
                          <span className="pill-success font-mono">{rec.matchPercentage}% {t.recMatchLabel}</span>
                          {rec.category.slice(0, 2).map((c, i) => (
                            <span key={i} className="pill-neutral">{c}</span>
                          ))}
                        </div>
                        <h3 className="mt-2 text-[16px] text-white font-semibold tracking-tight">
                          {rec.schemeName}
                        </h3>

                        <div className="mt-3 flex items-start gap-2 text-[13px] text-ink-200 leading-relaxed">
                          <Award className="h-3.5 w-3.5 mt-0.5 text-ink-400 shrink-0" strokeWidth={1.5} />
                          <p className="line-clamp-3">{rec.benefits}</p>
                        </div>

                        {rec.reasons.length > 0 && (
                          <div className="mt-4 space-y-1.5">
                            <p className="text-[10.5px] uppercase tracking-[0.1em] text-ink-400 font-medium">
                              {t.recEligibilityMatchLabel}
                            </p>
                            {rec.reasons.slice(0, 3).map((r, i) => (
                              <div key={i} className="flex items-start gap-2 text-[12.5px] text-ink-300">
                                <CheckCircle2 className="h-3.5 w-3.5 text-success mt-0.5 shrink-0" strokeWidth={1.8} />
                                <span>{r}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="mt-5 flex items-center justify-between">
                          {rec.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 text-[10.5px] text-ink-400 font-mono">
                              {rec.tags.slice(0, 3).map((tag, i) => <span key={i}>#{tag}</span>)}
                            </div>
                          )}
                          <motion.button
                            onClick={() => onApplyScheme(rec.schemeId, rec.schemeName)}
                            disabled={isApplying}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="btn-primary text-[12.5px] px-3.5 py-2"
                          >
                            {isApplying ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                {t.recApplying}
                              </>
                            ) : (
                              <>
                                {t.recApply}
                                <ChevronRight className="h-3.5 w-3.5" />
                              </>
                            )}
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.article>
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
      {icon}
      {label}
      {typeof badge === 'number' && (
        <span className="font-mono text-[11px] text-ink-400">({badge})</span>
      )}
      {active && (
        <motion.span
          layoutId="rec-tab-underline"
          className="absolute -bottom-px left-0 right-0 h-px bg-white"
        />
      )}
    </button>
  );
}

function EmptyState({ message }: { message: string }) {
  const { t } = useLang();
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-10 surface-muted border-dashed">
      <ClipboardList className="h-7 w-7 text-ink-500 mb-3" strokeWidth={1.5} />
      <p className="text-[14px] text-white font-medium">{t.recNoRecsYetTitle}</p>
      <p className="mt-1.5 text-[12.5px] text-ink-400 max-w-xs leading-relaxed">{message}</p>
    </div>
  );
}

export default RecommendationsPanel;
