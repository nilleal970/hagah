import React, { useState, useEffect } from 'react';
import {
  Volume2,
  Square,
  X,
  History,
  BookMarked,
  Compass,
  Sparkles,
  Edit3,
  Check,
  Wand2,
  PenLine,
  Trash2,
  Plus,
} from 'lucide-react';
import type { Commentary, Verse, UserNote } from './types';

interface CommentaryPanelProps {
  commentary: Commentary | null;
  activeVerseData: Verse | null;
  isLoading: boolean;
  onClose?: () => void;
  isMobileModal?: boolean;
  isCuratorMode: boolean;
  onUpdateCommentary: (updated: Commentary) => void;
  onGenerateSingle: (book: string, chapter: number, verse: number) => Promise<void>;
  isGeneratingSingle: boolean;
  notes: UserNote[];
  onSaveNote: (book: string, chapter: number, verse: number | null, text: string) => Promise<void>;
  onDeleteNote: (id: number) => Promise<void>;
}

export const CommentaryPanel: React.FC<CommentaryPanelProps> = ({
  commentary,
  activeVerseData,
  isLoading,
  onClose,
  isMobileModal = false,
  isCuratorMode,
  onUpdateCommentary,
  onGenerateSingle,
  isGeneratingSingle,
  notes,
  onSaveNote,
  onDeleteNote,
}) => {
  const [activeTab, setActiveTab] = useState<'commentary' | 'notes'>('commentary');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Campos de edição do comentário (Modo Curador)
  const [historyText, setHistoryText] = useState('');
  const [exegeticalText, setExegeticalText] = useState('');
  const [practicalText, setPracticalText] = useState('');

  // Campo de nova anotação pessoal
  const [newNoteText, setNewNoteText] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  useEffect(() => {
    if (commentary) {
      setHistoryText(commentary.historical_context);
      setExegeticalText(commentary.exegetical_meaning);
      setPracticalText(commentary.practical_application);
    }
    setIsEditing(false);
  }, [commentary?.id]);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  }, [activeVerseData?.verse]);

  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert('Seu navegador não suporta a Web Speech API.');
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    if (!commentary || !activeVerseData) return;

    const narrative =
      `Versículo ${activeVerseData.verse}. ${activeVerseData.text}. ` +
      `Contexto histórico: ${commentary.historical_context}. ` +
      `Significado exegético: ${commentary.exegetical_meaning}. ` +
      `Aplicação prática: ${commentary.practical_application}.`;

    const utterance = new SpeechSynthesisUtterance(narrative);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  const handleSaveEdit = async () => {
    if (!commentary) return;
    setIsSaving(true);

    try {
      const res = await fetch(`/api/commentary/${commentary.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          historical_context: historyText,
          exegetical_meaning: exegeticalText,
          practical_application: practicalText,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.commentary) {
          onUpdateCommentary(data.commentary);
          setIsEditing(false);
        }
      }
    } catch (err) {
      console.error('Erro ao salvar comentário:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim() || !activeVerseData) return;

    setIsSavingNote(true);
    try {
      await onSaveNote(
        activeVerseData.book,
        activeVerseData.chapter,
        activeVerseData.verse,
        newNoteText.trim()
      );
      setNewNoteText('');
    } finally {
      setIsSavingNote(false);
    }
  };

  // Filtra as notas relacionadas ao versículo ativo ou notas gerais do capítulo
  const verseNotes = notes.filter((n) => n.verse === activeVerseData?.verse);

  if (!activeVerseData) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-stone-400">
        <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mb-4 text-stone-400">
          <BookMarked className="w-6 h-6" />
        </div>
        <h3 className="font-serif-bible text-xl font-semibold text-stone-700 mb-1">
          Comentário & Caderno
        </h3>
        <p className="text-xs text-stone-500 max-w-xs">
          Selecione qualquer versículo para acessar o comentário exegético ou registrar suas reflexões espirituais.
        </p>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col bg-[#FAF8F5] ${isMobileModal ? 'p-5' : 'p-6 sm:p-8'}`}>
      {/* Barra Superior do Card */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200/80 mb-3">
        <div className="flex items-center gap-2">
          <span className="bg-amber-800 text-white font-bold text-xs px-2.5 py-1 rounded-md">
            v. {activeVerseData.verse}
          </span>
          <span className="font-serif-bible font-bold text-stone-900 text-base">
            {activeVerseData.book} {activeVerseData.chapter}:{activeVerseData.verse}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Botão de Edição no Modo Curador */}
          {isCuratorMode && commentary && !isEditing && activeTab === 'commentary' && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition-colors"
              title="Editar comentário manualmente"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editar</span>
            </button>
          )}

          {isCuratorMode && isEditing && activeTab === 'commentary' && (
            <button
              onClick={handleSaveEdit}
              disabled={isSaving}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Salvando...' : 'Salvar'}</span>
            </button>
          )}

          {/* Áudio Play/Stop */}
          {commentary && !isEditing && activeTab === 'commentary' && (
            <button
              onClick={handleToggleSpeech}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isPlaying
                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                  : 'bg-stone-100 hover:bg-stone-200/80 text-stone-700 border border-stone-200'
              }`}
              title={isPlaying ? 'Parar narração' : 'Ouvir reflexão'}
            >
              {isPlaying ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Parar</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Ouvir</span>
                </>
              )}
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Abas: Comentário Expositivo vs. Minhas Anotações */}
      <div className="flex border-b border-stone-200 mb-4 bg-stone-100/60 p-1 rounded-xl gap-1">
        <button
          onClick={() => setActiveTab('commentary')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'commentary'
              ? 'bg-white text-stone-900 shadow-2xs'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <BookMarked className="w-3.5 h-3.5" />
          <span>Comentário</span>
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'notes'
              ? 'bg-white text-stone-900 shadow-2xs'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <PenLine className="w-3.5 h-3.5" />
          <span>Minhas Notas</span>
          {verseNotes.length > 0 && (
            <span className="bg-amber-100 text-amber-900 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {verseNotes.length}
            </span>
          )}
        </button>
      </div>

      {/* Citação do Versículo Selecionado */}
      <blockquote className="border-l-3 border-amber-600 pl-3.5 py-1 mb-4 text-sm italic font-serif-bible text-stone-800 bg-amber-50/50 rounded-r-lg">
        "{activeVerseData.text}"
      </blockquote>

      {/* Conteúdo da Aba */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4">
        {activeTab === 'commentary' ? (
          isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-stone-400">
              <div className="w-6 h-6 border-2 border-amber-600/30 border-t-amber-700 rounded-full animate-spin" />
              <p className="text-xs font-medium text-stone-500">Consultando o comentário...</p>
            </div>
          ) : commentary ? (
            isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Contexto Histórico
                  </label>
                  <textarea
                    value={historyText}
                    onChange={(e) => setHistoryText(e.target.value)}
                    className="w-full text-xs font-sans p-3 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500/40 focus:outline-none"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Significado Exegético
                  </label>
                  <textarea
                    value={exegeticalText}
                    onChange={(e) => setExegeticalText(e.target.value)}
                    className="w-full text-xs font-sans p-3 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500/40 focus:outline-none"
                    rows={4}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Aplicação Prática
                  </label>
                  <textarea
                    value={practicalText}
                    onChange={(e) => setPracticalText(e.target.value)}
                    className="w-full text-xs font-sans p-3 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500/40 focus:outline-none"
                    rows={3}
                  />
                </div>
              </div>
            ) : (
              <>
                <section className="bg-white/80 border border-stone-200/80 rounded-xl p-4 shadow-2xs">
                  <div className="flex items-center gap-2 text-stone-800 font-semibold text-xs tracking-wider uppercase mb-2">
                    <History className="w-3.5 h-3.5 text-amber-700" />
                    <span>Contexto Histórico</span>
                  </div>
                  <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-sans">
                    {commentary.historical_context}
                  </p>
                </section>

                <section className="bg-white/80 border border-stone-200/80 rounded-xl p-4 shadow-2xs">
                  <div className="flex items-center gap-2 text-stone-800 font-semibold text-xs tracking-wider uppercase mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                    <span>Significado Exegético</span>
                  </div>
                  <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-sans">
                    {commentary.exegetical_meaning}
                  </p>
                </section>

                <section className="bg-white/80 border border-stone-200/80 rounded-xl p-4 shadow-2xs">
                  <div className="flex items-center gap-2 text-stone-800 font-semibold text-xs tracking-wider uppercase mb-2">
                    <Compass className="w-3.5 h-3.5 text-amber-700" />
                    <span>Aplicação Prática</span>
                  </div>
                  <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-sans">
                    {commentary.practical_application}
                  </p>
                </section>
              </>
            )
          ) : (
            <div className="p-6 rounded-xl border border-dashed border-amber-300 bg-amber-50/40 text-center space-y-3">
              <p className="text-stone-700 font-serif-bible text-base font-medium">
                Comentário deste versículo em elaboração
              </p>
              <p className="text-xs text-stone-500">
                A reflexão exegética para esta passagem será indexada em breve.
              </p>

              {isCuratorMode && (
                <div className="pt-2">
                  <button
                    onClick={() =>
                      onGenerateSingle(
                        activeVerseData.book,
                        activeVerseData.chapter,
                        activeVerseData.verse
                      )
                    }
                    disabled={isGeneratingSingle}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-800 text-white hover:bg-amber-900 transition-all shadow-xs disabled:opacity-50"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>
                      {isGeneratingSingle ? 'Gerando com IA...' : 'Gerar com IA agora'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )
        ) : (
          /* Aba: Minhas Anotações */
          <div className="space-y-4">
            {/* Formulário de Nova Anotação */}
            <form onSubmit={handleAddNote} className="space-y-2">
              <textarea
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Escreva sua reflexão, oração ou revelação sobre este versículo..."
                className="w-full text-xs font-sans p-3 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500/40 focus:outline-none placeholder:text-stone-400"
                rows={3}
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!newNoteText.trim() || isSavingNote}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-800 text-white hover:bg-amber-900 disabled:opacity-40 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isSavingNote ? 'Salvando...' : 'Salvar Nota'}</span>
                </button>
              </div>
            </form>

            {/* Lista de Notas do Versículo */}
            <div className="space-y-2.5 pt-2">
              {verseNotes.length === 0 ? (
                <p className="text-center text-xs text-stone-400 py-4 italic">
                  Nenhuma anotação neste versículo ainda.
                </p>
              ) : (
                verseNotes.map((n) => (
                  <div
                    key={n.id}
                    className="p-3 bg-white border border-stone-200/90 rounded-xl shadow-2xs group relative"
                  >
                    <p className="text-xs text-stone-800 font-sans whitespace-pre-wrap leading-relaxed pr-6">
                      {n.note_text}
                    </p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100 text-[10px] text-stone-400">
                      <span>{new Date(n.updated_at).toLocaleDateString('pt-BR')}</span>
                      <button
                        onClick={() => onDeleteNote(n.id)}
                        className="text-stone-400 hover:text-rose-600 p-1 rounded transition-colors"
                        title="Excluir nota"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
