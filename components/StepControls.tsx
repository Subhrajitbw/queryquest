import { Play, Pause, SkipForward, SkipBack, RotateCcw } from 'lucide-react';

interface StepControlsProps {
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onReset: () => void;
  onSeek: (step: number) => void;
}

export default function StepControls({
  currentStep,
  totalSteps,
  isPlaying,
  onPlay,
  onPause,
  onNext,
  onPrev,
  onReset,
  onSeek
}: StepControlsProps) {
  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-2xl mx-auto mt-8 p-4 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm">
      <div className="flex items-center gap-4 w-full">
        <span className="text-xs font-mono text-gray-400 w-8 text-right">{currentStep + 1}</span>
        <input 
          type="range" 
          min={0} 
          max={totalSteps - 1} 
          value={currentStep}
          onChange={(e) => onSeek(parseInt(e.target.value))}
          className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <span className="text-xs font-mono text-gray-400 w-8">{totalSteps}</span>
      </div>
      
      <div className="flex items-center gap-4">
        <button onClick={onReset} className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors" title="Reset">
          <RotateCcw className="h-5 w-5" />
        </button>
        <button onClick={onPrev} disabled={currentStep === 0} className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-50 transition-colors" title="Previous Step">
          <SkipBack className="h-5 w-5" />
        </button>
        
        {isPlaying ? (
          <button onClick={onPause} className="p-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-[0_0_15px_rgba(37,99,235,0.4)]" title="Pause">
            <Pause className="h-6 w-6" />
          </button>
        ) : (
          <button onClick={onPlay} disabled={currentStep === totalSteps - 1} className="p-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-colors shadow-[0_0_15px_rgba(37,99,235,0.4)]" title="Play">
            <Play className="h-6 w-6" />
          </button>
        )}
        
        <button onClick={onNext} disabled={currentStep === totalSteps - 1} className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-50 transition-colors" title="Next Step">
          <SkipForward className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
