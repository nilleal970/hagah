import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  X,
  Volume2,
  AlertCircle,
} from 'lucide-react';
import type { ChapterAudioInfo } from './types';

interface AudioPlayerProps {
  audioInfo: ChapterAudioInfo | null;
  book: string;
  chapter: number;
  onClose: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioInfo,
  book,
  chapter,
  onClose,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [hasError, setHasError] = useState<boolean>(false);

  // Reiniciar áudio ao trocar de livro/capítulo
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setHasError(false);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.load();
      // Inicia a reprodução automaticamente ao carregar
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    }
  }, [book, chapter, audioInfo?.audio_url]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          setHasError(true);
          setIsPlaying(false);
        });
    }
  };

  const skipTime = (seconds: number) => {
    if (!audioRef.current) return;
    const newTime = Math.min(Math.max(audioRef.current.currentTime + seconds, 0), duration || 1000);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleRateChange = () => {
    const rates = [1, 1.25, 1.5];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const newRate = rates[nextIdx];
    setPlaybackRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const formatTime = (secs: number) => {
    if (Number.isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!audioInfo?.available) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-stone-900/95 text-stone-100 backdrop-blur-md border-t border-stone-800 shadow-2xl px-4 sm:px-8 py-3 animate-in slide-in-from-bottom duration-200">
      <audio
        ref={audioRef}
        src={audioInfo.audio_url}
        onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)}
        onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration)}
        onEnded={() => setIsPlaying(false)}
        onError={() => setHasError(true)}
      />

      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-6">
        {/* Info da Narração */}
        <div className="flex items-center justify-between w-full sm:w-auto gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold font-serif-bible tracking-wide text-amber-200">
                  {book} {chapter}
                </h4>
                {audioInfo.narrator && (
                  <span className="hidden md:inline-block text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    Áudio HD
                  </span>
                )}
              </div>
              <p className="text-[10px] text-stone-300 truncate max-w-[180px] sm:max-w-xs" title={audioInfo.narrator}>
                {audioInfo.narrator ? `Voz: ${audioInfo.narrator}` : 'Áudio Bíblia Oficial'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="sm:hidden text-stone-400 hover:text-white p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Controles Centrais */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* -10s */}
          <button
            onClick={() => skipTime(-10)}
            className="p-1.5 text-stone-300 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
            title="Voltar 10 segundos"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Play / Pause */}
          <button
            onClick={togglePlay}
            className="w-9 h-9 rounded-full bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold flex items-center justify-center transition-transform active:scale-95 shadow-md"
            title={isPlaying ? 'Pausar' : 'Reproduzir'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          {/* +10s */}
          <button
            onClick={() => skipTime(10)}
            className="p-1.5 text-stone-300 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
            title="Avançar 10 segundos"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Velocidade */}
          <button
            onClick={handleRateChange}
            className="text-[11px] font-bold px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition-colors"
            title="Velocidade de reprodução"
          >
            {playbackRate}x
          </button>
        </div>

        {/* Barra de Progresso e Fechar */}
        <div className="w-full sm:w-64 flex items-center gap-2 text-[11px] text-stone-400">
          <span className="w-10 text-right font-mono">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <span className="w-10 font-mono">{formatTime(duration)}</span>

          <button
            onClick={onClose}
            className="hidden sm:block text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 ml-2"
            title="Fechar reprodutor"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {hasError && (
        <div className="flex items-center justify-center gap-1.5 text-xs text-amber-300/90 pt-1.5 text-center">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
          <span>Áudio em carregamento ou indisponível nesta fonte pública.</span>
        </div>
      )}
    </div>
  );
};
