/**
 * ProfilePanel
 * - Translatable field labels via useLang()
 * - Animated profile completion bar
 * - Accessible status pills
 */
import React from 'react';
import { CitizenProfile } from '../services/api';
import {
  CheckCircle2, AlertCircle, User, Calendar, MapPin,
  BadgeIndianRupee, Briefcase, Heart, UserSquare, ShieldAlert,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useLang } from '../context/LanguageContext';

interface ProfilePanelProps {
  profile: CitizenProfile;
  missingFields: string[];
}

export const ProfilePanel: React.FC<ProfilePanelProps> = ({ profile, missingFields }) => {
  const { t } = useLang();

  const fields = [
    { key: 'name',            value: profile.name,          icon: User },
    { key: 'age',             value: profile.age,           icon: Calendar },
    { key: 'gender',          value: profile.gender,        icon: UserSquare },
    { key: 'state',           value: profile.state,         icon: MapPin },
    {
      key: 'income',
      value: profile.income !== null ? `₹${profile.income.toLocaleString('en-IN')}` : null,
      icon: BadgeIndianRupee,
    },
    { key: 'occupation',      value: profile.occupation,    icon: Briefcase },
    { key: 'maritalStatus',   value: profile.maritalStatus, icon: Heart },
    { key: 'category',        value: profile.category,      icon: UserSquare },
    {
      key: 'disabilityStatus',
      value: profile.disabilityStatus === true ? 'Yes' : profile.disabilityStatus === false ? 'No' : null,
      icon: ShieldAlert,
    },
  ];

  const filledCount = fields.filter((f) => f.value !== null && f.value !== undefined).length;
  const completion = Math.round((filledCount / fields.length) * 100);

  return (
    <div className="surface flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight text-white">{t.profileTitle}</h2>
            <p className="text-[11.5px] text-ink-400 mt-0.5">{t.profileSubtitle}</p>
          </div>
          <span className="pill-neutral font-mono">{filledCount}/{fields.length}</span>
        </div>

        {/* Completion bar */}
        <div className="mt-3 h-1 w-full rounded-full bg-white/[0.05] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completion}%` }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="h-full bg-accent"
          />
        </div>

        {missingFields.length > 0 && (
          <p className="mt-2.5 text-[11.5px] text-ink-400">
            <span className="text-warning font-medium">{missingFields.length}</span>{' '}
            {t.profileMissingFields(missingFields.length).replace(`${missingFields.length} `, '')}
          </p>
        )}
      </div>

      {/* Fields list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {fields.map(({ key, value, icon: Icon }, i) => {
          const isMissing = value === null || value === undefined;
          const label = t.profileFields[key] ?? key;
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.02 }}
              className="group flex items-center justify-between px-3.5 py-3 rounded-lg hover:bg-white/[0.03] transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`h-4 w-4 shrink-0 ${isMissing ? 'text-ink-500' : 'text-ink-300'}`}
                  strokeWidth={1.5}
                />
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-ink-400 font-medium">{label}</p>
                  <p className={`text-[13.5px] mt-0.5 truncate ${isMissing ? 'text-ink-500 italic' : 'text-white font-medium'}`}>
                    {isMissing ? t.profileNotCaptured : String(value)}
                  </p>
                </div>
              </div>

              {isMissing ? (
                <span className="pill-warning shrink-0">
                  <AlertCircle className="h-3 w-3" />
                  {t.profileRequired}
                </span>
              ) : (
                <span className="pill-success shrink-0">
                  <CheckCircle2 className="h-3 w-3" />
                  {t.profileCaptured}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ProfilePanel;
