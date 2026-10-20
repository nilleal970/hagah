import React from 'react';
import { Flame } from 'lucide-react';

interface StreakBadgeProps {
  streak: number;
  completedToday: boolean;
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({ streak, completedToday }) => {
  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide border transition-all ${
        completedToday
          ? 'bg-amber-500/10 text-amber-900 border-amber-500/30 shadow-xs'
          : streak > 0
          ? 'bg-stone-100 text-stone-700 border-stone-200'
          : 'bg-stone-100/60 text-stone-400 border-stone-200/60'
      }`}
      title={
        completedToday
          ? `Ofensiva de ${streak} dia(s)! Leitura de hoje concluída.`
          : streak > 0
          ? `Ofensiva de ${streak} dia(s). Conclua um capítulo hoje para manter!`
          : 'Inicie sua ofensiva concluindo a leitura de um capítulo hoje.'
      }
    >
      <Flame
        className={`w-3.5 h-3.5 transition-transform ${
          completedToday
            ? 'text-amber-600 fill-amber-500 animate-pulse'
            : streak > 0
            ? 'text-amber-600'
            : 'text-stone-400'
        }`}
      />
      <span>
        {streak} {streak === 1 ? 'dia' : 'dias'}
      </span>
    </div>
  );
};
