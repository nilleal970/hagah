export interface BibleVersion {
  id: string;
  name: string;
  abbreviation: string;
  type?: 'offline' | 'online';
}

export interface Verse {
  id: number;
  version_id: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  has_commentary?: number; // 1 se possui comentário, 0 caso contrário
}

export interface Commentary {
  id: number;
  book: string;
  chapter: number;
  verse: number;
  historical_context: string;
  exegetical_meaning: string;
  practical_application: string;
  created_at: string;
}

export interface UserNote {
  id: number;
  user_identifier: string;
  book: string;
  chapter: number;
  verse: number | null;
  note_text: string;
  created_at: string;
  updated_at: string;
}

export interface ChapterAudioInfo {
  available: boolean;
  audio_url: string;
  duration_seconds: number;
  narrator?: string;
}

export interface DevotionalStep {
  id: string;
  type: 'verse' | 'historical' | 'meaning' | 'application' | 'prayer';
  badge: string;
  reference: string;
  content: string;
  prompt?: string;
  question?: string;
}

export interface DailyDevotional {
  title: string;
  date: string;
  book: string;
  chapter: number;
  verse: number;
  steps: DevotionalStep[];
}

export interface BibleBookInfo {
  name: string;
  testament: 'Antigo Testamento' | 'Novo Testamento';
  chapters: number;
}

export interface BooksResponse {
  total: number;
  oldTestament: BibleBookInfo[];
  newTestament: BibleBookInfo[];
  all: BibleBookInfo[];
}

export interface StreakStats {
  streak: number;
  completedToday: boolean;
  lastCompletedDate: string | null;
}

export interface CoverageStats {
  totalVerses: number;
  totalCommentaries: number;
  percentage: number;
}

export interface ProfilePreferences {
  purpose: string;
  dailyTime: string;
  studyApproach: string;
  habitTime: string;
  completedAt?: string;
}

export interface User {
  id: number | 'guest';
  name: string;
  email: string;
  profile_preferences?: ProfilePreferences | null;
}

export interface DashboardStats {
  streak: number;
  completedToday: boolean;
  chaptersRead: number;
  journalNotesCount: number;
  audioListenedCount: number;
  lastReading: {
    book: string;
    chapter: number;
  };
}

export type AppTheme = 'blue' | 'green' | 'purple' | 'dark';
export type FontSizeSetting = 'normal' | 'large' | 'extra';
