import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  Award, 
  BarChart3, 
  Activity,
  Flame,
  X,
  Check,
  CheckCircle2,
  Sparkles,
  Star,
  Target
} from 'lucide-react';
import { Habit, Routine } from '../types';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'calendar'>('calendar');

  // Mission Start Date calculation
  const getStartDate = (): Date => {
    if (currentUser?.journey_start_date) {
      const parsed = new Date(currentUser.journey_start_date);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    // Default fallback: 14 days prior to today so user sees active historical days
    const today = new Date(dateToday);
    today.setDate(today.getDate() - 14);
    return today;
  };

  const startDateObj = getStartDate();
  
  // Calculate current 90-day mission metrics
  const todayObj = new Date(dateToday);
  const diffTime = todayObj.getTime() - startDateObj.getTime();
  const currentDay = Math.max(1, Math.min(90, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1));
  const daysRemaining = 90 - currentDay;
  const missionProgressPercent = Math.round((currentDay / 90) * 100);

  // Month 1, Month 2, Month 3 dates
  const m1Date = new Date(startDateObj.getFullYear(), startDateObj.getMonth(), 1);
  const m2Date = new Date(startDateObj.getFullYear(), startDateObj.getMonth() + 1, 1);
  const m3Date = new Date(startDateObj.getFullYear(), startDateObj.getMonth() + 2, 1);

  const monthOptions = [
    { label: 'Month 1', date: m1Date },
    { label: 'Month 2', date: m2Date },
    { label: 'Month 3', date: m3Date },
  ];

  // Selected Month Index (0, 1, 2)
  const [selectedMonthIdx, setSelectedMonthIdx] = useState<number>(0);
  const currentViewMonth = monthOptions[selectedMonthIdx].date;

  // Selected day inspector modal state
  const [selectedDayDetail, setSelectedDayDetail] = useState<{
    dateStr: string;
    dayNum: number | null;
    score: number;
    status: 'win' | 'good' | 'low' | 'missed' | 'future';
    habitLogs: { name: string; category: string; value: number; target: number; unit: string; completed: boolean }[];
  } | null>(null);

  // Compute daily score & status for any YYYY-MM-DD string
  const getDayMetrics = (dateStr: string) => {
    // Mission day number
    const dObj = new Date(dateStr);
    const dayDiff = Math.floor((dObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const missionDay = dayDiff >= 1 && dayDiff <= 90 ? dayDiff : null;

    if (dateStr > dateToday) {
      return { score: 0, status: 'future' as const, missionDay, habitLogs: [] };
    }

    let totalLogged = 0;
    let totalTarget = 0;
    const habitLogs: { name: string; category: string; value: number; target: number; unit: string; completed: boolean }[] = [];

    habits.forEach(h => {
      const val = h.history[dateStr] || 0;
      const tgt = h.target || 1;
      totalLogged += Math.min(val, tgt);
      totalTarget += tgt;

      habitLogs.push({
        name: h.name,
        category: h.category,
        value: val,
        target: tgt,
        unit: h.unit || 'reps',
        completed: val >= tgt,
      });
    });

    const score = totalTarget > 0 ? Math.min(100, Math.round((totalLogged / totalTarget) * 100)) : 0;
    
    let status: 'win' | 'good' | 'low' | 'missed' | 'future' = 'missed';
    if (score >= 80) status = 'win';
    else if (score >= 50) status = 'good';
    else if (score > 0) status = 'low';
    else status = 'missed';

    return { score, status, missionDay, habitLogs };
  };

  const getDayColorClass = (status: string, isToday: boolean) => {
    let base = '';
    switch (status) {
      case 'win': base = 'bg-emerald-500 text-white shadow-xs shadow-emerald-500/20'; break;
      case 'good': base = 'bg-amber-400 text-slate-900 shadow-xs shadow-amber-400/20'; break;
      case 'low': base = 'bg-rose-400 text-white shadow-xs shadow-rose-400/20'; break;
      case 'missed': base = 'bg-slate-400 text-white shadow-xs'; break;
      default: base = 'bg-slate-100 text-slate-400 border border-slate-200'; break;
    }
    if (isToday) {
      return `${base} ring-3 ring-emerald-500 ring-offset-2 font-black scale-105 z-10`;
    }
    return base;
  };

  // Calendar rendering calculations for currentViewMonth
  const year = currentViewMonth.getFullYear();
  const month = currentViewMonth.getMonth();
  const monthName = currentViewMonth.toLocaleString('default', { month: 'long' });
  const monthLabel = `${monthName} ${year}`;
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayWeekday = new Date(year, month, 1).getDay(); // 0 is Sun
  const offsetDays = (firstDayWeekday + 6) % 7; // Convert to Mon=0

  // Month Statistics
  let monthCompletedDays = 0;
  let monthTotalScore = 0;
  let monthEvaluatedDays = 0;
  let monthBestScore = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (dStr <= dateToday) {
      const m = getDayMetrics(dStr);
      if (m.status !== 'future') {
        monthEvaluatedDays++;
        monthTotalScore += m.score;
        if (m.score >= 80) monthCompletedDays++;
        if (m.score > monthBestScore) monthBestScore = m.score;
      }
    }
  }

  const monthAvgScore = monthEvaluatedDays > 0 ? Math.round(monthTotalScore / monthEvaluatedDays) : 0;

  // Overview score trend data
  const trendScores = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date(dateToday);
    d.setDate(d.getDate() - (6 - idx));
    const dStr = d.toISOString().split('T')[0];
    const m = getDayMetrics(dStr);
    return { day: String(d.getDate()), score: m.score };
  });

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
        <p className="text-gray-450 text-xs font-semibold mt-0.5">Track your 90-day mission trajectory</p>
      </div>

      {/* Main Tab Bar */}
      <div className="px-6 mb-4">
        <div className="bg-white p-1 rounded-2xl border border-gray-150 flex shadow-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'overview' 
                ? 'bg-[#12B886] text-white shadow-md shadow-emerald-500/15 font-black' 
                : 'text-gray-550 hover:text-[#0F172A]'
            }`}
          >
            📈 Overview
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'calendar' 
                ? 'bg-[#12B886] text-white shadow-md shadow-emerald-500/15 font-black' 
                : 'text-gray-550 hover:text-[#0F172A]'
            }`}
          >
            🗓️ 90-Day Calendar View
          </button>
        </div>
      </div>

      {/* Content Container */}
      <div className="flex-1 overflow-y-auto px-6 pb-20 space-y-5">
        {activeTab === 'overview' ? (
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
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${missionProgressPercent}%` }} />
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
                    {monthAvgScore || 82}%
                  </span>
                </div>
              </div>

              {/* Custom SVG Line Chart */}
              <div className="relative pt-2">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
                  {[0, 25, 50, 75, 100].map((tick, i) => {
                    const y = chartHeight - padding - (tick * (chartHeight - padding * 2)) / 100;
                    return (
                      <g key={i}>
                        <line x1={padding} y1={y} x2={chartWidth - padding} y2={y} stroke="#F1F5F9" strokeWidth="1" />
                        <text x={padding - 8} y={y + 3} className="text-[8px] font-mono fill-gray-400 text-right" textAnchor="end">{tick}</text>
                      </g>
                    );
                  })}

                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  
                  <path d={areaD} fill="url(#chartGrad)" />
                  <path d={pathD} fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

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
            <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 rounded-3xl p-5 text-white shadow-md relative overflow-hidden border border-indigo-500/20">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <span className="text-indigo-400 text-[9px] font-bold uppercase tracking-wider">Momentum Index</span>
                  <h4 className="text-lg font-black tracking-tight">Locked In Flow State</h4>
                  <p className="text-[10px] text-slate-300">You are on Day {currentDay} of your 90-day transformation.</p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-2xl flex items-center justify-center">
                  <Flame className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Calendar Grid Section */
          <div className="space-y-4">
            
            {/* 3-Month Mission Selector Pills */}
            <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none flex-1">
                {monthOptions.map((opt, idx) => {
                  const isSelected = selectedMonthIdx === idx;
                  const mName = opt.date.toLocaleString('default', { month: 'short', year: 'numeric' });
                  return (
                    <button
                      key={opt.label}
                      onClick={() => setSelectedMonthIdx(idx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer shrink-0 border ${
                        isSelected
                          ? 'bg-slate-950 text-white border-slate-950 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{opt.label}</span>
                      <span className="text-[10px] opacity-75 ml-1 font-semibold">({mName})</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button 
                  onClick={() => setSelectedMonthIdx(prev => Math.max(0, prev - 1))}
                  disabled={selectedMonthIdx === 0}
                  className="p-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setSelectedMonthIdx(prev => Math.min(2, prev + 1))}
                  disabled={selectedMonthIdx === 2}
                  className="p-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Main Calendar Card */}
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-1 border-b border-gray-50">
                <div>
                  <h3 className="text-base font-black text-[#0F172A]">{monthLabel}</h3>
                  <span className="text-[10px] font-bold text-emerald-600">Month {selectedMonthIdx + 1} of 90-Day Mission</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                  Day {currentDay}/90
                </span>
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-black text-gray-450 uppercase tracking-widest pb-1">
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
                {/* Blank offset cells for starting weekday */}
                {Array.from({ length: offsetDays }).map((_, idx) => (
                  <div key={`offset-${idx}`} className="h-9 flex items-center justify-center text-gray-300 text-xs font-semibold" />
                ))}

                {/* Month Days */}
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  const isToday = dateStr === dateToday;
                  const metrics = getDayMetrics(dateStr);
                  const colorClass = getDayColorClass(metrics.status, isToday);

                  return (
                    <button 
                      key={dayNum}
                      onClick={() => setSelectedDayDetail({
                        dateStr,
                        dayNum: metrics.missionDay,
                        score: metrics.score,
                        status: metrics.status,
                        habitLogs: metrics.habitLogs,
                      })}
                      className={`h-9 w-9 mx-auto rounded-full flex flex-col items-center justify-center text-xs font-extrabold cursor-pointer transition-all hover:scale-110 active:scale-95 relative ${colorClass}`}
                      title={metrics.missionDay ? `Mission Day ${metrics.missionDay} (${dateStr}): ${metrics.score}%` : `${dateStr}: ${metrics.status}`}
                    >
                      <span>{dayNum}</span>
                      {metrics.missionDay && (
                        <span className="text-[7px] font-mono leading-none opacity-80 mt-[-1px]">
                          d{metrics.missionDay}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Color Legends */}
              <div className="grid grid-cols-4 gap-1 border-t border-gray-50 pt-4 text-center select-none">
                <div className="flex items-center gap-1 justify-center">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full shrink-0" />
                  <span className="text-[8px] font-extrabold text-gray-600 uppercase">Win <span className="text-gray-400 font-medium">(80-100%)</span></span>
                </div>
                <div className="flex items-center gap-1 justify-center">
                  <span className="w-2.5 h-2.5 bg-amber-400 rounded-full shrink-0" />
                  <span className="text-[8px] font-extrabold text-gray-600 uppercase">Good <span className="text-gray-400 font-medium">(50-79%)</span></span>
                </div>
                <div className="flex items-center gap-1 justify-center">
                  <span className="w-2.5 h-2.5 bg-rose-400 rounded-full shrink-0" />
                  <span className="text-[8px] font-extrabold text-gray-600 uppercase">Low <span className="text-gray-400 font-medium">(1-49%)</span></span>
                </div>
                <div className="flex items-center gap-1 justify-center">
                  <span className="w-2.5 h-2.5 bg-slate-400 rounded-full shrink-0" />
                  <span className="text-[8px] font-extrabold text-gray-600 uppercase">Miss <span className="text-gray-400 font-medium">(0%)</span></span>
                </div>
              </div>
            </div>

            {/* Monthly Summary Stats Card */}
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-3">
              <h4 className="text-xs font-black text-[#0F172A] uppercase tracking-widest">{monthName} Summary</h4>
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="bg-slate-50 p-3 rounded-2xl border border-gray-50">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Completed Wins</span>
                  <span className="text-xl font-black text-emerald-600 mt-1 block">{monthCompletedDays} days</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-gray-50">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Avg Score</span>
                  <span className="text-xl font-black text-[#0F172A] mt-1 block">{monthAvgScore}%</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-gray-50">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Best Day</span>
                  <span className="text-xl font-black text-blue-600 mt-1 block">{monthBestScore}%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selected Day Inspector Modal */}
      {selectedDayDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in select-none">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4 relative">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-black text-slate-900">{selectedDayDetail.dateStr}</h3>
                </div>
                {selectedDayDetail.dayNum && (
                  <p className="text-[10px] font-extrabold text-emerald-600 mt-0.5">
                    Mission Day {selectedDayDetail.dayNum} of 90
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedDayDetail(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Score & Status Banner */}
            <div className={`p-3 rounded-2xl flex items-center justify-between ${
              selectedDayDetail.status === 'win' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
              selectedDayDetail.status === 'good' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
              selectedDayDetail.status === 'low' ? 'bg-rose-50 text-rose-800 border border-rose-200' :
              selectedDayDetail.status === 'future' ? 'bg-slate-50 text-slate-600 border border-slate-200' :
              'bg-slate-100 text-slate-700 border border-slate-200'
            }`}>
              <div className="space-y-0.5">
                <span className="text-[9px] font-black uppercase tracking-wider">Overall Performance</span>
                <p className="text-xs font-black">
                  {selectedDayDetail.status === 'win' ? '🏆 WIN DAY' :
                   selectedDayDetail.status === 'good' ? '⭐ GOOD DAY' :
                   selectedDayDetail.status === 'low' ? '⚡ LOW COMPLETION' :
                   selectedDayDetail.status === 'future' ? '🔒 UPCOMING DAY' :
                   '❌ NO LOGS RECORDED'}
                </p>
              </div>
              <span className="text-lg font-black">{selectedDayDetail.score}%</span>
            </div>

            {/* Habit Logs List for this day */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Logged Habits</span>
              {selectedDayDetail.habitLogs.map((h, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-150">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className={`w-2 h-2 rounded-full ${h.completed ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span className="text-xs font-extrabold text-slate-800 truncate">{h.name}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-500 shrink-0 ml-2">
                    {h.value} / {h.target} {h.unit}
                  </span>
                </div>
              ))}

              {selectedDayDetail.habitLogs.length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-4">No habit data available for this date.</p>
              )}
            </div>

            <button
              onClick={() => setSelectedDayDetail(null)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-2.5 rounded-xl transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
