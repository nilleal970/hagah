import React, { useState } from 'react';
import { X, ChevronRight, ArrowLeft } from 'lucide-react';
import type { BibleBookInfo } from './types';

interface BookSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: {
    oldTestament: BibleBookInfo[];
    newTestament: BibleBookInfo[];
  };
  currentBook: string;
  currentChapter: number;
  onSelect: (book: string, chapter: number) => void;
}

export const BookSelectorModal: React.FC<BookSelectorModalProps> = ({
  isOpen,
  onClose,
  books,
  currentBook,
  currentChapter,
  onSelect,
}) => {
  const [activeTab, setActiveTab] = useState<'AT' | 'NT'>('AT');
  const [selectedBook, setSelectedBook] = useState<BibleBookInfo | null>(null);

  if (!isOpen) return null;

  const activeBooks = activeTab === 'AT' ? books.oldTestament : books.newTestament;

  const handleSelectBook = (b: BibleBookInfo) => {
    setSelectedBook(b);
  };

  const handleSelectChapter = (ch: number) => {
    if (selectedBook) {
      onSelect(selectedBook.name, ch);
      setSelectedBook(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-[#FAF8F5] border border-stone-200 rounded-2xl shadow-xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {selectedBook ? (
              <button
                onClick={() => setSelectedBook(null)}
                className="p-1 -ml-1 text-stone-500 hover:text-stone-800 rounded-lg hover:bg-stone-200/60 transition-colors"
                title="Voltar aos livros"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : null}
            <h2 className="font-serif-bible font-bold text-lg text-stone-900">
              {selectedBook ? `${selectedBook.name} — Capítulos` : 'Livros da Bíblia'}
            </h2>
          </div>

          <button
            onClick={() => {
              setSelectedBook(null);
              onClose();
            }}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/60 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Abas Antigo / Novo Testamento (visível apenas na escolha de livro) */}
        {!selectedBook && (
          <div className="flex border-b border-stone-200 bg-stone-100/60 p-1.5 gap-1.5">
            <button
              onClick={() => setActiveTab('AT')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'AT'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 hover:bg-stone-200/40'
              }`}
            >
              Antigo Testamento (39)
            </button>
            <button
              onClick={() => setActiveTab('NT')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'NT'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 hover:bg-stone-200/40'
              }`}
            >
              Novo Testamento (27)
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {!selectedBook ? (
            /* Lista de Livros */
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {activeBooks.map((b) => {
                const isCurrent = b.name.toLowerCase() === currentBook.toLowerCase();
                return (
                  <button
                    key={b.name}
                    onClick={() => handleSelectBook(b)}
                    className={`flex items-center justify-between p-2.5 rounded-xl text-left text-xs font-medium border transition-all ${
                      isCurrent
                        ? 'bg-amber-100/70 border-amber-300 text-amber-950 font-semibold'
                        : 'bg-white/80 border-stone-200/80 text-stone-700 hover:border-stone-300 hover:bg-stone-100/80'
                    }`}
                  >
                    <span className="truncate">{b.name}</span>
                    <span className="flex items-center text-[10px] text-stone-400 ml-1">
                      {b.chapters}
                      <ChevronRight className="w-3 h-3 ml-0.5" />
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            /* Grade de Capítulos do Livro Selecionado */
            <div>
              <p className="text-xs text-stone-500 mb-3 text-center">
                Selecione um capítulo ({selectedBook.chapters} disponíveis):
              </p>
              <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map((ch) => {
                  const isCurrent =
                    selectedBook.name.toLowerCase() === currentBook.toLowerCase() &&
                    ch === currentChapter;
                  return (
                    <button
                      key={ch}
                      onClick={() => handleSelectChapter(ch)}
                      className={`h-10 rounded-xl font-sans text-xs font-semibold border flex items-center justify-center transition-all ${
                        isCurrent
                          ? 'bg-amber-800 text-white border-amber-900 shadow-xs'
                          : 'bg-white border-stone-200 text-stone-700 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-900'
                      }`}
                    >
                      {ch}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
