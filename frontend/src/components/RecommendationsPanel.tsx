import React, { useState } from 'react';
import { SchemeRecommendation } from '../services/api';
import { CheckCircle2, ChevronRight, Award, Compass, FileText, ClipboardList, AlertCircle } from 'lucide-react';

interface RecommendationsPanelProps {
  recommendations: SchemeRecommendation[];
  report: string | null;
  onApplyScheme: (schemeId: string, schemeName: string) => void;
  isApplying: boolean;
}

export const RecommendationsPanel: React.FC<RecommendationsPanelProps> = ({
  recommendations,
  report,
  onApplyScheme,
  isApplying,
}) => {
  const [activeTab, setActiveTab] = useState<'schemes' | 'report'>('schemes');

  return (
    <div className="glass-panel rounded-2xl flex flex-col h-full overflow-hidden shadow-2xl">
      {/* Tabs Header */}
      <div className="flex border-b border-slate-800 bg-slate-950/20 px-6 pt-2">
        <button
          onClick={() => setActiveTab('schemes')}
          className={`flex items-center gap-2 px-4 py-3.5 border-b-2 font-medium text-sm transition-all focus:outline-none ${
            activeTab === 'schemes'
              ? 'border-indigo-500 text-indigo-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="h-4 w-4" />
          Eligible Schemes ({recommendations.length})
        </button>
        <button
          onClick={() => setActiveTab('report')}
          disabled={!report}
          className={`flex items-center gap-2 px-4 py-3.5 border-b-2 font-medium text-sm transition-all focus:outline-none ${
            !report
              ? 'opacity-40 cursor-not-allowed text-slate-600'
              : activeTab === 'report'
              ? 'border-indigo-500 text-indigo-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="h-4 w-4" />
          Recommendation Report
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'schemes' ? (
          recommendations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-slate-900/10 rounded-2xl border border-dashed border-slate-800">
              <ClipboardList className="h-12 w-12 text-slate-600 mb-3" />
              <p className="text-slate-400 text-sm font-medium">No recommendations available yet.</p>
              <p className="text-slate-500 text-xs mt-1 max-w-[280px]">
                Complete the intake profile on the left by chatting to generate matched schemes.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {recommendations.map((rec) => (
                <div
                  key={rec.schemeId}
                  className="glass-card p-5 rounded-2xl border border-slate-800/80 hover:border-indigo-500/30 flex flex-col justify-between transition-all duration-300 group"
                >
                  <div>
                    {/* Header: Score and Name */}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="inline-flex items-center gap-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-500/20 mb-2">
                          {rec.level} Scheme
                        </span>
                        <h3 className="text-lg font-bold text-slate-100 group-hover:text-indigo-400 transition-colors duration-200">
                          {rec.schemeName}
                        </h3>
                      </div>
                      
                      {/* Eligibility score pill */}
                      <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl px-3 py-1.5 text-center flex-shrink-0">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Score</p>
                        <p className="text-base font-extrabold text-indigo-400">+{rec.score}</p>
                      </div>
                    </div>

                    {/* Category & tags */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {rec.category.map((cat, idx) => (
                        <span key={idx} className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded font-medium">
                          {cat}
                        </span>
                      ))}
                      {rec.tags.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="bg-slate-900 border border-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {/* Benefit Preview */}
                    <div className="mt-4 bg-slate-950/40 border border-slate-900 rounded-xl p-3.5">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                        <Award className="h-3.5 w-3.5 text-indigo-400" />
                        Key Benefits
                      </h4>
                      <p className="text-sm text-slate-300 leading-relaxed line-clamp-3">
                        {rec.benefits}
                      </p>
                    </div>

                    {/* Rationale Reasons */}
                    <div className="mt-4 space-y-1.5">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Eligibility Match Details
                      </h4>
                      {rec.reasons.slice(0, 3).map((r, idx) => (
                        <p key={idx} className="text-xs text-slate-400 flex items-start gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500/80 mt-0.5 flex-shrink-0" />
                          <span>{r}</span>
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* Apply Action */}
                  <div className="mt-5 border-t border-slate-800/80 pt-4 flex justify-end">
                    <button
                      onClick={() => onApplyScheme(rec.schemeId, rec.schemeName)}
                      disabled={isApplying}
                      className="btn-primary flex items-center gap-1.5 text-xs py-2.5 px-4 font-bold shadow-indigo-600/10 hover:shadow-indigo-600/20"
                    >
                      Start Application
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Markdown Recommendation Report */
          <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed whitespace-pre-wrap p-2 bg-slate-950/20 border border-slate-900 rounded-2xl p-6 overflow-x-auto">
            {report}
          </div>
        )}
      </div>
    </div>
  );
};
export default RecommendationsPanel;
