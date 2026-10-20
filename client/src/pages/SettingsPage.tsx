import React, { useState } from 'react';
import { 
  Palette, 
  BookMarked, 
  Download, 
  UserCheck, 
  Shield, 
  LogOut, 
  Type, 
  Check, 
  FileText,
  KeyRound,
  RotateCcw
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import type { User, BibleVersion, AppTheme, FontSizeSetting } from '../types';

interface SettingsPageProps {
  user: User | null;
  versions: BibleVersion[];
  selectedVersion: string;
  onSelectVersion: (version: string) => void;
  fontSize: FontSizeSetting;
  onSelectFontSize: (size: FontSizeSetting) => void;
  onOpenOnboarding: () => void;
  onLogout: () => void;
  onExportNotes: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  user,
  versions,
  selectedVersion,
  onSelectVersion,
  fontSize,
  onSelectFontSize,
  onOpenOnboarding,
  onLogout,
  onExportNotes,
}) => {
  const { theme: appTheme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'appearance' | 'bible' | 'journal' | 'account'>('appearance');
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [newPassword, setNewPassword] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isGuest = !user || user.id === 'guest';

  const themeOptions: { id: AppTheme; name: string; previewClass: string; desc: string }[] = [
    { id: 'blue', name: 'Azul Padrão Hagah', previewClass: 'bg-[#2563EB] border-blue-400', desc: 'Identidade original com slate navy e azul royal vibrante.' },
    { id: 'green', name: 'Verde Bíblico', previewClass: 'bg-[#059669] border-emerald-400', desc: 'Tons orgânicos que remetem à restauração, esperança e vida.' },
    { id: 'purple', name: 'Roxo Real', previewClass: 'bg-[#7C3AED] border-purple-400', desc: 'Dignidade régia com contraste refinado para foco e reverência.' },
    { id: 'dark', name: 'Modo Escuro Profundo', previewClass: 'bg-[#0B0F19] border-sky-400', desc: 'Preto profundo e azul celeste para leitura noturna suave.' },
  ];

  const fontSizeOptions: { id: FontSizeSetting; label: string; sample: string }[] = [
    { id: 'normal', label: 'Normal', sample: 'Texto padrão equilibrado (16px)' },
    { id: 'large', label: 'Grande', sample: 'Maior legibilidade e conforto (18px)' },
    { id: 'extra', label: 'Extra', sample: 'Tipografia ampliada para estudo longo (20px)' },
  ];

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest) {
      setFeedbackMsg({ type: 'error', text: 'Conecte-se com uma conta para alterar seus dados permanentes.' });
      return;
    }

    setIsSaving(true);
    setFeedbackMsg(null);

    try {
      const token = localStorage.getItem('hagah_token');
      const res = await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name: nameInput, newPassword: newPassword || undefined }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao atualizar.');

      setFeedbackMsg({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      setNewPassword('');
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Falha ao atualizar perfil.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header da Tela */}
      <div>
        <h1 className="font-serif-bible font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight">
          Configurações & Preferências
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Ajuste temas, fontes, versões bíblicas e gerencie o backup das suas notas.
        </p>
      </div>

      {/* Abas Superiores no estilo Dashboard Admin */}
      <div className="flex bg-slate-200/60 p-1.5 rounded-2xl border border-slate-300/50 overflow-x-auto">
        <button
          onClick={() => setActiveTab('appearance')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'appearance'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Palette className="w-4 h-4 text-blue-600" />
          <span>Aparência</span>
        </button>

        <button
          onClick={() => setActiveTab('bible')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'bible'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookMarked className="w-4 h-4 text-blue-600" />
          <span>Preferências Bíblicas</span>
        </button>

        <button
          onClick={() => setActiveTab('journal')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'journal'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Download className="w-4 h-4 text-blue-600" />
          <span>Diário & Backup</span>
        </button>

        <button
          onClick={() => setActiveTab('account')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'account'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Shield className="w-4 h-4 text-blue-600" />
          <span>Conta & Segurança</span>
        </button>
      </div>

      {/* Conteúdo da Aba Ativa */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm">
        {/* ABA 1: APARÊNCIA */}
        {activeTab === 'appearance' && (
          <div className="space-y-8">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-serif-bible mb-1">
                Tema Visual da Aplicação
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Personalize a atmosfera visual do Hagah de acordo com sua preferência de leitura.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {themeOptions.map((t) => {
                  const isSelected = appTheme === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTheme(t.id)}
                      className={`text-left p-4 rounded-2xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-2 ring-blue-600 ring-offset-2'
                          : 'border-slate-200 hover:border-slate-300 bg-white hover:shadow-xs'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl ${t.previewClass} border shadow-inner flex items-center justify-center flex-shrink-0 text-white font-bold text-xs`}>
                        {isSelected && <Check className="w-5 h-5 text-white stroke-[2.5]" />}
                      </div>
                      <div>
                        <p className={`text-xs font-bold ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                          {t.name}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{t.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-1">
                <Type className="w-4 h-4 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900 font-serif-bible">
                  Tamanho da Tipografia Bíblica
                </h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Ajuste o tamanho do texto para o leitor de capítulos e reflexões do devocional.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {fontSizeOptions.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => onSelectFontSize(f.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      fontSize === f.id
                        ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold ${fontSize === f.id ? 'text-blue-900' : 'text-slate-800'}`}>
                        {f.label}
                      </span>
                      {fontSize === f.id && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 font-serif-bible">{f.sample}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ABA 2: PREFERÊNCIAS BÍBLICAS */}
        {activeTab === 'bible' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-serif-bible mb-1">
                Versão Padrão do Texto Bíblico
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Selecione a tradução que será aberta por padrão no leitor e no devocional diário.
              </p>

              <div className="space-y-3">
                {versions.map((ver) => (
                  <button
                    key={ver.id}
                    onClick={() => onSelectVersion(ver.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 cursor-pointer ${
                      selectedVersion === ver.id
                        ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {ver.abbreviation.toUpperCase()} - {ver.name}
                        </span>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          ver.type === 'offline'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {ver.type === 'offline' ? 'Banco Local Offline' : 'Online com Cache'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {ver.id === 'acf' 
                          ? 'Texto canônico embutido diretamente no banco SQLite para resposta instantânea em milissegundos.'
                          : 'Carregado de repositório público aberto e gravado localmente para nunca baixar duas vezes.'}
                      </p>
                    </div>

                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                      selectedVersion === ver.id
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-slate-300'
                    }`}>
                      {selectedVersion === ver.id && <Check className="w-3 h-3" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800">Refazer Onboarding de Perfil</h4>
                <p className="text-[11px] text-slate-500">Redefina seu tempo diário, foco e abordagem de estudo.</p>
              </div>
              <button
                onClick={onOpenOnboarding}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Refazer Jornada</span>
              </button>
            </div>
          </div>
        )}

        {/* ABA 3: DIÁRIO & BACKUP */}
        {activeTab === 'journal' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-serif-bible mb-1">
                Backup e Exportação do Seu Caderno
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Suas notas, reflexões e orações são de sua propriedade exclusiva. Exporte quando desejar.
              </p>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Exportar Minhas Notas do Diário</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 max-w-md leading-relaxed">
                      Gera um arquivo formatado em JSON com todas as anotações bíblicas, versículos referenciados e carimbos de data/hora.
                    </p>
                  </div>
                </div>

                <button
                  onClick={onExportNotes}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Arquivo JSON</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ABA 4: CONTA & SEGURANÇA */}
        {activeTab === 'account' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-serif-bible mb-1">
                Dados da Conta
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                {isGuest 
                  ? 'Você está utilizando o modo visitante. Suas notas são salvas neste dispositivo, mas crie uma conta para sincronizar.'
                  : `Logado como ${user.email}`}
              </p>

              {feedbackMsg && (
                <div className={`p-3 rounded-xl text-xs font-medium mb-4 ${
                  feedbackMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                }`}>
                  {feedbackMsg.text}
                </div>
              )}

              {!isGuest ? (
                <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nome de Exibição</label>
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nova Senha (Opcional)</label>
                    <input
                      type="password"
                      placeholder="Deixe em branco para manter a atual"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="py-2.5 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </form>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 mb-4">
                  <p className="text-xs text-amber-900 font-semibold mb-1">Modo Visitante Ativo</p>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Você pode criar uma conta gratuita a qualquer instante para manter seus dados preservados com senha e login em qualquer lugar.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800">Encerrar Sessão</h4>
                <p className="text-[11px] text-slate-500">Sai do aplicativo e volta para a tela de autenticação.</p>
              </div>

              <button
                onClick={onLogout}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{isGuest ? 'Entrar / Criar Conta' : 'Sair da Conta'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
