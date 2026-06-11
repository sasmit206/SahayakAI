import React from 'react';
import { CitizenProfile } from '../services/api';
import { CheckCircle2, AlertCircle, User, Calendar, MapPin, BadgeIndianRupee, Briefcase, Heart, UserSquare, ShieldAlert } from 'lucide-react';

interface ProfilePanelProps {
  profile: CitizenProfile;
  missingFields: string[];
}

export const ProfilePanel: React.FC<ProfilePanelProps> = ({ profile, missingFields }) => {
  const fields = [
    { key: 'name', label: 'Full Name', value: profile.name, icon: User },
    { key: 'age', label: 'Age', value: profile.age, icon: Calendar },
    { key: 'gender', label: 'Gender', value: profile.gender, icon: UserSquare },
    { key: 'state', label: 'Residing State', value: profile.state, icon: MapPin },
    { key: 'income', label: 'Annual Income', value: profile.income !== null ? `₹${profile.income.toLocaleString('en-IN')}` : null, icon: BadgeIndianRupee },
    { key: 'occupation', label: 'Occupation', value: profile.occupation, icon: Briefcase },
    { key: 'maritalStatus', label: 'Marital Status', value: profile.maritalStatus, icon: Heart },
    { key: 'category', label: 'Social Category', value: profile.category, icon: UserSquare },
    { key: 'disabilityStatus', label: 'Disability Status', value: profile.disabilityStatus === true ? 'Yes' : profile.disabilityStatus === false ? 'No' : null, icon: ShieldAlert },
  ];

  return (
    <div className="glass-panel rounded-2xl p-6 flex flex-col h-full shadow-2xl">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-6">
        <div className="bg-indigo-500/20 p-2.5 rounded-xl border border-indigo-500/30">
          <User className="h-6 w-6 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Citizen Profile</h2>
          <p className="text-xs text-slate-400">Caseworker Intake Profile</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {fields.map(({ key, label, value, icon: Icon }) => {
          const isMissing = value === null || value === undefined;
          return (
            <div
              key={key}
              className={`flex items-center justify-between p-3.5 rounded-xl transition-all duration-200 border ${
                isMissing
                  ? 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40'
                  : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-5 w-5 ${isMissing ? 'text-amber-400/80' : 'text-indigo-400/80'}`} />
                <div>
                  <p className="text-xs text-slate-400 font-medium">{label}</p>
                  <p className={`text-sm font-semibold mt-0.5 ${isMissing ? 'text-amber-200/50 italic' : 'text-slate-100'}`}>
                    {isMissing ? 'Missing' : value}
                  </p>
                </div>
              </div>
              <div>
                {isMissing ? (
                  <span className="flex items-center gap-1 bg-amber-500/10 text-amber-400 text-[10px] font-bold px-2 py-1 rounded-full border border-amber-500/20">
                    <AlertCircle className="h-3 w-3" />
                    Required
                  </span>
                ) : (
                  <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-full border border-emerald-500/20">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default ProfilePanel;
