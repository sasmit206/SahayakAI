import React from 'react';
import { CitizenProfile } from '../services/api';
import { CheckCircle2, AlertCircle, User, Calendar, MapPin, BadgeIndianRupee, Briefcase, Heart, UserSquare, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProfilePanelProps {
  profile: CitizenProfile;
  missingFields: string[];
}

export const ProfilePanel: React.FC<ProfilePanelProps> = ({ profile, missingFields }) => {
  const fields = [
    { key: 'name', label: 'Full name', value: profile.name, icon: User },
    { key: 'age', label: 'Age', value: profile.age, icon: Calendar },
    { key: 'gender', label: 'Gender', value: profile.gender, icon: UserSquare },
    { key: 'state', label: 'Residing state', value: profile.state, icon: MapPin },
    { key: 'income', label: 'Annual income', value: profile.income !== null ? `₹${profile.income.toLocaleString('en-IN')}` : null, icon: BadgeIndianRupee },
    { key: 'occupation', label: 'Occupation', value: profile.occupation, icon: Briefcase },
    { key: 'maritalStatus', label: 'Marital status', value: profile.maritalStatus, icon: Heart },
    { key: 'category', label: 'Social category', value: profile.category, icon: UserSquare },
    { key: 'disabilityStatus', label: 'Disability', value: profile.disabilityStatus === true ? 'Yes' : profile.disabilityStatus === false ? 'No' : null, icon: ShieldAlert },
  ];

  const filledCount = fields.filter(f => f.value !== null && f.value !== undefined).length;
  const completion = Math.round((filledCount / fields.length) * 100);

  return (
    <div className="surface flex flex-col h-full overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight text-white">Citizen profile</h2>
            <p className="text-[11.5px] text-ink-400 mt-0.5">Caseworker intake</p>
          </div>
          <span className="pill-neutral font-mono">{filledCount}/{fields.length}</span>
        </div>
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
            <span className="text-warning font-medium">{missingFields.length}</span> field{missingFields.length === 1 ? '' : 's'} still required
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {fields.map(({ key, label, value, icon: Icon }, i) => {
          const isMissing = value === null || value === undefined;
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.02 }}
              className="group flex items-center justify-between px-3.5 py-3 rounded-lg hover:bg-white/[0.03] transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon className={`h-4 w-4 shrink-0 ${isMissing ? 'text-ink-500' : 'text-ink-300'}`} strokeWidth={1.5} />
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-ink-400 font-medium">{label}</p>
                  <p className={`text-[13.5px] mt-0.5 truncate ${isMissing ? 'text-ink-500 italic' : 'text-white font-medium'}`}>
                    {isMissing ? 'Not yet captured' : String(value)}
                  </p>
                </div>
              </div>
              {isMissing ? (
                <span className="pill-warning shrink-0"><AlertCircle className="h-3 w-3" />Required</span>
              ) : (
                <span className="pill-success shrink-0"><CheckCircle2 className="h-3 w-3" />Captured</span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
export default ProfilePanel;
