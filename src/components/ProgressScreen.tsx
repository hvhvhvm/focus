import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  Award, 
  BarChart3, 
  Activity,
  Flame
} from 'lucide-react';
import { Habit, Routine } from '../types';
import { motion } from 'motion/react';

interface ProgressScreenProps {
  habits: Habit[];
  routines: Routine[];
  dateToday: string;
  currentUser: any;
}

export default function ProgressScreen({
  habits,
  routines,
  dateToday,
  currentUser,
}: ProgressScreenProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'calendar'>('overview');
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date(2026, 6, 1)); // Default to July 2026

  // Days list for custom calendar grid mapping
  const daysInMonth = 31;
  const monthLabel = "July 2026";

  // Streaks & metrics
  const dayStreak = currentUser?.consecutive_locked_in_streak !== undefined ? currentUser.consecutive_locked_in_streak : 0;
  const journeyStart = currentUser?.journey_start_date ? new Date(currentUser.journey_start_date) : null;
  let currentDay = 1;
  if (journeyStart) {
    const diffTime = Math.abs(new Date().getTime() - journeyStart.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    currentDay = Math.max(1, Math.min(90, diffDays));
  }
  const daysRemaining = 90 - currentDay;
  const missionProgressPercent = Math.round((currentDay / 90) * 100);

  // Hardcode representative score trend values for trend lines
  const trendScores = [
    { day: '11', score: 35 },
    { day: '12', score: 62 },
    { day: '13', score: 40 },
    { day: '14', score: 74 },
    { day: '15', score: 60 },
    { day: '16', score: 82 },
    { day: '17', score: 70 },
  ];

  // Map scores into status indicators:
  // Win: green, Good: orange, Low: red, Missed: gray
  const getDayStatus = (dayNum: number) => {
    if (dayNum > currentDay) return 'future';
    // Static distribution matching Screenshot 5 exactly!
    if ([1, 5, 8, 12, 13, 14].includes(dayNum)) return 'missed';
    if ([2, 3, 6, 9, 11, 16].includes(dayNum)) return 'low';
    if ([4, 7, 10, 15, 18].includes(dayNum)) return 'good';
    return 'win';
  };

  const getDayColorClass = (status: string, dayNum: number) => {
    switch (status) {
      case 'win': return 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20';
      case 'good': return 'bg-amber-400 text-slate-900 shadow-sm shadow-amber-400/20';
      case 'low': return 'bg-rose-400 text-white shadow-sm shadow-rose-400/20';
      case 'missed': return 'bg-slate-400 text-white shadow-sm';
      default: return 'bg-slate-100 text-gray-300';
    }
  };

  // SVG Trend Chart Dimensions
  const chartWidth = 350;
  const chartHeight = 150;
  const padding = 25;

  const points = trendScores.map((data, idx) => {
    const x = padding + (idx * (chartWidth - padding * 2)) / (trendScores.length - 1);
    const y = chartHeight - padding - (data.score * (chartHeight - padding * 2)) / 100;
    return { x, y, ...data };
  });

  const pathD = points.length > 0 
    ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
    : '';

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${chartHeight - padding} L ${points[0].x} ${chartHeight - padding} Z`
    : '';

  return (
    <div className="w-full bg-[#F8F9FC] text-[#1E293B] flex flex-col font-sans pb-12 relative">
      
      {/* Header Bar */}
      <div className="px-6 pt-6 pb-4 select-none">
        <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">Progress</h1>
        <p className="text-gray-450 text-xs font-semibold mt-0.5">Track your 90-day trajectory</p>
      </div>

      {/* Main Tab bar */}
      <div className="px-6 mb-4">
        <div className="bg-white p-1 rounded-2xl border border-gray-150 flex shadow-sm">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'overview' 
                ? 'bg-[#12B886] text-white shadow-md shadow-emerald-500/15' 
                : 'text-gray-550 hover:text-[#0F172A]'
            }`}
          >
            📈 Overview
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'calendar' 
                ? 'bg-[#12B886] text-white shadow-md shadow-emerald-500/15' 
                : 'text-gray-550 hover:text-[#0F172A]'
            }`}
          >
            🗓️ Calendar View
          </button>
        </div>
      </div>

      {/* Content Scroller */}
      <div className="flex-1 overflow-y-auto px-6 pb-20 space-y-5">
        {activeTab === 'overview' ? (
          // Overview Section (Screenshot 6)
          <div className="space-y-4">
            {/* Mission progress block */}
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">Mission Progress</h3>
                  <p className="text-sm font-extrabold text-[#0F172A] mt-1">Day {currentDay} of 90</p>
                </div>
                <span className="text-lg font-black text-[#12B886]">{missionProgressPercent}%</span>
              </div>
              <div className="bg-gray-100 h-2.5 rounded-full overflow-hidden w-full">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${missionProgressPercent}%` }} />
              </div>
              <p className="text-xs text-gray-500 font-medium">
                {currentDay} days down, {daysRemaining} to go. Keep the streak active!
              </p>
            </div>

            {/* Score Trend chart container */}
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">Score Trend</h3>
                  <p className="text-[10px] text-gray-450 font-medium">Last 7 active lock-in days</p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-bold text-gray-400 uppercase block">Avg Score</span>
                  <span className="text-base font-black text-[#12B886] flex items-center gap-0.5 justify-end">
                    <TrendingUp className="w-4 h-4" />
                    82
                  </span>
                </div>
              </div>

              {/* Custom SVG Line Chart */}
              <div className="relative pt-2">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
                  {/* Grid Lines */}
                  {[0, 25, 50, 75, 100].map((tick, i) => {
                    const y = chartHeight - padding - (tick * (chartHeight - padding * 2)) / 100;
                    return (
                      <g key={i}>
                        <line x1={padding} y1={y} x2={chartWidth - padding} y2={y} stroke="#F1F5F9" strokeWidth="1" />
                        <text x={padding - 8} y={y + 3} className="text-[8px] font-mono fill-gray-400 text-right" textAnchor="end">{tick}</text>
                      </g>
                    );
                  })}

                  {/* Area gradient */}
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Area beneath path */}
                  <path d={areaD} fill="url(#chartGrad)" />

                  {/* Line Path */}
                  <path d={pathD} fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                  {/* Node circles */}
                  {points.map((p, idx) => (
                    <g key={idx} className="group cursor-pointer">
                      <circle cx={p.x} cy={p.y} r="5" fill="#FFFFFF" stroke="#10B981" strokeWidth="2.5" />
                      <circle cx={p.x} cy={p.y} r="2" fill="#10B981" />
                      <text x={p.x} y={p.y - 10} className="text-[9px] font-black fill-[#0F172A] opacity-0 group-hover:opacity-100 transition duration-200" textAnchor="middle">{p.score}%</text>
                      <text x={p.x} y={chartHeight - 6} className="text-[9px] font-mono font-bold fill-gray-400" textAnchor="middle">{p.day}</text>
                    </g>
                  ))}
                </svg>
              </div>
            </div>

            {/* Trajectory breakdown card */}
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-5 text-white shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl" />
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <span className="text-indigo-400 text-[9px] font-bold uppercase tracking-wider">Momentum Index</span>
                  <h4 className="text-lg font-black tracking-tight">Locked In Flow State</h4>
                  <p className="text-[10px] text-slate-300">You completed 90% of standalone study goals.</p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-2xl flex items-center justify-center">
                  <Flame className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Calendar Grid Section (Screenshot 5)
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
              {/* Calendar Selector */}
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-extrabold text-[#0F172A]">{monthLabel}</h3>
                <div className="flex items-center gap-1.5">
                  <button className="bg-slate-50 p-2 rounded-xl border border-gray-100 hover:bg-slate-100 transition">
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </button>
                  <button className="bg-slate-50 p-2 rounded-xl border border-gray-100 hover:bg-slate-100 transition">
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-black text-gray-450 uppercase tracking-widest border-b border-gray-50 pb-2">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-2.5 text-center pt-1">
                {/* Blank offsets for Thursday start */}
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={`offset-${idx}`} className="h-9 flex items-center justify-center text-gray-300 text-xs font-semibold" />
                ))}

                {/* Actual Month Days */}
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const status = getDayStatus(dayNum);
                  const colorClass = getDayColorClass(status, dayNum);
                  
                  return (
                    <div 
                      key={dayNum}
                      className={`h-9 w-9 mx-auto rounded-full flex items-center justify-center text-xs font-extrabold cursor-pointer transition-transform hover:scale-110 active:scale-95 ${colorClass}`}
                      title={`Day ${dayNum}: ${status}`}
                    >
                      {dayNum}
                    </div>
                  );
                })}
              </div>

              {/* Color legends matching Screenshot 5 */}
              <div className="grid grid-cols-4 gap-1.5 border-t border-gray-50 pt-4 text-center select-none">
                <div className="flex items-center gap-1 justify-center">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full shrink-0" />
                  <span className="text-[8px] font-bold text-gray-500 uppercase">Win <span className="text-gray-400 font-medium">(80-100)</span></span>
                </div>
                <div className="flex items-center gap-1 justify-center">
                  <span className="w-2.5 h-2.5 bg-amber-400 rounded-full shrink-0" />
                  <span className="text-[8px] font-bold text-gray-500 uppercase">Good <span className="text-gray-400 font-medium">(50-79)</span></span>
                </div>
                <div className="flex items-center gap-1 justify-center">
                  <span className="w-2.5 h-2.5 bg-rose-400 rounded-full shrink-0" />
                  <span className="text-[8px] font-bold text-gray-500 uppercase">Low <span className="text-gray-400 font-medium">(1-49)</span></span>
                </div>
                <div className="flex items-center gap-1 justify-center">
                  <span className="w-2.5 h-2.5 bg-slate-400 rounded-full shrink-0" />
                  <span className="text-[8px] font-bold text-gray-500 uppercase">Miss <span className="text-gray-400 font-medium">(0)</span></span>
                </div>
              </div>
            </div>

            {/* July Summary Stats card (Screenshot 5) */}
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
              <h4 className="text-xs font-black text-[#0F172A] uppercase tracking-widest mb-4">July Summary</h4>
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="bg-slate-50 p-3 rounded-2xl border border-gray-50">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Completed</span>
                  <span className="text-xl font-black text-[#0F172A] mt-1.5 block">12 days</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-gray-50">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Avg Score</span>
                  <span className="text-xl font-black text-emerald-500 mt-1.5 block">82</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-gray-50">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Best Day</span>
                  <span className="text-xl font-black text-blue-500 mt-1.5 block">95</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
