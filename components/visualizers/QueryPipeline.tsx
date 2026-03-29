'use client';

import { motion } from 'motion/react';
import { Database, Cpu, FileText, Server } from 'lucide-react';
import { useStepPlayer } from '@/hooks/useStepPlayer';
import StepControls from '@/components/StepControls';
import { useAppStore } from '@/lib/store';
import { useMemo } from 'react';

const STEPS = [
  { id: 'query', label: 'SQL Query', icon: FileText, desc: 'SELECT * FROM users WHERE age > 18;' },
  { id: 'parse', label: 'Parser', icon: Cpu, desc: 'Checks syntax and validates table/column names.' },
  { id: 'optimize', label: 'Optimizer', icon: Cpu, desc: 'Creates the most efficient execution plan (e.g., using indexes).' },
  { id: 'execute', label: 'Execution Engine', icon: Server, desc: 'Follows the plan to retrieve or modify data.' },
  { id: 'storage', label: 'Storage Engine', icon: Database, desc: 'Reads/writes actual data blocks from disk/memory.' },
  { id: 'result', label: 'Result', icon: FileText, desc: 'Returns the filtered rows to the client.' }
];

export default function QueryPipeline() {
  const { lastExecutedQuery } = useAppStore();
  const currentQuery = lastExecutedQuery || 'SELECT * FROM users WHERE age > 18;';

  const steps = useMemo(() => [
    { id: 'query', label: 'SQL Query', icon: FileText, desc: currentQuery },
    { id: 'parse', label: 'Parser', icon: Cpu, desc: 'Checks syntax and validates table/column names.' },
    { id: 'optimize', label: 'Optimizer', icon: Cpu, desc: 'Creates the most efficient execution plan (e.g., using indexes).' },
    { id: 'execute', label: 'Execution Engine', icon: Server, desc: 'Follows the plan to retrieve or modify data.' },
    { id: 'storage', label: 'Storage Engine', icon: Database, desc: 'Reads/writes actual data blocks from disk/memory.' },
    { id: 'result', label: 'Result', icon: FileText, desc: 'Returns the filtered rows to the client.' }
  ], [currentQuery]);

  const player = useStepPlayer(steps, 2000);

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white mb-2">Query Execution Pipeline</h3>
        <p className="text-gray-400">Step-by-step breakdown of how a database executes a query.</p>
      </div>

      <div className="relative flex flex-col gap-4 w-full max-w-md mb-8">
        {steps.map((step, index) => {
          const isActive = index === player.currentStep;
          const isPast = index < player.currentStep;
          const Icon = step.icon;

          return (
            <div key={step.id} className="relative flex items-center gap-4">
              {/* Connecting Line */}
              {index > 0 && (
                <div className={`absolute left-6 -top-4 w-0.5 h-4 ${isPast || isActive ? 'bg-blue-500' : 'bg-gray-700'}`} />
              )}
              
              <motion.div 
                animate={{ 
                  scale: isActive ? 1.05 : 1,
                  borderColor: isActive ? '#3b82f6' : isPast ? '#22c55e' : '#374151',
                  backgroundColor: isActive ? 'rgba(59, 130, 246, 0.1)' : isPast ? 'rgba(34, 197, 94, 0.05)' : 'rgba(0,0,0,0.2)'
                }}
                className={`flex-1 flex items-center gap-4 p-4 rounded-xl border-2 transition-colors z-10`}
              >
                <div className={`p-3 rounded-full ${isActive ? 'bg-blue-500 text-white' : isPast ? 'bg-green-500 text-white' : 'bg-gray-800 text-gray-400'}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className={`font-bold ${isActive ? 'text-blue-400' : isPast ? 'text-green-400' : 'text-gray-300'}`}>
                    {step.label}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">{step.desc}</p>
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>

      <StepControls
        currentStep={player.currentStep}
        totalSteps={player.totalSteps}
        isPlaying={player.isPlaying}
        onPlay={player.play}
        onPause={player.pause}
        onNext={player.next}
        onPrev={player.prev}
        onReset={player.reset}
        onSeek={player.goToStep}
      />
    </div>
  );
}
