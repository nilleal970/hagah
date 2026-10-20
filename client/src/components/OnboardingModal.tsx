import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Check, 
  HeartHandshake, 
  Clock, 
  BookMarked, 
  Sun,
  ShieldCheck
} from 'lucide-react';
import type { ProfilePreferences } from '../types';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (prefs: ProfilePreferences) => void;
  onSkip: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onComplete,
  onSkip,
}) => {
  const [step, setStep] = useState<number>(1);
  const [purpose, setPurpose] = useState<string>('Paz contra ansiedade');
  const [dailyTime, setDailyTime] = useState<string>('3 min Microdevocional');
  const [studyApproach, setStudyApproach] = useState<string>('Aplicação pastoral prática');
  const [habitTime, setHabitTime] = useState<string>('Manhã');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  if (!isOpen) return null;

  const stepsTotal = 4;

  const purposeOptions = [
    { title: 'Paz contra ansiedade', desc: 'Descanso mental e conforto em promessas bíblicas firmes' },
    { title: 'Sabedoria para decisões', desc: 'Princípios práticos em Provérbios e ensinamentos de Jesus' },
    { title: 'Estudo bíblico aprofundado', desc: 'Exegese, contexto histórico original e conexões textuais' },
    { title: 'Constância diária', desc: 'Criar o hábito inquebrável de meditar todos os dias' },
  ];

  const timeOptions = [
    { title: '3 min Microdevocional', desc: 'Foco no essencial para dias dinâmicos e agendas cheias' },
    { title: '5 a 10 min Leitura com reflexão', desc: 'Capítulo completo com diário pessoal e perguntas' },
    { title: 'Estudo sem pressa (15+ min)', desc: 'Imersão nos comentários versículo por versículo' },
  ];

  const approachOptions = [
    { title: 'Aplicação pastoral prática', desc: 'Como aplicar a verdade inspirada nos meus desafios de hoje' },
    { title: 'Raízes em Hebraico/Grego', desc: 'Significados originais dos termos bíblicos fundamentais' },
    { title: 'Contexto histórico e cultural', desc: 'Cenário sociopolítico e costumes do mundo antigo' },
  ];

  const habitOptions = [
    { title: 'Manhã', desc: 'Começar o dia com a mente alinhada e protegida' },
    { title: 'Tarde', desc: 'Uma pausa restauradora no meio do trabalho ou estudo' },
    { title: 'Noite', desc: 'Desacelerar os pensamentos em gratidão antes de dormir' },
  ];

  const handleNext = () => {
    if (step < stepsTotal) {
      setStep(step + 1);
    } else {
      finishOnboarding();
    }
  };

  const finishOnboarding = async () => {
    setIsSaving(true);
    const prefs: ProfilePreferences = {
      purpose,
      dailyTime,
      studyApproach,
      habitTime,
      completedAt: new Date().toISOString(),
    };

    try {
      const token = localStorage.getItem('hagah_token');
      await fetch('/api/user/profile-onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(prefs),
      });
    } catch (err) {
      console.error('Erro ao salvar onboarding:', err);
    } finally {
      setIsSaving(false);
      onComplete(prefs);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0B1E32]/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header com Progresso */}
        <div className="bg-[#0B1E32] px-6 py-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="font-serif-bible font-bold text-lg text-white">Jornada Hagah</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                Passo {step} de {stepsTotal}
              </span>
            </div>
            <button
              onClick={onSkip}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              Pular
            </button>
          </div>

          {/* Barra de Progresso */}
          <div className="w-full bg-[#152E4A] h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-blue-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${(step / stepsTotal) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Conteúdo do Card */}
        <div className="p-6 sm:p-8">
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-serif-bible">
                    Qual o seu foco principal ao buscar as Escrituras hoje?
                  </h3>
                  <p className="text-xs text-slate-500">Personaliza os destaques do seu devocional diário.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {purposeOptions.map((opt) => (
                  <button
                    key={opt.title}
                    type="button"
                    onClick={() => setPurpose(opt.title)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                      purpose === opt.title
                        ? 'border-blue-600 bg-blue-50/60 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <p className={`text-xs font-bold ${purpose === opt.title ? 'text-blue-900' : 'text-slate-800'}`}>
                        {opt.title}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</p>
                    </div>
                    {purpose === opt.title && (
                      <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-serif-bible">
                    Quanto tempo deseja investir na sua jornada diária?
                  </h3>
                  <p className="text-xs text-slate-500">Ajuste conforme a sua rotina real.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {timeOptions.map((opt) => (
                  <button
                    key={opt.title}
                    type="button"
                    onClick={() => setDailyTime(opt.title)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                      dailyTime === opt.title
                        ? 'border-emerald-600 bg-emerald-50/60 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <p className={`text-xs font-bold ${dailyTime === opt.title ? 'text-emerald-900' : 'text-slate-800'}`}>
                        {opt.title}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</p>
                    </div>
                    {dailyTime === opt.title && (
                      <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                  <BookMarked className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-serif-bible">
                    Qual formato de estudo mais fala ao seu coração?
                  </h3>
                  <p className="text-xs text-slate-500">Prioriza as camadas de inteligência e exegese.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {approachOptions.map((opt) => (
                  <button
                    key={opt.title}
                    type="button"
                    onClick={() => setStudyApproach(opt.title)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                      studyApproach === opt.title
                        ? 'border-purple-600 bg-purple-50/60 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <p className={`text-xs font-bold ${studyApproach === opt.title ? 'text-purple-900' : 'text-slate-800'}`}>
                        {opt.title}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</p>
                    </div>
                    {studyApproach === opt.title && (
                      <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-serif-bible">
                    Em qual horário você prefere seu momento devocional?
                  </h3>
                  <p className="text-xs text-slate-500">Ajuda a consolidar sua ofensiva diária de hábitos.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {habitOptions.map((opt) => (
                  <button
                    key={opt.title}
                    type="button"
                    onClick={() => setHabitTime(opt.title)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                      habitTime === opt.title
                        ? 'border-amber-600 bg-amber-50/60 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <p className={`text-xs font-bold ${habitTime === opt.title ? 'text-amber-900' : 'text-slate-800'}`}>
                        {opt.title}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</p>
                    </div>
                    {habitTime === opt.title && (
                      <div className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Botões de Ação Inferiores */}
          <div className="mt-8 flex items-center justify-between pt-4 border-t border-slate-100">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Voltar
              </button>
            ) : (
              <div></div>
            )}

            <button
              type="button"
              disabled={isSaving}
              onClick={handleNext}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{step === stepsTotal ? 'Concluir & Ir para o Início' : 'Continuar'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
