import React from 'react';
import { NavigationFooter } from './NavigationFooter';
import type { Verse } from './types';

interface BibleReaderProps {
  verses: Verse[];
  selectedVerse: number | null;
  onSelectVerse: (verse: number) => void;
  isLoading: boolean;
  book: string;
  chapter: number;
  onPrevChapter: () => void;
  onNextChapter: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  onCompleteReading: () => void;
  completedToday: boolean;
  isCompleting: boolean;
  onOpenAdmin: () => void;
  isCuratorMode: boolean;
  fontSize?: 'normal' | 'large' | 'extra';
}

export const BibleReader: React.FC<BibleReaderProps> = ({
  verses,
  selectedVerse,
  onSelectVerse,
  isLoading,
  book,
  chapter,
  onPrevChapter,
  onNextChapter,
  hasPrev,
  hasNext,
  onCompleteReading,
  completedToday,
  isCompleting,
  onOpenAdmin,
  isCuratorMode,
  fontSize = 'normal',
}) => {
  const textSizeClass =
    fontSize === 'large'
      ? 'text-xl sm:text-2xl leading-relaxed'
      : fontSize === 'extra'
      ? 'text-2xl sm:text-3xl leading-loose'
      : 'text-lg sm:text-xl leading-relaxed';

  return (
    <div className="max-w-2xl mx-auto py-6 sm:py-10 px-4 sm:px-8">
      {/* Título do Capítulo */}
      <div className="text-center mb-8 pb-6 border-b border-slate-200/80">
        <span className="text-xs font-semibold tracking-widest text-blue-600 uppercase block mb-1">
          Leitura Bíblica Expositiva
        </span>
        <h1 className="font-serif-bible text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
          {book} {chapter}
        </h1>
        <p className="text-xs text-slate-500 mt-2">
          Toque em qualquer versículo para revelar o comentário exegético
        </p>
      </div>

      {/* Estado de Carregamento com Skeletons */}
      {isLoading ? (
        <div className="space-y-4 py-4 animate-pulse">
          <div className="h-5 bg-stone-200/70 rounded-md w-full" />
          <div className="h-5 bg-stone-200/60 rounded-md w-11/12" />
          <div className="h-5 bg-stone-200/70 rounded-md w-4/5" />
          <div className="h-5 bg-stone-200/50 rounded-md w-full" />
          <div className="h-5 bg-stone-200/70 rounded-md w-10/12" />
        </div>
      ) : verses.length === 0 ? (
        <div className="text-center py-12 px-6 rounded-2xl bg-amber-50/50 border border-amber-200/60 text-stone-600">
          <p className="font-serif-bible text-lg font-medium text-stone-800 mb-1">
            Nenhum versículo encontrado
          </p>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Não foram localizados versículos para {book} {chapter}.
          </p>
        </div>
      ) : (
        /* Lista de Versículos */
        <div className={`space-y-3 font-serif-bible text-slate-800 ${textSizeClass}`}>
          {verses.map((v) => {
            const isSelected = selectedVerse === v.verse;
            const hasCommentary = v.has_commentary === 1;

            return (
              <div
                key={v.id}
                onClick={() => onSelectVerse(v.verse)}
                className={`group flex items-start gap-3.5 p-3 rounded-2xl cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'bg-blue-50/90 border border-blue-200 shadow-xs ring-1 ring-blue-400/30'
                    : 'hover:bg-slate-100/70 border border-transparent'
                }`}
              >
                {/* Botão de Número com Ponto Indicador de Comentário */}
                <div className="relative flex-shrink-0 mt-1.5">
                  <button
                    type="button"
                    className={`text-xs font-sans font-bold px-2 py-0.5 rounded-lg transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50'
                    }`}
                    aria-label={`Versículo ${v.verse}`}
                  >
                    {v.verse}
                  </button>

                  {/* Ponto sutil indicando se tem comentário pronto */}
                  {hasCommentary && (
                    <span
                      className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-600 border border-white shadow-2xs"
                      title="Possui comentário exegético indexado"
                    />
                  )}
                </div>

                <span
                  className={`flex-1 transition-colors ${
                    isSelected ? 'text-slate-950 font-medium' : 'text-slate-800'
                  }`}
                >
                  {v.text}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Rodapé de Navegação e Hábito */}
      <NavigationFooter
        onPrevChapter={onPrevChapter}
        onNextChapter={onNextChapter}
        hasPrev={hasPrev}
        hasNext={hasNext}
        onCompleteReading={onCompleteReading}
        completedToday={completedToday}
        isCompleting={isCompleting}
        book={book}
        chapter={chapter}
      />

      {/* Link Discreto de Curadoria no Rodapé */}
      <div className="mt-8 text-center">
        <button
          onClick={onOpenAdmin}
          className="text-[11px] text-stone-400 hover:text-stone-700 transition-colors uppercase tracking-widest font-medium"
        >
          {isCuratorMode ? '🛠️ Curadoria (Ativa)' : '🛠️ Modo Curadoria'}
        </button>
      </div>
    </div>
  );
};
