import React from 'react';
import { BookOpen, Sparkles, ChevronDown, PenLine, Headphones, User, Sun } from 'lucide-react';
import { StreakBadge } from './StreakBadge';
import { PwaInstallPrompt } from './PwaInstallPrompt';
import type { BibleVersion, User as UserType } from './types';

interface HeaderProps {
  versions: BibleVersion[];
  selectedVersion: string;
  onSelectVersion: (version: string) => void;
  book: string;
  chapter: number;
  onOpenBookSelector: () => void;
  onOpenJournal: () => void;
  onToggleAudio: () => void;
  isAudioOpen: boolean;
  streak: number;
  completedToday: boolean;
  currentView: string;
  onNavigate: (view: any) => void;
  user: UserType | null;
}

export const Header: React.FC<HeaderProps> = ({
  versions,
  selectedVersion,
  onSelectVersion,
  book,
  chapter,
  onOpenBookSelector,
  onOpenJournal,
  onToggleAudio,
  isAudioOpen,
  streak,
  completedToday,
  currentView,
  onNavigate,
  user,
}) => {
  const isGuest = !user || user.id === 'guest';

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3 shadow-xs">
      {/* Brand no Mobile (Na Sidebar fixa já tem no desktop) */}
      <div 
        onClick={() => onNavigate('dashboard')}
        className="flex items-center gap-2.5 cursor-pointer group select-none md:hidden"
      >
        <div className="w-8 h-8 rounded-xl bg-blue-600/10 text-blue-600 border border-blue-600/20 flex items-center justify-center shadow-xs">
          <BookOpen className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-1">
            <span className="font-serif-bible font-bold text-lg tracking-tight text-slate-900">
              Hagah
            </span>
            <Sparkles className="w-3 h-3 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Indicador de visualização atual no Desktop */}
      <div className="hidden md:flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
          {currentView === 'dashboard' && 'Visão Geral / Início'}
          {currentView === 'devotional' && 'Meditação Diária'}
          {currentView === 'reader' && `Leitura Expositiva - ${book} ${chapter}`}
          {currentView === 'journal' && 'Caderno Espiritual'}
          {currentView === 'settings' && 'Preferências do Sistema'}
        </span>
      </div>

      {/* Controles da Direita */}
      <div className="flex items-center gap-2 sm:gap-3 ml-auto">
        {/* PWA Install Prompt */}
        <PwaInstallPrompt />

        {/* Streak Badge */}
        <StreakBadge streak={streak} completedToday={completedToday} />

        {/* Botão Ouvir Capítulo (Quando no leitor) */}
        {currentView === 'reader' && (
          <button
            onClick={onToggleAudio}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all border shadow-xs cursor-pointer ${
              isAudioOpen
                ? 'bg-blue-600 text-white border-blue-700'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
            }`}
            title="Ouvir áudio do capítulo"
          >
            <Headphones className={`w-3.5 h-3.5 ${isAudioOpen ? 'text-blue-100' : 'text-blue-600'}`} />
            <span className="hidden sm:inline">Áudio</span>
          </button>
        )}

        {/* Seletor Rápido de Passagem (No modo leitor) */}
        {currentView === 'reader' && (
          <button
            onClick={onOpenBookSelector}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-800 border border-slate-200 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer"
            title="Trocar de livro ou capítulo"
          >
            <span className="truncate max-w-[80px] sm:max-w-none">{book}</span>
            <span className="text-blue-600">{chapter}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>
        )}

        {/* Seletor de Versão Bíblica */}
        <div className="relative">
          <select
            value={selectedVersion}
            onChange={(e) => onSelectVersion(e.target.value)}
            className="appearance-none bg-slate-100 hover:bg-slate-200/70 border border-slate-200 text-slate-800 text-xs font-semibold py-1.5 pl-2.5 pr-6 rounded-xl cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600/30"
            title="Selecione a versão do texto bíblico"
          >
            {versions.length > 0 ? (
              versions.map((ver) => (
                <option key={ver.id} value={ver.id}>
                  {ver.abbreviation.toUpperCase()}
                </option>
              ))
            ) : (
              <option value="acf">ACF</option>
            )}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-slate-500 text-xs">
            ▾
          </div>
        </div>

        {/* Botão Perfil no Mobile */}
        <button
          onClick={() => onNavigate('settings')}
          className="md:hidden p-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200"
          title="Minhas configurações"
        >
          <User className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

