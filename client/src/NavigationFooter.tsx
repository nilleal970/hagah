import React from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';

interface NavigationFooterProps {
  onPrevChapter: () => void;
  onNextChapter: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  onCompleteReading: () => void;
  completedToday: boolean;
  isCompleting: boolean;
  book: string;
  chapter: number;
}

export const NavigationFooter: React.FC<NavigationFooterProps> = ({
  onPrevChapter,
  onNextChapter,
  hasPrev,
  hasNext,
  onCompleteReading,
  completedToday,
  isCompleting,
  book,
  chapter,
}) => {
  return (
    <footer className="mt-12 pt-6 pb-12 border-t border-stone-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* Botões de Navegação entre Capítulos */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
        <button
          onClick={onPrevChapter}
          disabled={!hasPrev}
          className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Anterior</span>
        </button>

        <span className="text-xs font-serif-bible font-bold text-stone-800 px-2 sm:hidden">
          {book} {chapter}
        </span>

        <button
          onClick={onNextChapter}
          disabled={!hasNext}
          className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <span>Próximo</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Botão de Concluir Leitura / Ofensiva */}
      <button
        onClick={onCompleteReading}
        disabled={completedToday || isCompleting}
        className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide border transition-all ${
          completedToday
            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 cursor-default'
            : 'bg-amber-800 hover:bg-amber-900 text-white border-amber-900 shadow-xs hover:shadow-sm active:scale-98'
        }`}
      >
        <CheckCircle2
          className={`w-4 h-4 ${completedToday ? 'text-emerald-600' : 'text-amber-200'}`}
        />
        <span>
          {completedToday
            ? '✓ Leitura de Hoje Concluída!'
            : isCompleting
            ? 'Registrando...'
            : 'Concluir Leitura de Hoje'}
        </span>
      </button>
    </footer>
  );
};
