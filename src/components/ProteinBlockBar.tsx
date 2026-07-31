import React from 'react';
import { Check, Pencil, Plus, X } from 'lucide-react';
import type { TimeBlock } from '../lib/nutritionBlocks';
import { BLOCK_META, getProteinProgress } from '../lib/nutritionBlocks';

interface ProteinBlockBarProps {
  block: TimeBlock;
  consumed: number;
  goal: number;
  canEdit?: boolean;
  isEditing?: boolean;
  editValue?: string;
  onStartEdit?: (e?: React.MouseEvent) => void;
  onEditChange?: (value: string) => void;
  onSaveEdit?: (e?: React.FormEvent) => void;
  onCancelEdit?: () => void;
  onLog?: (e?: React.MouseEvent) => void;
  variant?: 'inline' | 'card';
}

export default function ProteinBlockBar({
  block,
  consumed,
  goal,
  canEdit = true,
  isEditing = false,
  editValue = '',
  onStartEdit,
  onEditChange,
  onSaveEdit,
  onCancelEdit,
  onLog,
  variant = 'inline',
}: ProteinBlockBarProps) {
  const meta = BLOCK_META[block];
  const pct = getProteinProgress(consumed, goal);
  const met = consumed >= goal && goal > 0;

  const shell =
    variant === 'card'
      ? 'rounded-xl border border-neutral-200 bg-neutral-50/80 px-3 py-2.5'
      : 'rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5';

  return (
    <div
      className={`${shell} flex items-center gap-2 min-w-0`}
      onClick={(e) => e.stopPropagation()}
    >
      <span className="text-sm shrink-0" aria-hidden="true">{meta.icon}</span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-[10px] font-bold text-neutral-500 truncate">
            {consumed}g / {goal}g
          </span>
          {met && (
            <span className="text-[9px] font-black text-emerald-600 shrink-0">✓</span>
          )}
        </div>
        <div className="h-1 rounded-full bg-neutral-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${met ? 'bg-emerald-500' : 'bg-black'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {isEditing ? (
        <form onSubmit={onSaveEdit} className="flex items-center gap-1 shrink-0">
          <input
            type="number"
            min="0"
            value={editValue}
            onChange={(e) => onEditChange?.(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && onCancelEdit?.()}
            className="w-12 h-7 rounded-md border border-black px-1.5 text-xs font-bold text-center focus:outline-none"
            autoFocus
          />
          <button type="submit" className="w-7 h-7 rounded-md bg-black text-white flex items-center justify-center cursor-pointer">
            <Check className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={onCancelEdit} className="w-7 h-7 rounded-md border border-neutral-300 text-neutral-400 flex items-center justify-center cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </form>
      ) : (
        <div className="flex items-center gap-1 shrink-0">
          {canEdit && onStartEdit && (
            <button
              type="button"
              onClick={onStartEdit}
              className="w-7 h-7 rounded-md border border-neutral-200 text-neutral-500 hover:border-black hover:text-black flex items-center justify-center cursor-pointer transition"
              title={`Edit ${meta.label} protein goal`}
            >
              <Pencil className="w-3 h-3" />
            </button>
          )}
          {onLog && (
            <button
              type="button"
              onClick={onLog}
              className="w-7 h-7 rounded-md bg-black text-white flex items-center justify-center hover:bg-neutral-800 cursor-pointer active:scale-95 transition"
              title={`Log protein to ${meta.label}`}
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
