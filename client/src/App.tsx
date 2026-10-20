import { useState, useEffect } from 'react';
import { Header } from './Header';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { BibleReader } from './BibleReader';
import { CommentaryPanel } from './CommentaryPanel';
import { BookSelectorModal } from './BookSelectorModal';
import { AdminModal } from './AdminModal';
import { JournalModal } from './JournalModal';
import { AudioPlayer } from './AudioPlayer';
import { DuomoDevotional } from './DuomoDevotional';
import { Dashboard } from './pages/Dashboard';
import { SettingsPage } from './pages/SettingsPage';
import { AuthPage } from './pages/AuthPage';
import { OnboardingModal } from './components/OnboardingModal';
import type {
  BibleVersion,
  Verse,
  Commentary,
  BooksResponse,
  CoverageStats,
  UserNote,
  ChapterAudioInfo,
  DailyDevotional,
  User,
  DashboardStats,
  AppTheme,
  FontSizeSetting,
  ProfilePreferences,
} from './types';

export default function App() {
  // Estado de Autenticação & Usuário
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('hagah_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return { id: 'guest', name: 'Visitante', email: 'guest@hagah.local' };
  });

  const [currentView, setCurrentView] = useState<'dashboard' | 'devotional' | 'reader' | 'journal' | 'settings'>('dashboard');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Configurações & Personalização
  const [fontSize, setFontSize] = useState<FontSizeSetting>(() => {
    return (localStorage.getItem('hagah_font_size') as FontSizeSetting) || 'normal';
  });

  // Bíblia e Passagem
  const [versions, setVersions] = useState<BibleVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string>('acf');
  const [book, setBook] = useState<string>('Salmos');
  const [chapter, setChapter] = useState<number>(23);

  const [booksData, setBooksData] = useState<BooksResponse>({
    total: 0,
    oldTestament: [],
    newTestament: [],
    all: [],
  });

  const [verses, setVerses] = useState<Verse[]>([]);
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [commentary, setCommentary] = useState<Commentary | null>(null);
  const [chapterNotes, setChapterNotes] = useState<UserNote[]>([]);
  const [audioInfo, setAudioInfo] = useState<ChapterAudioInfo | null>(null);
  const [isAudioPlayerOpen, setIsAudioPlayerOpen] = useState<boolean>(false);

  // Microdevocional do Dia
  const [dailyDevotional, setDailyDevotional] = useState<DailyDevotional | null>(null);
  const [isDevotionalLoading, setIsDevotionalLoading] = useState<boolean>(true);

  // Estatísticas & Dashboard
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    streak: 0,
    completedToday: false,
    chaptersRead: 0,
    journalNotesCount: 0,
    audioListenedCount: 1,
    lastReading: { book: 'Salmos', chapter: 23 },
  });

  const [coverageStats, setCoverageStats] = useState<CoverageStats | null>(null);
  const [isCuratorMode, setIsCuratorMode] = useState<boolean>(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [isJournalModalOpen, setIsJournalModalOpen] = useState<boolean>(false);

  const [isVersesLoading, setIsVersesLoading] = useState<boolean>(true);
  const [isCommentaryLoading, setIsCommentaryLoading] = useState<boolean>(false);
  const [isGeneratingSingle, setIsGeneratingSingle] = useState<boolean>(false);
  const [isCompleting, setIsCompleting] = useState<boolean>(false);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState<boolean>(false);
  const [isBookModalOpen, setIsBookModalOpen] = useState<boolean>(false);

  // Helper para headers autenticados
  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('hagah_token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      headers['x-user-id'] = 'guest';
    }
    return headers;
  };

  // 1. Carregar versões, catálogo dos livros, devocional diário e streak
  useEffect(() => {
    // Validar token no backend se existir
    const token = localStorage.getItem('hagah_token');
    if (token) {
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.user) {
            setUser(data.user);
            localStorage.setItem('hagah_user', JSON.stringify(data.user));
          } else {
            localStorage.removeItem('hagah_token');
            setUser({ id: 'guest', name: 'Visitante', email: 'guest@hagah.local' });
          }
        })
        .catch(() => {
          setUser({ id: 'guest', name: 'Visitante', email: 'guest@hagah.local' });
        });
    }

    fetch('/api/versions')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: BibleVersion[]) => {
        setVersions(data);
        if (data.length > 0 && !data.some((v) => v.id === selectedVersion)) {
          setSelectedVersion(data[0].id);
        }
      })
      .catch((err) => console.error('Erro ao buscar versões:', err));

    fetch('/api/bible/books')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: BooksResponse | null) => {
        if (data) setBooksData(data);
      })
      .catch((err) => console.error('Erro ao buscar livros bíblicos:', err));

    fetchDailyDevotional();
    fetchDashboardStats();
    fetchCoverage();
  }, []);

  const fetchDailyDevotional = () => {
    setIsDevotionalLoading(true);
    fetch('/api/devotional/daily')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: DailyDevotional | null) => {
        setDailyDevotional(data);
        setIsDevotionalLoading(false);
      })
      .catch((err) => {
        console.error('Erro ao buscar devocional diário:', err);
        setIsDevotionalLoading(false);
      });
  };

  const fetchDashboardStats = () => {
    fetch('/api/user/dashboard-stats', { headers: getAuthHeaders() })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: DashboardStats | null) => {
        if (data) setDashboardStats(data);
      })
      .catch((err) => console.error('Erro ao buscar stats da dashboard:', err));
  };

  const fetchCoverage = () => {
    fetch('/api/admin/coverage')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: CoverageStats | null) => {
        if (data) setCoverageStats(data);
      })
      .catch((err) => console.error('Erro ao buscar cobertura:', err));
  };

  // 2. Carregar notas do capítulo
  const fetchNotes = () => {
    fetch(`/api/notes/${encodeURIComponent(book)}/${chapter}`, { headers: getAuthHeaders() })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: UserNote[]) => setChapterNotes(data))
      .catch((err) => console.error('Erro ao buscar anotações:', err));
  };

  // 3. Carregar áudio do capítulo atual
  const fetchAudio = () => {
    fetch(`/api/audio/${selectedVersion}/${encodeURIComponent(book)}/${chapter}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ChapterAudioInfo | null) => {
        setAudioInfo(data);
      })
      .catch(() => setAudioInfo(null));
  };

  // 4. Carregar versículos da passagem atual
  const fetchVerses = () => {
    setIsVersesLoading(true);
    fetch(`/api/verses/${selectedVersion}/${encodeURIComponent(book)}/${chapter}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Verse[]) => {
        setVerses(data);
        setIsVersesLoading(false);
      })
      .catch((err) => {
        console.error('Erro ao buscar versículos:', err);
        setIsVersesLoading(false);
      });
  };

  useEffect(() => {
    setSelectedVerse(null);
    setCommentary(null);
    fetchVerses();
    fetchNotes();
    fetchAudio();
  }, [selectedVersion, book, chapter]);

  // 5. Carregar comentário do versículo selecionado
  const handleSelectVerse = (verseNum: number) => {
    setSelectedVerse(verseNum);
    setIsMobileSheetOpen(true);
    setIsCommentaryLoading(true);

    fetch(`/api/commentary/${encodeURIComponent(book)}/${chapter}/${verseNum}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: Commentary | null) => {
        setCommentary(data);
        setIsCommentaryLoading(false);
      })
      .catch(() => {
        setCommentary(null);
        setIsCommentaryLoading(false);
      });
  };

  // 6. Salvar nota pessoal (usado tanto no leitor quanto no devocional)
  const handleSaveNote = async (
    b: string,
    c: number,
    v: number | null,
    text: string
  ) => {
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ book: b, chapter: c, verse: v, note_text: text }),
      });

      if (res.ok) {
        fetchNotes();
        fetchDashboardStats();
      }
    } catch (err) {
      console.error('Erro ao salvar nota:', err);
    }
  };

  // 7. Excluir nota pessoal
  const handleDeleteNote = async (id: number) => {
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setChapterNotes((prev) => prev.filter((n) => n.id !== id));
        fetchDashboardStats();
      }
    } catch (err) {
      console.error('Erro ao excluir nota:', err);
    }
  };

  // 8. Gerar comentário individual com IA
  const handleGenerateSingle = async (b: string, c: number, v: number) => {
    setIsGeneratingSingle(true);
    try {
      const res = await fetch('/api/commentary/generate-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book: b, chapter: c, verse: v }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.commentary) {
          setCommentary(data.commentary);
          fetchVerses();
          fetchCoverage();
        }
      } else {
        const errData = await res.json();
        alert(`Erro: ${errData.error || 'Falha na geração'}`);
      }
    } catch (err) {
      alert('Erro de conexão ao gerar comentário.');
    } finally {
      setIsGeneratingSingle(false);
    }
  };

  // 9. Concluir leitura / devocional e avançar streak
  const handleCompleteHabit = async (targetBook = book, targetChapter = chapter) => {
    if (dashboardStats.completedToday || isCompleting) return;

    setIsCompleting(true);
    try {
      const res = await fetch('/api/habits/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ book: targetBook, chapter: targetChapter }),
      });

      if (res.ok) {
        const data = await res.json();
        setDashboardStats((prev) => ({
          ...prev,
          streak: data.streak,
          completedToday: true,
          chaptersRead: prev.chaptersRead + 1,
        }));
      }
    } catch (err) {
      console.error('Erro ao registrar hábito:', err);
    } finally {
      setIsCompleting(false);
    }
  };

  // Navegação de capítulos
  const currentBookInfo = booksData.all.find(
    (b) => b.name.toLowerCase() === book.toLowerCase()
  );
  const totalChapters = currentBookInfo ? currentBookInfo.chapters : 150;

  const handlePrevChapter = () => {
    if (chapter > 1) {
      setChapter((prev) => prev - 1);
    }
  };

  const handleNextChapter = () => {
    if (chapter < totalChapters) {
      setChapter((prev) => prev + 1);
    }
  };

  const handleSelectFontSize = (size: FontSizeSetting) => {
    setFontSize(size);
    localStorage.setItem('hagah_font_size', size);
  };

  // Logout / Alternância de Conta
  const handleLogout = () => {
    localStorage.removeItem('hagah_token');
    localStorage.removeItem('hagah_user');
    setUser({ id: 'guest', name: 'Visitante', email: 'guest@hagah.local' });
    setIsAuthModalOpen(true);
  };

  // Exportar notas em JSON
  const handleExportNotes = async () => {
    try {
      const res = await fetch('/api/notes/export', { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Falha ao exportar.');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'hagah-caderno-espiritual.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('Erro ao exportar notas do diário.');
    }
  };

  const activeVerseData = verses.find((v) => v.verse === selectedVerse) || null;

  // Se o modal de Auth estiver forçado
  if (isAuthModalOpen) {
    return (
      <AuthPage
        onLoginSuccess={(loggedUser, _token) => {
          setUser(loggedUser);
          setIsAuthModalOpen(false);
          fetchDashboardStats();
          fetchNotes();
          // Se for recém-cadastrado e sem preferências, abre onboarding
          if (!loggedUser.profile_preferences) {
            setIsOnboardingOpen(true);
          }
        }}
        onExploreAsGuest={() => {
          setUser({ id: 'guest', name: 'Visitante', email: 'guest@hagah.local' });
          setIsAuthModalOpen(false);
          fetchDashboardStats();
          fetchNotes();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row antialiased text-slate-900">
      {/* 1. Sidebar Fixa no Desktop */}
      <Sidebar
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'journal') {
            setIsJournalModalOpen(true);
          } else {
            setCurrentView(view);
          }
        }}
        user={user}
        onLogout={handleLogout}
        streak={dashboardStats.streak}
        completedToday={dashboardStats.completedToday}
      />

      {/* 2. Conteúdo Central (com margem lateral para compensar a Sidebar fixa no desktop) */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0 pb-16 md:pb-0">
        {/* Header Superior Responsivo */}
        <Header
          versions={versions}
          selectedVersion={selectedVersion}
          onSelectVersion={setSelectedVersion}
          book={book}
          chapter={chapter}
          onOpenBookSelector={() => setIsBookModalOpen(true)}
          onOpenJournal={() => setIsJournalModalOpen(true)}
          onToggleAudio={() => setIsAudioPlayerOpen((prev) => !prev)}
          isAudioOpen={isAudioPlayerOpen}
          streak={dashboardStats.streak}
          completedToday={dashboardStats.completedToday}
          currentView={currentView}
          onNavigate={(view) => {
            if (view === 'journal') setIsJournalModalOpen(true);
            else setCurrentView(view);
          }}
          user={user}
        />

        {/* ÁREA DE VISUALIZAÇÃO PRINCIPAL */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* VISÃO: DASHBOARD */}
          {currentView === 'dashboard' && (
            <Dashboard
              user={user}
              stats={dashboardStats}
              dailyDevotional={dailyDevotional}
              onStartDevotional={() => setCurrentView('devotional')}
              onContinueReading={(b, c) => {
                setBook(b);
                setChapter(c);
                setCurrentView('reader');
              }}
              onSelectTrack={(b, c) => {
                setBook(b);
                setChapter(c);
                setCurrentView('reader');
              }}
              onOpenJournal={() => setIsJournalModalOpen(true)}
            />
          )}

          {/* VISÃO: DEVOCIONAL HAGAH */}
          {currentView === 'devotional' && (
            <main className="flex-1 flex flex-col justify-center">
              <DuomoDevotional
                devotional={dailyDevotional}
                isLoading={isDevotionalLoading}
                onSaveNote={handleSaveNote}
                onCompleteDay={() => handleCompleteHabit()}
                completedToday={dashboardStats.completedToday}
                streak={dashboardStats.streak}
                onNavigateToReader={(b, c, v) => {
                  setBook(b);
                  setChapter(c);
                  if (v) setSelectedVerse(v);
                  setCurrentView('reader');
                }}
              />
            </main>
          )}

          {/* VISÃO: LEITOR BÍBLICO (SPLIT VIEW) */}
          {currentView === 'reader' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col md:flex-row h-[calc(100vh-140px)]">
              {/* Painel Esquerdo: Texto Bíblico */}
              <main className="flex-1 overflow-y-auto w-full md:w-[60%] border-r border-slate-100">
                <BibleReader
                  verses={verses}
                  selectedVerse={selectedVerse}
                  onSelectVerse={handleSelectVerse}
                  isLoading={isVersesLoading}
                  book={book}
                  chapter={chapter}
                  onPrevChapter={handlePrevChapter}
                  onNextChapter={handleNextChapter}
                  hasPrev={chapter > 1}
                  hasNext={chapter < totalChapters}
                  onCompleteReading={() => handleCompleteHabit()}
                  completedToday={dashboardStats.completedToday}
                  isCompleting={isCompleting}
                  onOpenAdmin={() => setIsAdminModalOpen(true)}
                  isCuratorMode={isCuratorMode}
                  fontSize={fontSize}
                />
              </main>

              {/* Painel Direito Fixo: Comentário & Caderno */}
              <aside className="hidden md:block md:w-[40%] h-full overflow-hidden bg-slate-50/50">
                <CommentaryPanel
                  commentary={commentary}
                  activeVerseData={activeVerseData}
                  isLoading={isCommentaryLoading}
                  isCuratorMode={isCuratorMode}
                  onUpdateCommentary={(updated) => setCommentary(updated)}
                  onGenerateSingle={handleGenerateSingle}
                  isGeneratingSingle={isGeneratingSingle}
                  notes={chapterNotes}
                  onSaveNote={handleSaveNote}
                  onDeleteNote={handleDeleteNote}
                />
              </aside>
            </div>
          )}

          {/* VISÃO: CONFIGURAÇÕES */}
          {currentView === 'settings' && (
            <SettingsPage
              user={user}
              versions={versions}
              selectedVersion={selectedVersion}
              onSelectVersion={setSelectedVersion}
              fontSize={fontSize}
              onSelectFontSize={handleSelectFontSize}
              onOpenOnboarding={() => setIsOnboardingOpen(true)}
              onLogout={handleLogout}
              onExportNotes={handleExportNotes}
            />
          )}
        </div>
      </div>

      {/* 3. Bottom Navigation Bar no Mobile */}
      <BottomNav
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'journal') setIsJournalModalOpen(true);
          else setCurrentView(view);
        }}
      />

      {/* Mobile BottomSheet (No modo leitor) */}
      {currentView === 'reader' && isMobileSheetOpen && (
        <div className="md:hidden fixed inset-x-0 bottom-14 z-40 max-h-[55vh] h-[55vh] bg-white border-t-2 border-slate-300 shadow-2xl rounded-t-3xl flex flex-col animate-in slide-in-from-bottom duration-200">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2.5" />
          <div className="flex-1 overflow-hidden">
            <CommentaryPanel
              commentary={commentary}
              activeVerseData={activeVerseData}
              isLoading={isCommentaryLoading}
              onClose={() => setIsMobileSheetOpen(false)}
              isMobileModal={true}
              isCuratorMode={isCuratorMode}
              onUpdateCommentary={(updated) => setCommentary(updated)}
              onGenerateSingle={handleGenerateSingle}
              isGeneratingSingle={isGeneratingSingle}
              notes={chapterNotes}
              onSaveNote={handleSaveNote}
              onDeleteNote={handleDeleteNote}
            />
          </div>
        </div>
      )}

      {/* Audio Player Integrado */}
      {isAudioPlayerOpen && (
        <AudioPlayer
          audioInfo={audioInfo}
          book={book}
          chapter={chapter}
          onClose={() => setIsAudioPlayerOpen(false)}
        />
      )}

      {/* Modal Seletor de Livros */}
      <BookSelectorModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        books={{
          oldTestament: booksData.oldTestament,
          newTestament: booksData.newTestament,
        }}
        currentBook={book}
        currentChapter={chapter}
        onSelect={(newBook, newChapter) => {
          setBook(newBook);
          setChapter(newChapter);
        }}
      />

      {/* Modal de Curadoria & Métricas */}
      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        coverage={coverageStats}
        isCuratorMode={isCuratorMode}
        onToggleCuratorMode={() => setIsCuratorMode((prev) => !prev)}
      />

      {/* Modal Meu Diário & Caderno Espiritual */}
      <JournalModal
        isOpen={isJournalModalOpen}
        onClose={() => setIsJournalModalOpen(false)}
        onNavigateToPassage={(targetBook, targetChapter, targetVerse) => {
          setBook(targetBook);
          setChapter(targetChapter);
          if (targetVerse) {
            handleSelectVerse(targetVerse);
          }
          setCurrentView('reader');
        }}
        onDeleteNote={handleDeleteNote}
      />

      {/* Modal de Onboarding de Perfil Autoral */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onComplete={(prefs: ProfilePreferences) => {
          setIsOnboardingOpen(false);
          if (user) {
            setUser({ ...user, profile_preferences: prefs });
            localStorage.setItem('hagah_user', JSON.stringify({ ...user, profile_preferences: prefs }));
          }
          setCurrentView('dashboard');
        }}
        onSkip={() => {
          setIsOnboardingOpen(false);
          setCurrentView('dashboard');
        }}
      />
    </div>
  );
}
