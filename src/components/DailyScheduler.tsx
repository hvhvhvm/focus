import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Calendar as CalendarIcon, 
  Sun, 
  Sunset, 
  Moon, 
  Sparkles, 
  Trash2, 
  Dumbbell, 
  RotateCcw,
  CheckCircle2,
  FolderPlus,
  ListTree,
  Clock,
  X,
  Pencil
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDateString, dateToday } from '../data';

export type TimeBlock = 'Morning' | 'Afternoon' | 'Evening' | 'Night';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface SchedulerTask {
  id: string;
  date: string; // YYYY-MM-DD
  timeBlock: TimeBlock;
  title: string;
  completed: boolean;
  scheduledTime?: string; // e.g. "07:30 AM"
  type?: 'standard' | 'choice' | 'group';
  options?: string[]; // for activity/sports/custom choice
  selectedOption?: string;
  subtasks?: SubTask[];
  createdAt: string;
}

const STORAGE_KEY = 'focus_now_daily_scheduler_tasks_v9';

export const DEFAULT_SPORTS_OPTIONS = [
  'Gym', 
  'Badminton', 
  'Tennis', 
  'Football', 
  'Basketball', 
  'Swimming', 
  'Running', 
  'Yoga', 
  'Cycling', 
  'Cricket'
];

export const SPORTS_ICONS_MAP: Record<string, string> = {
  'Gym': '🏋️',
  'Badminton': '🏸',
  'Tennis': '🎾',
  'Football': '⚽',
  'Basketball': '🏀',
  'Swimming': '🏊',
  'Running': '🏃',
  'Yoga': '🧘',
  'Cycling': '🚴',
  'Cricket': '🏏',
  'Boxing': '🥊',
  'Padel': '🎾',
  'Table Tennis': '🏓',
  'Workout': '💪',
};

const BLOCK_TIME_PRESETS: Record<TimeBlock, string[]> = {
  Morning: ['06:30 AM', '07:30 AM', '08:30 AM', '10:00 AM'],
  Afternoon: ['12:30 PM', '02:00 PM', '03:30 PM', '04:30 PM'],
  Evening: ['05:30 PM', '06:30 PM', '07:45 PM', '08:30 PM'],
  Night: ['09:15 PM', '10:00 PM', '11:00 PM', '11:30 PM'],
};

const DEFAULT_TASKS_SEED: SchedulerTask[] = [
  {
    id: 'seed-1',
    date: dateToday,
    timeBlock: 'Morning',
    title: 'Hydrate & Morning Stretch',
    scheduledTime: '06:30 AM',
    completed: false,
    type: 'standard',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-2',
    date: dateToday,
    timeBlock: 'Morning',
    title: 'Morning Rituals Group',
    scheduledTime: '07:30 AM',
    completed: false,
    type: 'group',
    subtasks: [
      { id: 'sub-1', title: '50 Pushups & Plank', completed: true },
      { id: 'sub-2', title: 'Cold Shower', completed: false },
      { id: 'sub-3', title: '10 min Meditation', completed: false },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-3',
    date: dateToday,
    timeBlock: 'Afternoon',
    title: 'Play Sports Choice',
    scheduledTime: '04:00 PM',
    completed: false,
    type: 'choice',
    options: ['Gym', 'Badminton', 'Basketball', 'Tennis', 'Running', 'Swimming'],
    selectedOption: 'Badminton',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-4',
    date: dateToday,
    timeBlock: 'Evening',
    title: 'Review today\'s goal block',
    scheduledTime: '06:30 PM',
    completed: false,
    type: 'standard',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-5',
    date: dateToday,
    timeBlock: 'Night',
    title: 'Wind down & read 15 pages',
    scheduledTime: '10:00 PM',
    completed: false,
    type: 'standard',
    createdAt: new Date().toISOString(),
  },
];

const TIME_BLOCK_META: Record<TimeBlock, { label: string; timeRange: string; icon: React.ElementType; desc: string }> = {
  Morning: { label: 'Morning', timeRange: '06:00 AM - 12:00 PM', icon: Sun, desc: 'Set the tone for the day' },
  Afternoon: { label: 'Afternoon', timeRange: '12:00 PM - 05:00 PM', icon: Sparkles, desc: 'Peak execution & output' },
  Evening: { label: 'Evening', timeRange: '05:00 PM - 09:00 PM', icon: Sunset, desc: 'Movement & recovery' },
  Night: { label: 'Night', timeRange: '09:00 PM - 12:00 AM', icon: Moon, desc: 'Wind down & reflect' },
};

/** Helper to generate calendar dates around selected date */
const generateDateStrip = (centerDateStr: string) => {
  const dates: { dateStr: string; dayName: string; dayNumber: number; isToday: boolean; isSelected: boolean }[] = [];
  const baseDate = new Date(centerDateStr + 'T00:00:00');
  
  for (let i = -3; i <= 7; i++) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + i);
    const dateStr = formatDateString(d);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    const dayNumber = d.getDate();
    const isToday = dateStr === dateToday;
    const isSelected = dateStr === centerDateStr;
    dates.push({ dateStr, dayName, dayNumber, isToday, isSelected });
  }
  return dates;
};

const getCurrentTimeBlock = (): TimeBlock => {
  const h = new Date().getHours();
  if (h >= 6 && h < 12) return 'Morning';
  if (h >= 12 && h < 17) return 'Afternoon';
  if (h >= 17 && h < 21) return 'Evening';
  return 'Night';
};

export default function DailyScheduler() {
  const [selectedDate, setSelectedDate] = useState<string>(dateToday);
  const [tasks, setTasks] = useState<SchedulerTask[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load scheduler tasks:', e);
    }
    return DEFAULT_TASKS_SEED;
  });

  // Expand state for each section (Morning, Afternoon, Evening, Night)
  const [expandedBlocks, setExpandedBlocks] = useState<Record<TimeBlock, boolean>>({
    Morning: true,
    Afternoon: true,
    Evening: true,
    Night: true,
  });

  // Expanded state for each grouped / choice task item
  const [expandedTaskIds, setExpandedTaskIds] = useState<Record<string, boolean>>({
    'seed-2': false,
    'seed-3': false,
  });



  // Inline input state per timeBlock
  const [inlineTaskInput, setInlineTaskInput] = useState<{
    block: TimeBlock | null;
    text: string;
    scheduledTime: string;
    taskType: 'standard' | 'choice' | 'group';
    initialSubtasks: string[];
    customChoices: string[];
    newChoiceInput: string;
  }>({
    block: null,
    text: '',
    scheduledTime: '',
    taskType: 'standard',
    initialSubtasks: [''],
    customChoices: DEFAULT_SPORTS_OPTIONS,
    newChoiceInput: '',
  });

  // Adding subtask inside an existing group state
  const [newSubtaskInput, setNewSubtaskInput] = useState<{ taskId: string | null; text: string }>({
    taskId: null,
    text: '',
  });

  // Adding choice inside an existing choice task
  const [newChoiceTaskOptionInput, setNewChoiceTaskOptionInput] = useState<{ taskId: string | null; text: string }>({
    taskId: null,
    text: '',
  });

  // Toast notice state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Save tasks to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to save scheduler tasks:', e);
    }
  }, [tasks]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleExpandBlock = (block: TimeBlock) => {
    setExpandedBlocks(prev => ({ ...prev, [block]: !prev[block] }));
  };

  const toggleExpandTask = (taskId: string) => {
    setExpandedTaskIds(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const tasksForSelectedDate = tasks.filter(t => t.date === selectedDate);

  // Toggle completion of a task
  const handleToggleTask = (taskId: string) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          const nextCompleted = !t.completed;
          let nextSubtasks = t.subtasks;
          if (t.subtasks && t.subtasks.length > 0) {
            nextSubtasks = t.subtasks.map(s => ({ ...s, completed: nextCompleted }));
          }
          return { ...t, completed: nextCompleted, subtasks: nextSubtasks };
        }
        return t;
      })
    );
  };

  // Toggle completion of a subtask inside a grouped task
  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId && t.subtasks) {
          const updatedSubtasks = t.subtasks.map(st => 
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
          );
          const allDone = updatedSubtasks.length > 0 && updatedSubtasks.every(st => st.completed);
          return {
            ...t,
            subtasks: updatedSubtasks,
            completed: allDone,
          };
        }
        return t;
      })
    );
  };

  // Add a subtask to an existing grouped task
  const handleAddSubtaskToGroup = (taskId: string) => {
    const text = newSubtaskInput.text.trim();
    if (!text) return;

    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          const newSub: SubTask = {
            id: 'sub_' + Math.random().toString(36).substring(2, 9),
            title: text,
            completed: false,
          };
          const updatedSubs = [...(t.subtasks || []), newSub];
          return {
            ...t,
            subtasks: updatedSubs,
            completed: false,
          };
        }
        return t;
      })
    );

    setNewSubtaskInput({ taskId: null, text: '' });
  };

  // Add a custom choice option to an existing choice task
  const handleAddOptionToChoiceTask = (taskId: string) => {
    const text = newChoiceTaskOptionInput.text.trim();
    if (!text) return;

    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          const existingOptions = t.options || [];
          if (existingOptions.includes(text)) return t;
          return {
            ...t,
            options: [...existingOptions, text],
          };
        }
        return t;
      })
    );

    setNewChoiceTaskOptionInput({ taskId: null, text: '' });
  };

  // Delete a subtask from a grouped task
  const handleDeleteSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId && t.subtasks) {
          const updatedSubtasks = t.subtasks.filter(s => s.id !== subtaskId);
          const allDone = updatedSubtasks.length > 0 && updatedSubtasks.every(st => st.completed);
          return {
            ...t,
            subtasks: updatedSubtasks,
            completed: updatedSubtasks.length === 0 ? t.completed : allDone,
          };
        }
        return t;
      })
    );
  };

  // Select a sport / choice option for a choice task
  const handleSelectOption = (taskId: string, option: string) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          const isSame = t.selectedOption === option;
          return {
            ...t,
            selectedOption: isSame ? undefined : option,
            completed: !isSame, // auto-mark complete when option selected
          };
        }
        return t;
      })
    );
  };



  // Add a new task
  const handleAddTask = (block: TimeBlock) => {
    const titleToAdd = inlineTaskInput.text.trim() || 
      (inlineTaskInput.taskType === 'group' ? 'New Group' : inlineTaskInput.taskType === 'choice' ? 'Sports Choice' : 'New Task');

    let subtasksList: SubTask[] | undefined = undefined;
    if (inlineTaskInput.taskType === 'group') {
      subtasksList = inlineTaskInput.initialSubtasks
        .filter(st => st.trim().length > 0)
        .map(st => ({
          id: 'sub_' + Math.random().toString(36).substring(2, 9),
          title: st.trim(),
          completed: false,
        }));
    }

    const newTask: SchedulerTask = {
      id: 'task_' + Math.random().toString(36).substring(2, 9),
      date: selectedDate,
      timeBlock: block,
      title: titleToAdd,
      scheduledTime: inlineTaskInput.scheduledTime.trim() || undefined,
      completed: false,
      type: inlineTaskInput.taskType,
      options: inlineTaskInput.taskType === 'choice' ? [...inlineTaskInput.customChoices] : undefined,
      subtasks: subtasksList,
      createdAt: new Date().toISOString(),
    };

    setTasks(prev => [...prev, newTask]);
    if (inlineTaskInput.taskType !== 'standard') {
      setExpandedTaskIds(prev => ({ ...prev, [newTask.id]: true }));
    }
    setInlineTaskInput({ 
      block: null, 
      text: '', 
      scheduledTime: '', 
      taskType: 'standard', 
      initialSubtasks: [''], 
      customChoices: DEFAULT_SPORTS_OPTIONS,
      newChoiceInput: ''
    });
    showToast(`Added to ${block}`);
  };

  // Delete a task
  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  // Move task up or down within its timeBlock
  const handleMoveTask = (taskId: string, direction: 'up' | 'down') => {
    setTasks(prev => {
      const targetTask = prev.find(t => t.id === taskId);
      if (!targetTask) return prev;

      const sameBlockTasks = prev.filter(
        t => t.date === targetTask.date && t.timeBlock === targetTask.timeBlock
      );
      const blockIndex = sameBlockTasks.findIndex(t => t.id === taskId);

      if (direction === 'up' && blockIndex <= 0) return prev;
      if (direction === 'down' && blockIndex >= sameBlockTasks.length - 1) return prev;

      const swapWithTask = sameBlockTasks[direction === 'up' ? blockIndex - 1 : blockIndex + 1];

      const newTasks = [...prev];
      const idxA = newTasks.findIndex(t => t.id === targetTask.id);
      const idxB = newTasks.findIndex(t => t.id === swapWithTask.id);

      if (idxA !== -1 && idxB !== -1) {
        const temp = newTasks[idxA];
        newTasks[idxA] = newTasks[idxB];
        newTasks[idxB] = temp;
      }

      return newTasks;
    });
  };

  // Move subtask up or down within its group
  const handleMoveSubtask = (taskId: string, subtaskId: string, direction: 'up' | 'down') => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId && t.subtasks) {
          const subs = [...t.subtasks];
          const idx = subs.findIndex(s => s.id === subtaskId);
          if (idx === -1) return t;
          if (direction === 'up' && idx <= 0) return t;
          if (direction === 'down' && idx >= subs.length - 1) return t;

          const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
          const temp = subs[idx];
          subs[idx] = subs[targetIdx];
          subs[targetIdx] = temp;

          return { ...t, subtasks: subs };
        }
        return t;
      })
    );
  };

  // Replicate schedule to tomorrow
  const handleReplicateToTomorrow = () => {
    const cur = new Date(selectedDate + 'T00:00:00');
    cur.setDate(cur.getDate() + 1);
    const tomorrowStr = formatDateString(cur);

    const currentTasks = tasks.filter(t => t.date === selectedDate);
    if (currentTasks.length === 0) {
      showToast('No tasks to replicate for this date');
      return;
    }

    const newTomorrowTasks: SchedulerTask[] = currentTasks.map(t => ({
      ...t,
      id: 'task_' + Math.random().toString(36).substring(2, 9),
      date: tomorrowStr,
      completed: false,
      selectedOption: undefined,
      subtasks: t.subtasks ? t.subtasks.map(s => ({ ...s, completed: false })) : undefined,
      createdAt: new Date().toISOString(),
    }));

    setTasks(prev => {
      const otherDateTasks = prev.filter(t => t.date !== tomorrowStr);
      return [...otherDateTasks, ...newTomorrowTasks];
    });

    setSelectedDate(tomorrowStr);
    showToast(`Replicated ${currentTasks.length} task${currentTasks.length > 1 ? 's' : ''} to tomorrow (${tomorrowStr})!`);
  };

  const datesStrip = generateDateStrip(selectedDate);
  const timeBlocks: TimeBlock[] = ['Morning', 'Afternoon', 'Evening', 'Night'];

  // Overall stats for selected date
  const totalTasksCount = tasksForSelectedDate.length;
  const completedTasksCount = tasksForSelectedDate.filter(t => t.completed).length;
  const completionPercentage = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6 select-none pb-20 font-sans">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-black text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-2xl flex items-center gap-2 border border-neutral-700"
          >
            <Sparkles className="w-4 h-4 text-white animate-pulse" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Section (Pure Black & White) */}
      <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-black text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                MVP Scheduler
              </span>
              {selectedDate === dateToday && (
                <span className="bg-black text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                  Today
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black text-black tracking-tight mt-1">
              Daily Scheduler
            </h1>
            <p className="text-xs text-neutral-500 font-medium">
              Time-anchored daily schedule in sleek black & white.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {selectedDate !== dateToday && (
              <button
                type="button"
                onClick={() => setSelectedDate(dateToday)}
                className="flex items-center gap-1.5 px-3 py-2 bg-neutral-100 hover:bg-black hover:text-white text-black text-xs font-bold rounded-xl transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Today</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleReplicateToTomorrow}
              title="Copy current schedule to tomorrow"
              className="flex items-center gap-2 px-4 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-bold rounded-xl transition shadow-xs active:scale-95 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-neutral-300" />
              <span>Replicate to Tomorrow</span>
            </button>
          </div>
        </div>

        {/* Date Selector Strip */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-black" />
              Select Date
            </span>
            <span className="text-xs font-bold text-black">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {datesStrip.map((item) => (
              <button
                key={item.dateStr}
                type="button"
                onClick={() => setSelectedDate(item.dateStr)}
                className={`flex-shrink-0 flex flex-col items-center justify-center w-14 py-3 rounded-2xl border transition-all cursor-pointer ${
                  item.isSelected
                    ? 'bg-black text-white border-black shadow-md scale-105'
                    : item.isToday
                    ? 'bg-neutral-100 text-black border-neutral-300 font-bold'
                    : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50'
                }`}
              >
                <span className={`text-[9px] font-bold tracking-wider ${item.isSelected ? 'text-neutral-400' : 'text-neutral-400'}`}>
                  {item.dayName}
                </span>
                <span className={`text-base font-black mt-0.5 ${item.isSelected ? 'text-white' : 'text-black'}`}>
                  {item.dayNumber}
                </span>
                {item.isToday && !item.isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-black mt-1" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Progress Bar Summary */}
        <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-black">
            <CheckCircle2 className="w-4 h-4 text-black" />
            <span>{completedTasksCount} of {totalTasksCount} completed</span>
          </div>
          <div className="flex-1 max-w-xs bg-neutral-100 rounded-full h-2 overflow-hidden border border-neutral-200">
            <div
              className="bg-black h-full transition-all duration-500 rounded-full"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <span className="text-xs font-black text-black w-8 text-right">
            {completionPercentage}%
          </span>
        </div>
      </div>

      {/* 4 Time Block Sections */}
      <div className="space-y-4">
        {timeBlocks.map(block => {
          const meta = TIME_BLOCK_META[block];
          const BlockIcon = meta.icon;
          const blockTasks = tasksForSelectedDate.filter(t => t.timeBlock === block);
          const isExpanded = expandedBlocks[block];
          const blockCompletedCount = blockTasks.filter(t => t.completed).length;
          const timePresets = BLOCK_TIME_PRESETS[block];
          const isCurrentTimeBlock = selectedDate === dateToday && block === getCurrentTimeBlock();
          const isBlockAllDone = blockTasks.length > 0 && blockCompletedCount === blockTasks.length;

          return (
            <div
              key={block}
              className={`bg-white border rounded-3xl overflow-hidden transition-all ${
                isCurrentTimeBlock 
                  ? 'border-black ring-1 ring-black/10 shadow-sm' 
                  : isBlockAllDone
                  ? 'border-neutral-300 bg-neutral-50/40'
                  : 'border-neutral-200 hover:border-neutral-300 shadow-xs'
              }`}
            >
              {/* Section Header */}
              <div
                onClick={() => toggleExpandBlock(block)}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-neutral-50/80 transition select-none"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shadow-xs shrink-0 transition-colors ${
                    isCurrentTimeBlock 
                      ? 'bg-emerald-500 text-white shadow-emerald-500/30' 
                      : 'bg-black text-white'
                  }`}>
                    <BlockIcon className="w-4.5 h-4.5 stroke-[2px]" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className={`text-base font-black tracking-tight ${isBlockAllDone ? 'text-black' : 'text-black'}`}>
                        {meta.label}
                      </h2>
                      <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full border border-neutral-200">
                        {meta.timeRange}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 font-medium">
                      {meta.desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Item counter pill - BLACK & WHITE completed indicator when done */}
                  {isBlockAllDone ? (
                    <span className="text-xs font-black text-white bg-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-2xs">
                      <Check className="w-3.5 h-3.5 stroke-[3px]" />
                      <span>{blockCompletedCount}/{blockTasks.length}</span>
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-neutral-700 bg-neutral-100 border border-neutral-200 px-2.5 py-1 rounded-full">
                      {blockCompletedCount}/{blockTasks.length}
                    </span>
                  )}

                  {/* Add Task Plus Icon */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isExpanded) setExpandedBlocks(prev => ({ ...prev, [block]: true }));
                      setInlineTaskInput(prev => 
                        prev.block === block 
                          ? { block: null, text: '', scheduledTime: '', taskType: 'standard', initialSubtasks: [''], customChoices: DEFAULT_SPORTS_OPTIONS, newChoiceInput: '' } 
                          : { block, text: '', scheduledTime: '', taskType: 'standard', initialSubtasks: [''], customChoices: DEFAULT_SPORTS_OPTIONS, newChoiceInput: '' }
                      );
                    }}
                    title="Add task to this section"
                    className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center hover:scale-110 active:scale-95 transition shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[3px]" />
                  </button>

                  {/* Expand / Collapse Chevron */}
                  <button
                    type="button"
                    className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-black hover:bg-neutral-100 transition cursor-pointer"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Expandable Accordion Body */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="border-t border-neutral-100 bg-white"
                  >
                    <div className="p-4 space-y-2.5">
                      
                      {/* Inline Input Box if active for this block */}
                      {inlineTaskInput.block === block && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-neutral-50 border border-black rounded-2xl p-3.5 space-y-3 shadow-md"
                        >
                          {/* Task Type Switcher Buttons */}
                          <div className="flex items-center justify-between pb-2 border-b border-neutral-200 flex-wrap gap-2">
                            <span className="text-[11px] font-extrabold text-neutral-600 uppercase tracking-wider">Type:</span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setInlineTaskInput(prev => ({ ...prev, taskType: 'standard' }))}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                                  inlineTaskInput.taskType === 'standard'
                                    ? 'bg-black text-white'
                                    : 'bg-white text-neutral-600 border border-neutral-200'
                                }`}
                              >
                                Standard
                              </button>
                              
                              <button
                                type="button"
                                onClick={() => {
                                  setInlineTaskInput(prev => ({ 
                                    ...prev, 
                                    taskType: 'group',
                                    text: prev.text || 'Morning Rituals' 
                                  }));
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                                  inlineTaskInput.taskType === 'group'
                                    ? 'bg-black text-white'
                                    : 'bg-white text-neutral-700 border border-neutral-200 hover:border-black'
                                }`}
                              >
                                <ListTree className="w-3.5 h-3.5 text-neutral-400" />
                                Group (Sub-tasks)
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setInlineTaskInput(prev => ({ 
                                    ...prev, 
                                    taskType: 'choice',
                                    text: prev.text || 'Play Sports' 
                                  }));
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                                  inlineTaskInput.taskType === 'choice'
                                    ? 'bg-black text-white'
                                    : 'bg-white text-neutral-700 border border-neutral-200 hover:border-black'
                                }`}
                              >
                                <Dumbbell className="w-3.5 h-3.5 text-neutral-400" />
                                Sports / Choice
                              </button>
                            </div>
                          </div>

                          {/* Quick Time Preset Buttons */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                              <Clock className="w-3 h-3 text-black" /> Time:
                            </span>
                            <button
                              type="button"
                              onClick={() => setInlineTaskInput(prev => ({ ...prev, scheduledTime: '' }))}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded border transition cursor-pointer ${
                                !inlineTaskInput.scheduledTime.trim()
                                  ? 'bg-black text-white border-black'
                                  : 'bg-white text-neutral-700 border-neutral-200 hover:border-black'
                              }`}
                            >
                              No Time
                            </button>
                            {timePresets.map(preset => {
                              const isSelected = inlineTaskInput.scheduledTime === preset;
                              return (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => setInlineTaskInput(prev => ({ ...prev, scheduledTime: isSelected ? '' : preset }))}
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded border transition cursor-pointer ${
                                    isSelected
                                      ? 'bg-black text-white border-black'
                                      : 'bg-white text-neutral-700 border-neutral-200 hover:border-black'
                                  }`}
                                >
                                  {preset}
                                </button>
                              );
                            })}
                          </div>

                          {/* Task Name & Custom Time Input */}
                          <div className="flex flex-col sm:flex-row items-center gap-2">
                            <input
                              type="text"
                              autoFocus
                              placeholder={
                                inlineTaskInput.taskType === 'group' 
                                  ? "Group Name..." 
                                  : inlineTaskInput.taskType === 'choice'
                                  ? "Choice Title (e.g. Play Sports)..."
                                  : "Task title..."
                              }
                              value={inlineTaskInput.text}
                              onChange={(e) => setInlineTaskInput(prev => ({ ...prev, text: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleAddTask(block);
                                }
                              }}
                              className="flex-1 bg-white border border-neutral-300 rounded-xl px-3 py-1.5 text-xs font-bold text-black placeholder:text-neutral-400 focus:outline-none focus:border-black w-full"
                            />

                            {/* Scheduled Time Input */}
                            <div className="flex items-center gap-1 bg-white border border-neutral-300 rounded-xl px-2.5 py-1.5 shrink-0 w-full sm:w-auto">
                              <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                              <input
                                type="text"
                                placeholder="Time (Optional)"
                                value={inlineTaskInput.scheduledTime}
                                onChange={(e) => setInlineTaskInput(prev => ({ ...prev, scheduledTime: e.target.value }))}
                                className="w-28 bg-transparent text-xs font-bold text-black placeholder:text-neutral-400 focus:outline-none"
                              />
                              {inlineTaskInput.scheduledTime && (
                                <button
                                  type="button"
                                  onClick={() => setInlineTaskInput(prev => ({ ...prev, scheduledTime: '' }))}
                                  className="text-neutral-400 hover:text-black p-0.5 cursor-pointer"
                                  title="Clear time"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleAddTask(block)}
                              className="bg-black hover:bg-neutral-800 text-white text-xs font-bold px-4 py-1.5 rounded-xl transition shadow-xs cursor-pointer shrink-0 w-full sm:w-auto"
                            >
                              Add
                            </button>
                          </div>

                          {/* Options Config for Choice Mode */}
                          {inlineTaskInput.taskType === 'choice' && (
                            <div className="space-y-2 pt-2 border-t border-neutral-200">
                              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                                Choice Options:
                              </span>
                              <div className="flex flex-wrap items-center gap-1.5">
                                {inlineTaskInput.customChoices.map((opt) => (
                                  <span key={opt} className="bg-neutral-100 border border-neutral-300 text-black text-xs font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
                                    <span>{SPORTS_ICONS_MAP[opt] || '🏆'} {opt}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setInlineTaskInput(prev => ({
                                          ...prev,
                                          customChoices: prev.customChoices.filter(o => o !== opt)
                                        }));
                                      }}
                                      className="text-neutral-400 hover:text-red-500 cursor-pointer p-0.5"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </span>
                                ))}
                              </div>

                              <div className="flex items-center gap-2 mt-1">
                                <input
                                  type="text"
                                  placeholder="Add custom sport/choice option..."
                                  value={inlineTaskInput.newChoiceInput}
                                  onChange={(e) => setInlineTaskInput(prev => ({ ...prev, newChoiceInput: e.target.value }))}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && inlineTaskInput.newChoiceInput.trim()) {
                                      e.preventDefault();
                                      const val = inlineTaskInput.newChoiceInput.trim();
                                      if (!inlineTaskInput.customChoices.includes(val)) {
                                        setInlineTaskInput(prev => ({
                                          ...prev,
                                          customChoices: [...prev.customChoices, val],
                                          newChoiceInput: ''
                                        }));
                                      }
                                    }
                                  }}
                                  className="flex-1 bg-white border border-neutral-300 rounded-lg px-2.5 py-1 text-xs text-black focus:outline-none focus:border-black font-semibold"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const val = inlineTaskInput.newChoiceInput.trim();
                                    if (val && !inlineTaskInput.customChoices.includes(val)) {
                                      setInlineTaskInput(prev => ({
                                        ...prev,
                                        customChoices: [...prev.customChoices, val],
                                        newChoiceInput: ''
                                      }));
                                    }
                                  }}
                                  className="bg-black text-white text-xs font-bold px-3 py-1 rounded-lg cursor-pointer hover:bg-neutral-800"
                                >
                                  + Option
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Initial Sub-tasks for Group */}
                          {inlineTaskInput.taskType === 'group' && (
                            <div className="space-y-2 pt-2 border-t border-neutral-200">
                              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                                Sub-tasks:
                              </span>
                              <div className="flex flex-wrap items-center gap-1.5">
                                {inlineTaskInput.initialSubtasks.map((stText, idx) => (
                                  <div key={idx} className="flex items-center gap-1 bg-white border border-neutral-200 rounded-lg px-2 py-0.5">
                                    <input
                                      type="text"
                                      placeholder={`Sub-task ${idx + 1}...`}
                                      value={stText}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setInlineTaskInput(prev => {
                                          const updated = [...prev.initialSubtasks];
                                          updated[idx] = val;
                                          return { ...prev, initialSubtasks: updated };
                                        });
                                      }}
                                      className="w-28 bg-transparent text-xs text-black placeholder:text-neutral-400 focus:outline-none font-bold"
                                    />
                                    {inlineTaskInput.initialSubtasks.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setInlineTaskInput(prev => ({
                                            ...prev,
                                            initialSubtasks: prev.initialSubtasks.filter((_, i) => i !== idx),
                                          }));
                                        }}
                                        className="text-neutral-400 hover:text-red-500 p-0.5 cursor-pointer"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                ))}

                                <button
                                  type="button"
                                  onClick={() => {
                                    setInlineTaskInput(prev => ({
                                      ...prev,
                                      initialSubtasks: [...prev.initialSubtasks, ''],
                                    }));
                                  }}
                                  className="text-xs font-bold text-black bg-neutral-100 border border-neutral-300 hover:bg-neutral-200 px-2 py-0.5 rounded-lg transition cursor-pointer"
                                >
                                  + Sub-task
                                </button>
                              </div>
                            </div>
                          )}

                        </motion.div>
                      )}

                      {/* Task List */}
                      {blockTasks.length === 0 ? (
                        <div className="text-center py-5 border border-dashed border-neutral-200 rounded-2xl bg-neutral-50/50">
                          <p className="text-xs font-medium text-neutral-400">
                            No tasks scheduled for {meta.label.toLowerCase()}.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setInlineTaskInput({ block, text: '', scheduledTime: '', taskType: 'standard', initialSubtasks: [''], customChoices: DEFAULT_SPORTS_OPTIONS, newChoiceInput: '' });
                            }}
                            className="mt-1.5 text-xs font-bold text-black underline underline-offset-4 hover:opacity-75 cursor-pointer"
                          >
                            + Add a task
                          </button>
                        </div>
                      ) : (
                        blockTasks.map((task) => {
                          const isExpandable = task.type === 'group' || task.type === 'choice';
                          const isTaskExpanded = expandedTaskIds[task.id];
                          const subtasks = task.subtasks || [];
                          const completedSubsCount = subtasks.filter(s => s.completed).length;

                          return (
                            <div
                              key={task.id}
                              className={`group relative rounded-xl border transition-all duration-150 overflow-hidden ${
                                task.completed
                                  ? 'bg-neutral-50/80 border-neutral-200'
                                  : 'bg-white border-neutral-200 hover:border-black/30 shadow-xs'
                              }`}
                            >
                              {/* SINGLE-LINE TASK ROW (MONOCHROME BLACK & WHITE) */}
                              <div
                                onClick={() => {
                                  if (isExpandable) toggleExpandTask(task.id);
                                }}
                                className={`px-3 py-2.5 flex items-center justify-between gap-2.5 select-none ${
                                  isExpandable ? 'cursor-pointer hover:bg-neutral-50/60' : ''
                                }`}
                              >
                                {/* Left Section: Chevron + Time + Title (with subtle icon prefix & progress text) */}
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  {isExpandable && (
                                    <span className="w-5 h-5 rounded bg-neutral-100 text-black flex items-center justify-center shrink-0">
                                      {isTaskExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                    </span>
                                  )}

                                  {/* Scheduled Time Pill */}
                                  {task.scheduledTime && (
                                    <span className="bg-black text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0 shadow-2xs">
                                      <Clock className="w-3 h-3 text-amber-400" />
                                      {task.scheduledTime}
                                    </span>
                                  )}

                                  {/* TITLE WITH MINIMALIST ICON PREFIX & PROGRESS COUNTER */}
                                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                    {/* Subtle Icon Prefix */}
                                    {task.type === 'group' && (
                                      <span className="text-black font-black text-xs shrink-0 flex items-center gap-1">
                                        📁
                                      </span>
                                    )}

                                    {task.type === 'choice' && (
                                      <span className="text-black font-black text-xs shrink-0 flex items-center gap-1">
                                        {task.selectedOption ? (SPORTS_ICONS_MAP[task.selectedOption] || '🏸') : '🏆'}
                                      </span>
                                    )}

                                    {/* Group / Task Title */}
                                    <span
                                      title={task.title}
                                      className={`text-xs sm:text-sm font-bold tracking-tight min-w-0 truncate ${
                                        task.completed ? 'line-through text-neutral-400 opacity-60' : 'text-neutral-900'
                                      }`}
                                    >
                                      {task.title}
                                    </span>

                                    {/* Subtle Group Counter */}
                                    {task.type === 'group' && (
                                      <span className="text-[10px] font-extrabold text-black bg-neutral-100 border border-neutral-300 px-1.5 py-0.5 rounded shrink-0">
                                        ({completedSubsCount}/{subtasks.length})
                                      </span>
                                    )}

                                    {/* Subtle Active Choice Tag */}
                                    {task.type === 'choice' && task.selectedOption && (
                                      <span className="text-[10px] font-extrabold text-black bg-neutral-100 border border-neutral-300 px-1.5 py-0.5 rounded shrink-0">
                                        • {task.selectedOption}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Right Section: Choice Quick Chip + Hover Move + Delete + Checkbox */}
                                <div className="flex items-center gap-1.5 shrink-0 ml-auto" onClick={(e) => e.stopPropagation()}>
                                  {/* If Choice Task and no choice selected yet, show quick chip */}
                                  {task.type === 'choice' && !task.selectedOption && (
                                    <button
                                      type="button"
                                      onClick={() => toggleExpandTask(task.id)}
                                      className="text-[10px] font-extrabold text-black bg-neutral-100 hover:bg-black hover:text-white border border-neutral-300 px-2 py-0.5 rounded-md transition cursor-pointer shrink-0"
                                    >
                                      Select Sport ▾
                                    </button>
                                  )}

                                  {/* Move Up / Down Buttons (Smooth hover fade-in) */}
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-0.5">
                                    <button
                                      type="button"
                                      onClick={() => handleMoveTask(task.id, 'up')}
                                      className="text-neutral-400 hover:text-black p-0.5 cursor-pointer"
                                      title="Move Up"
                                    >
                                      <ChevronUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleMoveTask(task.id, 'down')}
                                      className="text-neutral-400 hover:text-black p-0.5 cursor-pointer"
                                      title="Move Down"
                                    >
                                      <ChevronDown className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  {/* Clean Delete Option to the LEFT of Checkbox */}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTask(task.id)}
                                    className="text-neutral-300 hover:text-red-500 p-0.5 hover:bg-neutral-100 rounded transition cursor-pointer"
                                    title="Delete task"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Checkbox */}
                                  <div
                                    onClick={() => handleToggleTask(task.id)}
                                    className={`w-5.5 h-5.5 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all duration-200 ${
                                      task.completed
                                        ? 'bg-black border-black text-white scale-105 shadow-2xs'
                                        : 'border-neutral-300 bg-white hover:border-black'
                                    }`}
                                    title={task.completed ? "Mark incomplete" : "Mark complete"}
                                  >
                                    {task.completed && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                                  </div>
                                </div>
                              </div>

                              {/* Micro Progress Line at Card Bottom Edge for Groups (Black Accent) */}
                              {task.type === 'group' && subtasks.length > 0 && (
                                <div className="w-full bg-neutral-100 h-0.5 overflow-hidden">
                                  <div
                                    className="bg-black h-full transition-all duration-300"
                                    style={{ width: `${Math.round((completedSubsCount / subtasks.length) * 100)}%` }}
                                  />
                                </div>
                              )}

                              {/* EXPANDABLE BODY (SUBTASKS & CHOICE SELECTOR) */}
                              <AnimatePresence>
                                {isExpandable && isTaskExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.15, ease: 'easeInOut' }}
                                    className="border-t border-neutral-100 bg-neutral-50/70 p-3 space-y-2.5"
                                  >
                                    {/* Group Sub-tasks Section */}
                                    {task.type === 'group' && (
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                          <span className="text-[10px] font-extrabold text-neutral-500 uppercase tracking-wider block">
                                            Sub-tasks ({completedSubsCount}/{subtasks.length} done):
                                          </span>
                                        </div>

                                        <div className="space-y-1.5">
                                          {subtasks.map((st) => (
                                            <div
                                              key={st.id}
                                              onClick={() => handleToggleSubtask(task.id, st.id)}
                                              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white border border-neutral-200 hover:border-black/40 transition cursor-pointer"
                                            >
                                              <span
                                                className={`text-xs font-bold ${
                                                  st.completed
                                                    ? 'line-through text-neutral-400 opacity-60'
                                                    : 'text-black'
                                                }`}
                                              >
                                                {st.title}
                                              </span>

                                              <div className="flex items-center gap-1.5 shrink-0">
                                                <div className="opacity-0 group-hover/sub:opacity-100 flex items-center gap-0.5">
                                                  <button
                                                    type="button"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleMoveSubtask(task.id, st.id, 'up');
                                                    }}
                                                    className="text-neutral-300 hover:text-black p-0.5 cursor-pointer"
                                                    title="Move Up"
                                                  >
                                                    <ChevronUp className="w-3 h-3" />
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleMoveSubtask(task.id, st.id, 'down');
                                                    }}
                                                    className="text-neutral-300 hover:text-black p-0.5 cursor-pointer"
                                                    title="Move Down"
                                                  >
                                                    <ChevronDown className="w-3 h-3" />
                                                  </button>
                                                </div>

                                                {/* Subtask Delete option to the LEFT of Checkbox */}
                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteSubtask(task.id, st.id);
                                                  }}
                                                  className="text-neutral-300 hover:text-red-500 p-0.5 hover:bg-neutral-100 rounded transition cursor-pointer"
                                                  title="Delete subtask"
                                                >
                                                  <Trash2 className="w-3 h-3" />
                                                </button>

                                                {/* Sub-task CHECKBOX */}
                                                <div
                                                  className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                                                    st.completed
                                                      ? 'bg-black border-black text-white'
                                                      : 'border-neutral-300 bg-white'
                                                  }`}
                                                >
                                                  {st.completed && <Check className="w-3 h-3 stroke-[3px]" />}
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>

                                        {/* Add new sub-task inside group */}
                                        {newSubtaskInput.taskId === task.id ? (
                                          <div className="flex items-center gap-2 pt-1">
                                            <input
                                              type="text"
                                              autoFocus
                                              placeholder="New sub-task..."
                                              value={newSubtaskInput.text}
                                              onChange={(e) => setNewSubtaskInput({ taskId: task.id, text: e.target.value })}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleAddSubtaskToGroup(task.id);
                                                if (e.key === 'Escape') setNewSubtaskInput({ taskId: null, text: '' });
                                              }}
                                              className="flex-1 bg-white border border-neutral-300 rounded-lg px-2.5 py-1 text-xs font-bold text-black focus:outline-none focus:border-black"
                                            />
                                            <button
                                              type="button"
                                              onClick={() => handleAddSubtaskToGroup(task.id)}
                                              className="bg-black text-white text-xs font-bold px-3 py-1 rounded-lg cursor-pointer"
                                            >
                                              Add
                                            </button>
                                          </div>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => setNewSubtaskInput({ taskId: task.id, text: '' })}
                                            className="text-[11px] font-bold text-black hover:opacity-75 underline underline-offset-4 cursor-pointer block pt-0.5"
                                          >
                                            + Add sub-task to group
                                          </button>
                                        )}
                                      </div>
                                    )}

                                    {/* Choice Sports Chips Selector */}
                                    {task.type === 'choice' && (
                                      <div className="space-y-2">
                                        <span className="text-[10px] font-extrabold text-neutral-500 uppercase tracking-wider block">
                                          Select Sports / Choice Option:
                                        </span>

                                        {/* Sports & Custom Option Chips */}
                                        <div className="flex flex-wrap items-center gap-1.5">
                                          {(task.options || DEFAULT_SPORTS_OPTIONS).map((opt) => {
                                            const isSelected = task.selectedOption === opt;
                                            const emoji = SPORTS_ICONS_MAP[opt] || '🏆';
                                            return (
                                              <button
                                                key={opt}
                                                type="button"
                                                onClick={() => handleSelectOption(task.id, opt)}
                                                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                                                  isSelected
                                                    ? 'bg-black text-white border-black shadow-2xs'
                                                    : 'bg-white text-neutral-700 border-neutral-200 hover:border-black hover:bg-neutral-50'
                                                }`}
                                              >
                                                <span>{emoji}</span>
                                                <span>{opt}</span>
                                                {isSelected && <Check className="w-3 h-3 stroke-[3px] ml-0.5 text-white" />}
                                              </button>
                                            );
                                          })}
                                        </div>

                                        {/* Inline add custom choice option to existing task */}
                                        {newChoiceTaskOptionInput.taskId === task.id ? (
                                          <div className="flex items-center gap-2 pt-1 border-t border-neutral-200">
                                            <input
                                              type="text"
                                              autoFocus
                                              placeholder="New sport / choice name..."
                                              value={newChoiceTaskOptionInput.text}
                                              onChange={(e) => setNewChoiceTaskOptionInput({ taskId: task.id, text: e.target.value })}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleAddOptionToChoiceTask(task.id);
                                                if (e.key === 'Escape') setNewChoiceTaskOptionInput({ taskId: null, text: '' });
                                              }}
                                              className="flex-1 bg-white border border-neutral-300 rounded-lg px-2.5 py-1 text-xs font-bold text-black focus:outline-none focus:border-black"
                                            />
                                            <button
                                              type="button"
                                              onClick={() => handleAddOptionToChoiceTask(task.id)}
                                              className="bg-black hover:bg-neutral-800 text-white text-xs font-bold px-3 py-1 rounded-lg cursor-pointer"
                                            >
                                              Add
                                            </button>
                                          </div>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => setNewChoiceTaskOptionInput({ taskId: task.id, text: '' })}
                                            className="text-[11px] font-bold text-black hover:opacity-75 underline underline-offset-4 cursor-pointer block pt-0.5"
                                          >
                                            + Add custom sport / choice option
                                          </button>
                                        )}
                                      </div>
                                    )}

                                  </motion.div>
                                )}
                              </AnimatePresence>

                            </div>
                          );
                        })
                      )}

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

    </div>
  );
}
