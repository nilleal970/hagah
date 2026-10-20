import React from 'react';
import { Home, Sun, BookOpen, PenLine, Settings } from 'lucide-react';

interface BottomNavProps {
  currentView: string;
  onNavigate: (view: any) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onNavigate }) => {
  const items = [
    { id: 'dashboard', label: 'Início', icon: Home },
    { id: 'devotional', label: 'Devocional', icon: Sun },
    { id: 'reader', label: 'Leitura', icon: BookOpen },
    { id: 'journal', label: 'Diário', icon: PenLine },
    { id: 'settings', label: 'Config', icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-[#0B1E32]/95 backdrop-blur-md border-t border-[#152E4A] z-40 px-2 py-1.5 flex items-center justify-around select-none shadow-lg">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
              isActive
                ? 'text-blue-400 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-lg ${isActive ? 'bg-blue-600/20 text-blue-400' : ''}`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
