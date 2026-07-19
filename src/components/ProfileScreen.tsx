import React from 'react';
import { 
  User, 
  LogOut, 
  RefreshCw, 
  ShieldCheck, 
  Target, 
  Trophy, 
  Compass, 
  Award,
  Zap,
  Flame,
  Dumbbell,
  CheckCircle2
} from 'lucide-react';
import { Habit, Routine } from '../types';

interface ProfileScreenProps {
  currentUser: any;
  userPoints: number;
  habits: Habit[];
  routines: Routine[];
  onLogout: () => void;
  onReset: () => void;
}

export default function ProfileScreen({
  currentUser,
  userPoints,
  habits,
  routines,
  onLogout,
  onReset
}: ProfileScreenProps) {
  // Stats
  const email = currentUser?.email || 'saicharanreddy.kandi@gmail.com';
  const name = email.split('@')[0];
  const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
  const dayStreak = currentUser?.consecutive_locked_in_streak || 17;

  // Level computation based on points (e.g. 100 points per level)
  const userLevel = Math.max(1, Math.floor(userPoints / 100));
  const pointsRemainingForNextLevel = 100 - (userPoints % 100);

  // Focus area totals
  const totalHabits = habits.length;
  const totalRoutines = routines.length;

  return (
    <div className="w-full bg-[#F8F9FC] text-[#1E293B] flex flex-col font-sans pb-12 relative">
      
      {/* Header */}
      <div className="px-6 pt-6 pb-4 select-none">
        <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">Profile</h1>
        <p className="text-gray-450 text-xs font-semibold mt-0.5">Your locked-in credentials</p>
      </div>

      {/* Profile Card Summary */}
      <div className="px-6 space-y-4 flex-1 overflow-y-auto pb-20">
        
        {/* Main avatar block */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#12B886]/10 border border-[#12B886]/20 flex items-center justify-center font-bold text-2xl text-emerald-500 shadow-sm shadow-emerald-500/10 shrink-0">
            {capitalizedName.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5 bg-emerald-50 text-[#099268] border border-emerald-100 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider w-fit">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Rank: LOCK-IN Warrior</span>
            </div>
            <h2 className="text-lg font-black text-[#0F172A] mt-1.5">{capitalizedName}</h2>
            <p className="text-[10px] font-mono text-gray-400 mt-0.5">{email}</p>
          </div>
        </div>

        {/* Level progress container */}
        <div className="bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#1E293B] rounded-3xl p-5 text-white shadow-md space-y-3.5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-400" />
              <span className="text-xs font-extrabold text-slate-300 uppercase tracking-widest">Level {userLevel} Tracker</span>
            </div>
            <span className="text-xs font-bold text-emerald-400">+{userPoints} Pts</span>
          </div>
          <div className="bg-slate-850 h-2 rounded-full overflow-hidden w-full border border-slate-800">
            <div className="bg-gradient-to-r from-[#12B886] to-emerald-400 h-full rounded-full" style={{ width: `${100 - pointsRemainingForNextLevel}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-bold">
            <span>{100 - pointsRemainingForNextLevel}% progress</span>
            <span>{pointsRemainingForNextLevel} points to Level {userLevel + 1}</span>
          </div>
        </div>

        {/* 90-Day Challenge stats grid */}
        <div className="grid grid-cols-2 gap-3.5">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs text-center flex flex-col items-center">
            <Flame className="w-6 h-6 text-orange-500" />
            <span className="text-lg font-black text-[#0F172A] mt-2">{dayStreak} days</span>
            <span className="text-[9px] text-gray-450 font-bold uppercase tracking-wider mt-1">Locked-In Streak</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs text-center flex flex-col items-center">
            <CheckCircle2 className="w-6 h-6 text-blue-500" />
            <span className="text-lg font-black text-[#0F172A] mt-2">{totalHabits} habits</span>
            <span className="text-[9px] text-gray-450 font-bold uppercase tracking-wider mt-1">Tracked Habits</span>
          </div>
        </div>

        {/* 90-Day Mission Pillars List */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4.5">
          <h3 className="text-xs font-black text-[#0F172A] uppercase tracking-widest">90-Day Active Targets</h3>
          
          <div className="space-y-3.5">
            {[
              { title: 'Fitness Goals', desc: 'Workout, lift, and maintain physical activity.', icon: Dumbbell, color: 'text-emerald-500 bg-emerald-50 border-emerald-100' },
              { title: 'Diet & Nutrition', desc: 'Protein target 120g+, 3L water daily.', icon: Target, color: 'text-amber-500 bg-amber-50 border-amber-100' },
              { title: 'Study & Career', desc: 'Technical reading, coding, and focus blocks.', icon: Compass, color: 'text-blue-500 bg-blue-50 border-blue-100' },
            ].map((goal, idx) => {
              const GoalIcon = goal.icon;
              return (
                <div key={idx} className="flex gap-3 items-start p-2 rounded-2xl hover:bg-slate-50 transition border border-transparent">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${goal.color}`}>
                    <GoalIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-[#0F172A]">{goal.title}</h4>
                    <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">{goal.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions section */}
        <div className="space-y-2.5 pt-4">
          <button
            onClick={onReset}
            className="w-full bg-rose-50 hover:bg-rose-100/85 border border-rose-150 py-3.5 rounded-2xl text-rose-600 font-extrabold text-xs tracking-wider flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span>RESET 90-DAY MISSION</span>
          </button>

          <button
            onClick={onLogout}
            className="w-full bg-slate-100 hover:bg-slate-200 border border-slate-200 py-3.5 rounded-2xl text-slate-700 font-extrabold text-xs tracking-wider flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>SIGN OUT MISSION</span>
          </button>
        </div>

        {/* Version branding */}
        <p className="text-[9px] font-mono text-center text-gray-400 uppercase tracking-widest pt-4">
          90-Day Improvement Challenge Engine v1.0.0
        </p>

      </div>
    </div>
  );
}
