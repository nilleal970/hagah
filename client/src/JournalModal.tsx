import React, { useState, useEffect } from 'react';
import { BookOpen, X, Calendar, ChevronRight, Trash2 } from 'lucide-react';
import type { UserNote } from './types';

interface JournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToPassage: (book: string, chapter: number, verse: number | null) => void;
  onDeleteNote: (id: number) => Promise<void>;
}

export const JournalModal: React.FC<JournalModalProps> = ({
  isOpen,
  onClose,
  onNavigateToPassage,
  onDeleteNote,
}) => {
  const [journalNotes, setJournalNotes] = useState<UserNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadJournal();
    }
  }, [isOpen]);

  const loadJournal = () => {
    setIsLoading(true);
    fetch('/api/notes/my-journal')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: UserNote[]) => {
        setJournalNotes(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Erro ao carregar diário:', err);
        setIsLoading(false);
      });
  };

  const handleDelete = async (id: number) => {
    await onDeleteNote(id);
    setJournalNotes((prev) => prev.filter((n) => n.id !== id));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-[#FAF8F5] border border-stone-200 rounded-2xl shadow-xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-700/10 text-amber-800 flex items-center justify-center border border-amber-700/20">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif-bible font-bold text-lg text-stone-900">
                Caderno Espiritual & Diário
              </h2>
              <p className="text-[11px] text-stone-500 -mt-0.5">
                Suas notas e orações registradas durante a leitura
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/60"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Lista de Anotações */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {isLoading ? (
            <div className="py-16 text-center text-stone-400">
              <div className="w-6 h-6 border-2 border-amber-600/30 border-t-amber-700 rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs">Carregando seu caderno...</p>
            </div>
          ) : journalNotes.length === 0 ? (
            <div className="text-center py-16 px-4 text-stone-400">
              <p className="font-serif-bible text-base text-stone-600 mb-1">
                Seu caderno espiritual está em branco
              </p>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">
                Selecione qualquer versículo na leitura e abra a aba "Minhas Notas" para registrar reflexões.
              </p>
            </div>
          ) : (
            journalNotes.map((note) => (
              <div
                key={note.id}
                className="p-4 bg-white border border-stone-200/90 rounded-xl shadow-2xs hover:border-amber-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-100">
                    {/* Botão de navegação para a passagem */}
                    <button
                      onClick={() => {
                        onNavigateToPassage(note.book, note.chapter, note.verse);
                        onClose();
                      }}
                      className="flex items-center gap-1 text-xs font-bold text-amber-800 hover:text-amber-950 transition-colors"
                      title="Ir para a passagem bíblica"
                    >
                      <span>
                        {note.book} {note.chapter}
                        {note.verse ? `:${note.verse}` : ''}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-[10px] text-stone-400">
                        <Calendar className="w-3 h-3" />
                        {new Date(note.updated_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>

                      <button
                        onClick={() => handleDelete(note.id)}
                        className="text-stone-300 hover:text-rose-600 transition-colors p-1"
                        title="Excluir anotação"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-stone-800 font-sans whitespace-pre-wrap leading-relaxed">
                    {note.note_text}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
