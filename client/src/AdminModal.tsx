import React, { useState } from 'react';
import { Database, ShieldCheck, X } from 'lucide-react';
import type { CoverageStats } from './types';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  coverage: CoverageStats | null;
  isCuratorMode: boolean;
  onToggleCuratorMode: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  coverage,
  isCuratorMode,
  onToggleCuratorMode,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-[#FAF8F5] border border-stone-200 rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div className="flex items-center gap-2 text-stone-900 font-serif-bible font-bold text-lg">
            <ShieldCheck className="w-5 h-5 text-amber-700" />
            <span>Painel de Curadoria</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Estatísticas de Cobertura */}
        <div className="my-5 p-4 rounded-xl bg-white border border-stone-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-600">
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-stone-500" />
              Cobertura Exegética Geral
            </span>
            <span className="text-amber-800">{coverage?.percentage || 0}%</span>
          </div>

          <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden border border-stone-200/80">
            <div
              className="bg-amber-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(coverage?.percentage || 0, 100)}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] text-stone-500">
            <span>Comentários: {coverage?.totalCommentaries || 0}</span>
            <span>Total Versículos: {coverage?.totalVerses || 31106}</span>
          </div>
        </div>

        {/* Alternância do Modo Curadoria */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-stone-100 border border-stone-200">
          <div>
            <h4 className="text-xs font-semibold text-stone-800">Modo Curador Ativo</h4>
            <p className="text-[11px] text-stone-500">
              Permite editar textos e gerar reflexões individuais com IA.
            </p>
          </div>
          <button
            onClick={onToggleCuratorMode}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              isCuratorMode
                ? 'bg-amber-800 text-white shadow-xs'
                : 'bg-white border border-stone-300 text-stone-600 hover:bg-stone-50'
            }`}
          >
            {isCuratorMode ? 'Ativado' : 'Desativado'}
          </button>
        </div>
      </div>
    </div>
  );
};
