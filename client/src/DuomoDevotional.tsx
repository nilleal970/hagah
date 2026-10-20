import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Sparkles,
  BookOpen,
  Send,
  PartyPopper,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import type { DailyDevotional, DevotionalStep } from './types';

interface DuomoDevotionalProps {
  devotional: DailyDevotional | null;
  isLoading: boolean;
  onSaveNote: (book: string, chapter: number, verse: number | null, text: string) => Promise<void>;
  onCompleteDay: (book: string, chapter: number) => Promise<void>;
  completedToday: boolean;
  streak: number;
  onNavigateToReader: (book: string, chapter: number, verse?: number) => void;
}

export const DuomoDevotional: React.FC<DuomoDevotionalProps> = ({
  devotional,
  isLoading,
  onSaveNote,
  onCompleteDay,
  completedToday,
  streak,
  onNavigateToReader,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [reflectionText, setReflectionText] = useState<string>('');
  const [isSavedNote, setIsSavedNote] = useState<boolean>(false);
  const [isCompleting, setIsCompleting] = useState<boolean>(false);
  const [isCompletedCelebration, setIsCompletedCelebration] = useState<boolean>(false);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-stone-400 space-y-3">
        <div className="w-8 h-8 border-2 border-amber-600/30 border-t-amber-700 rounded-full animate-spin" />
        <p className="text-sm font-medium text-stone-500">Preparando o devocional de hoje...</p>
      </div>
    );
  }

  if (!devotional || !devotional.steps || devotional.steps.length === 0) {
    return (
      <div className="text-center p-12 text-stone-500 font-serif-bible text-lg">
        Nenhum devocional disponível para hoje.
      </div>
    );
  }

  const steps = devotional.steps;
  const currentStep = steps[currentStepIndex];
  const progressPercent = ((currentStepIndex + 1) / steps.length) * 100;
  const isLastStep = currentStepIndex === steps.length - 1;

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleSaveReflection = async () => {
    if (!reflectionText.trim()) return;
    await onSaveNote(
      devotional.book,
      devotional.chapter,
      devotional.verse,
      `[Devocional Diário] ${reflectionText.trim()}`
    );
    setIsSavedNote(true);
  };

  const handleFinalizeDevotional = async () => {
    setIsCompleting(true);
    try {
      await onCompleteDay(devotional.book, devotional.chapter);
      setIsCompletedCelebration(true);
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10 flex flex-col min-h-[calc(100vh-140px)] justify-between">
      {/* Topo: Barra de Progresso em Segmentos (Estilo Duomo / Stories) */}
      <div>
        <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
          <span className="font-semibold text-amber-800 uppercase tracking-widest text-[10px]">
            {devotional.date}
          </span>
          <span className="font-mono text-[11px] font-bold text-stone-400">
            {currentStepIndex + 1} de {steps.length}
          </span>
        </div>

        <div className="flex gap-1.5 mb-6">
          {steps.map((s: DevotionalStep, idx: number) => (
            <div
              key={s.id}
              className="h-1.5 flex-1 rounded-full overflow-hidden bg-stone-200/80 transition-all duration-300"
            >
              <div
                className={`h-full transition-all duration-300 ${
                  idx < currentStepIndex
                    ? 'bg-amber-700 w-full'
                    : idx === currentStepIndex
                    ? 'bg-amber-600 w-full animate-pulse'
                    : 'w-0'
                }`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Card Central Interativo */}
      <div className="flex-1 flex flex-col justify-center my-4">
        <div className="bg-white/90 border border-stone-200/90 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden backdrop-blur-xs flex flex-col justify-between min-h-[380px]">
          {/* Header do Card */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-amber-50 text-amber-900 border border-amber-200/80">
                <Sparkles className="w-3 h-3 text-amber-600" />
                {currentStep.badge}
              </span>

              <button
                onClick={() =>
                  onNavigateToReader(devotional.book, devotional.chapter, devotional.verse)
                }
                className="text-[11px] font-semibold text-stone-400 hover:text-amber-800 flex items-center gap-1 transition-colors"
                title="Abrir no leitor expositivo"
              >
                <span>{devotional.book} {devotional.chapter}:{devotional.verse}</span>
                <BookOpen className="w-3.5 h-3.5" />
              </button>
            </div>

            <h3 className="font-serif-bible font-bold text-xl sm:text-2xl text-stone-900 mb-3 tracking-tight">
              {currentStep.reference}
            </h3>

            {/* Conteúdo Principal do Passo */}
            <div className="font-serif-bible text-base sm:text-lg text-stone-800 leading-relaxed italic border-l-3 border-amber-600/70 pl-4 py-1 my-4 bg-amber-50/30 rounded-r-xl">
              "{currentStep.content}"
            </div>

            {currentStep.prompt && (
              <p className="text-xs text-stone-500 font-sans mt-2">
                💡 {currentStep.prompt}
              </p>
            )}

            {/* Passo Específico com Input de Reflexão */}
            {currentStep.question && (
              <div className="mt-4 pt-3 border-t border-stone-100">
                <p className="text-xs font-semibold text-stone-700 mb-2 font-sans">
                  {currentStep.question}
                </p>
                <div className="relative">
                  <textarea
                    value={reflectionText}
                    onChange={(e) => {
                      setReflectionText(e.target.value);
                      setIsSavedNote(false);
                    }}
                    placeholder="Escreva sua resposta ou oração pessoal..."
                    rows={3}
                    className="w-full text-xs font-sans p-3 pr-10 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 placeholder:text-stone-400 resize-none"
                  />
                  <button
                    onClick={handleSaveReflection}
                    disabled={!reflectionText.trim() || isSavedNote}
                    className={`absolute bottom-2.5 right-2.5 p-1.5 rounded-lg transition-all ${
                      isSavedNote
                        ? 'bg-emerald-600 text-white'
                        : reflectionText.trim()
                        ? 'bg-amber-800 text-white hover:bg-amber-900'
                        : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                    }`}
                    title="Salvar no Diário Bíblico"
                  >
                    {isSavedNote ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {isSavedNote && (
                  <span className="text-[10px] text-emerald-700 font-medium block mt-1">
                    ✓ Registrado no seu Caderno Espiritual!
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Celebração ao Concluir */}
          {isCompletedCelebration && (
            <div className="mt-4 p-4 rounded-2xl bg-amber-100/70 border border-amber-300 text-center animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-center gap-1.5 text-amber-900 font-bold text-sm mb-1">
                <PartyPopper className="w-4 h-4 text-amber-600" />
                <span>Devocional Concluído!</span>
              </div>
              <p className="text-xs text-amber-800">
                Sua ofensiva foi mantida! Continue firme na presença de Deus.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Controles Inferiores de Navegação entre Cards */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          onClick={handlePrev}
          disabled={currentStepIndex === 0}
          className="flex items-center gap-1 px-4 py-2.5 rounded-xl text-xs font-semibold border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Voltar</span>
        </button>

        {!isLastStep ? (
          <button
            onClick={handleNext}
            className="flex-1 max-w-[200px] flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-800 hover:bg-amber-900 text-white shadow-xs transition-all active:scale-98"
          >
            <span>Continuar</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleFinalizeDevotional}
            disabled={completedToday || isCompleting}
            className={`flex-1 max-w-[240px] flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
              completedToday
                ? 'bg-emerald-700 text-white cursor-default'
                : 'bg-amber-800 hover:bg-amber-900 text-white active:scale-98'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-300" />
            <span>
              {completedToday
                ? `✓ Ofensiva Ativa (${streak} dias)`
                : isCompleting
                ? 'Completando...'
                : 'Concluir Dia & Manter Ofensiva'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
