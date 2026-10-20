import React from 'react';
import { 
  Home, 
  Sun, 
  BookOpen, 
  PenLine, 
  Settings, 
  LogOut, 
  UserCheck, 
  User, 
  Sparkles,
  Flame,
  Volume2
} from 'lucide-react';
import type { User as UserType } from '../types';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: any) => void;
  user: UserType | null;
  onLogout: () => void;
  streak: number;
  completedToday: boolean;
  onOpenAudio?: () => void;
  isAudioAvailable?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  user,
  onLogout,
  streak,
  completedToday,
}) => {
  const isGuest = !user || user.id === 'guest';

  const menuItems = [
    { id: 'dashboard', label: 'Início', icon: Home },
    { id: 'devotional', label: 'Devocional Hagah', icon: Sun },
    { id: 'reader', label: 'Leitura Bíblica', icon: BookOpen },
    { id: 'journal', label: 'Meu Diário', icon: PenLine },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <aside 
      style={{ backgroundColor: 'var(--sidebar-bg)', borderColor: 'var(--sidebar-border)' }}
      className="hidden md:flex flex-col w-64 h-screen fixed inset-y-0 left-0 text-slate-200 border-r z-40 select-none transition-colors duration-200"
    >
      {/* Top Brand / Logo */}
      <div 
        onClick={() => onNavigate('dashboard')}
        style={{ borderColor: 'var(--sidebar-border)' }}
        className="px-6 py-6 flex items-center gap-3 cursor-pointer group transition-colors border-b"
      >
        <div 
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'var(--primary)' }}
          className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm group-hover:scale-105 transition-all text-white"
        >
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-serif-bible font-bold text-2xl tracking-tight text-white group-hover:opacity-90 transition-opacity">
              Hagah
            </span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest -mt-0.5">
            Estudo & Devoção
          </p>
        </div>
      </div>

      {/* Badge de Streak Rápido */}
      <div className="px-5 py-3">
        <div 
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)', borderColor: 'var(--sidebar-border)' }}
          className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border shadow-inner"
        >
          <div className="flex items-center gap-2">
            <Flame className={`w-4 h-4 ${completedToday ? 'text-amber-400 fill-amber-400' : streak > 0 ? 'text-amber-500' : 'text-slate-500'}`} />
            <span className="text-xs font-medium text-slate-300">Ofensiva</span>
          </div>
          <span 
            style={{ backgroundColor: 'var(--primary)' }}
            className="text-xs font-bold text-white px-2.5 py-0.5 rounded-full font-mono shadow-xs"
          >
            {streak} {streak === 1 ? 'dia' : 'dias'}
          </span>
        </div>
      </div>

      {/* Links de Navegação */}
      <nav className="flex-1 px-4 py-3 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={isActive ? { backgroundColor: 'var(--primary)' } : undefined}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                isActive
                  ? 'text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white"></span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Rodapé: Dados do Usuário & Ações */}
      <div 
        style={{ borderColor: 'var(--sidebar-border)', backgroundColor: 'rgba(0, 0, 0, 0.25)' }}
        className="p-4 border-t"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
              {isGuest ? (
                <User className="w-4 h-4" />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {isGuest ? 'Visitante' : user.name}
              </p>
              <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                {isGuest ? (
                  <span className="text-amber-400 font-medium">Modo Convidado</span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <UserCheck className="w-2.5 h-2.5" /> Conectado
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            title={isGuest ? 'Entrar / Criar Conta' : 'Sair da Conta'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#152E4A] transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
