import React from 'react';
import { 
  Flame, 
  BookOpen, 
  PenLine, 
  Headphones, 
  Sun, 
  ArrowRight, 
  Compass, 
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock
} from 'lucide-react';
import type { DashboardStats, DailyDevotional, User } from '../types';

interface DashboardProps {
  user: User | null;
  stats: DashboardStats;
  dailyDevotional: DailyDevotional | null;
  onStartDevotional: () => void;
  onContinueReading: (book: string, chapter: number) => void;
  onSelectTrack: (book: string, chapter: number) => void;
  onOpenJournal: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  stats,
  dailyDevotional,
  onStartDevotional,
  onContinueReading,
  onSelectTrack,
  onOpenJournal,
}) => {
  const isGuest = !user || user.id === 'guest';
  const userName = isGuest ? 'Visitante' : user.name.split(' ')[0];

  const todayFormatted = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const featuredTracks = [
    {
      title: 'Salmos de Conforto',
      book: 'Salmos',
      chapter: 23,
      tag: 'Paz & Refúgio',
      desc: 'Meditações profundas sobre o descanso na providência do Pastor.',
      color: 'from-blue-600 to-indigo-700',
    },
    {
      title: 'Sabedoria em Provérbios',
      book: 'Provérbios',
      chapter: 3,
      tag: 'Decisões & Vida',
      desc: 'Confiança de todo o coração e direção clara para os seus passos.',
      color: 'from-amber-600 to-orange-700',
    },
    {
      title: 'Sermão da Montanha',
      book: 'Mateus',
      chapter: 5,
      tag: 'O Reino de Deus',
      desc: 'As bem-aventuranças e o alinhamento da alma com o Pai.',
      color: 'from-emerald-600 to-teal-700',
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* 1. Saudação Superior Contextual */}
      <div className="bg-gradient-to-r from-[#0B1E32] to-[#152E4A] rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-[#1E3E61] relative overflow-hidden">
        {/* Glow de fundo */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs uppercase tracking-widest font-semibold text-slate-300 capitalize">
                {todayFormatted}
              </span>
            </div>
            <h1 className="font-serif-bible font-bold text-2xl sm:text-3xl text-white tracking-tight">
              Olá, {userName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Bem-vindo de volta ao seu refúgio diário de meditação na Palavra viva. O Senhor deseja renovar suas forças hoje.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-2.5 shadow-inner">
              <Flame className={`w-5 h-5 ${stats.completedToday ? 'text-amber-400 fill-amber-400' : 'text-amber-300'}`} />
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">Ofensiva Atual</p>
                <p className="text-sm font-bold font-mono text-white">
                  {stats.streak} {stats.streak === 1 ? 'Dia' : 'Dias'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Grade de 4 Cards de Métricas Rápidas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Ofensiva */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Dias Consecutivos</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900">{stats.streak}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {stats.completedToday ? 'Meta de hoje cumprida!' : 'Complete seu estudo hoje'}
          </p>
        </div>

        {/* Card 2: Capítulos Lidos */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Capítulos Lidos</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900">{stats.chaptersRead}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Histórico registrado no banco</p>
        </div>

        {/* Card 3: Reflexões no Diário */}
        <div 
          onClick={onOpenJournal}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 group-hover:text-blue-600 transition-colors">
              Reflexões no Diário
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 group-hover:bg-purple-100 transition-colors">
              <PenLine className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900">{stats.journalNotesCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Notas & orações pessoais</p>
        </div>

        {/* Card 4: Áudios Bíblicos */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Áudios Disponíveis</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Headphones className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900">{stats.audioListenedCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Capítulos em CDN HD</p>
        </div>
      </div>

      {/* 3. Blocos de Ação Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card Destaque: Devocional de Hoje */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                <Sun className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                Devocional de Hoje (Hagah)
              </span>
              <div className="flex items-center gap-1 text-slate-400 text-xs font-medium">
                <Clock className="w-3.5 h-3.5" />
                <span>3 min</span>
              </div>
            </div>

            <h3 className="font-serif-bible font-bold text-xl sm:text-2xl text-slate-900 mb-2">
              {dailyDevotional?.title || 'Descanso no Bom Pastor'}
            </h3>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 mb-6">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">
                {dailyDevotional?.steps[0]?.reference || 'Salmos 23:1'}
              </p>
              <p className="font-serif-bible italic text-slate-700 text-sm sm:text-base leading-relaxed">
                "{dailyDevotional?.steps[0]?.content || 'O Senhor é o meu pastor, nada me faltará.'}"
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={onStartDevotional}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer group"
            >
              <span>Iniciar Meditação de Hoje</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <span className="text-[11px] text-slate-400">
              5 etapas guiadas: Leitura, Contexto, Exegese, Reflexão e Oração.
            </span>
          </div>
        </div>

        {/* Card Lateral: Continuar Leitura */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Continuar Leitura
              </span>
              <BookOpen className="w-4 h-4 text-slate-400" />
            </div>

            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg font-serif-bible border border-blue-100 mb-3 shadow-xs">
              {stats.lastReading.book.charAt(0)}
            </div>

            <h4 className="font-serif-bible font-bold text-xl text-slate-900 mb-1">
              {stats.lastReading.book} {stats.lastReading.chapter}
            </h4>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Retome de onde parou. Estude versículo a versículo com comentários expositivos imediatos.
            </p>
          </div>

          <button
            onClick={() => onContinueReading(stats.lastReading.book, stats.lastReading.chapter)}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Continuar Capítulo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4. Trilhas em Destaque */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-serif-bible">Trilhas de Estudo em Destaque</h3>
            <p className="text-xs text-slate-500">Caminhos temáticos selecionados para a sua jornada</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {featuredTracks.map((track) => (
            <div
              key={track.title}
              onClick={() => onSelectTrack(track.book, track.chapter)}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 inline-block mb-3">
                  {track.tag}
                </span>
                <h4 className="font-serif-bible font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors mb-1">
                  {track.title}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  {track.desc}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-50 text-xs font-semibold text-slate-700">
                <span>{track.book} {track.chapter}</span>
                <span className="text-blue-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Ler <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
