'use client';

import { motion } from 'motion/react';
import { useStepPlayer } from '@/hooks/useStepPlayer';
import StepControls from '@/components/StepControls';
import { useAppStore } from '@/lib/store';
import { useMemo } from 'react';

const NODES = [
  { id: 50, x: 50, y: 10, left: 30, right: 70 },
  { id: 30, x: 25, y: 40, left: 20, right: 40 },
  { id: 70, x: 75, y: 40, left: 60, right: 80 },
  { id: 20, x: 12.5, y: 70, left: null, right: null },
  { id: 40, x: 37.5, y: 70, left: null, right: null },
  { id: 60, x: 62.5, y: 70, left: null, right: null },
  { id: 80, x: 87.5, y: 70, left: null, right: null },
];

const SEARCH_PATH = [50, 30, 40];

const STEPS = [
  {
    title: "Initial State",
    description: "B-Trees allow O(log n) search time. We are searching for ID = 40.",
    state: { step: -1 }
  },
  {
    title: "Root Node",
    description: "Start at root (50). 40 < 50, so go left.",
    state: { step: 0 }
  },
  {
    title: "Left Child",
    description: "Current node (30). 40 > 30, so go right.",
    state: { step: 1 }
  },
  {
    title: "Target Found",
    description: "Found 40! Search complete in 3 steps instead of 7.",
    state: { step: 2 }
  }
];

export default function BTreeVisualizer() {
  const { lastExecutedQuery } = useAppStore();
  
  const currentQuery = useMemo(() => {
    if (!lastExecutedQuery) return 'SELECT * FROM users WHERE id = 40;';
    return lastExecutedQuery;
  }, [lastExecutedQuery]);

  const searchId = useMemo(() => {
    if (!lastExecutedQuery) return 40;
    const match = lastExecutedQuery.match(/WHERE\s+(\w+)\s*=\s*(\d+)/i);
    return match ? parseInt(match[2]) : 40;
  }, [lastExecutedQuery]);

  const steps = useMemo(() => [
    {
      title: "Initial State",
      description: `B-Trees allow O(log n) search time. We are searching for value = ${searchId}.`,
      state: { step: -1 }
    },
    {
      title: "Root Node",
      description: `Start at root (50). ${searchId} < 50, so go left.`,
      state: { step: 0 }
    },
    {
      title: "Left Child",
      description: `Current node (30). ${searchId} > 30, so go right.`,
      state: { step: 1 }
    },
    {
      title: "Target Found",
      description: `Found ${searchId}! Search complete in 3 steps instead of 7.`,
      state: { step: 2 }
    }
  ], [searchId]);

  const player = useStepPlayer(steps, 1500);
  const { currentStepData } = player;
  const { step } = currentStepData.state;

  const activeNodes = SEARCH_PATH.slice(0, step + 1);
  const currentNode = step >= 0 ? SEARCH_PATH[step] : null;

  return (
    <div className="flex flex-col items-center w-full max-w-3xl mx-auto p-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white mb-2">{currentStepData.title}</h3>
        <p className="text-gray-400 h-6">{currentStepData.description}</p>
      </div>

      <div className="flex gap-4 mb-8 items-center">
        <div className="bg-white/10 px-4 py-2 rounded-md font-mono text-blue-300">
          {currentQuery}
        </div>
      </div>

      <div className="glass-card w-full aspect-video relative overflow-hidden p-4 mb-8">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Edges */}
          {NODES.map(node => (
            <g key={`edges-${node.id}`}>
              {node.left && (
                <line 
                  x1={node.x} y1={node.y} 
                  x2={NODES.find(n => n.id === node.left)?.x} y2={NODES.find(n => n.id === node.left)?.y} 
                  stroke={activeNodes.includes(node.id) && activeNodes.includes(node.left) ? '#3b82f6' : '#374151'} 
                  strokeWidth="0.5" 
                  className="transition-colors duration-500"
                />
              )}
              {node.right && (
                <line 
                  x1={node.x} y1={node.y} 
                  x2={NODES.find(n => n.id === node.right)?.x} y2={NODES.find(n => n.id === node.right)?.y} 
                  stroke={activeNodes.includes(node.id) && activeNodes.includes(node.right) ? '#3b82f6' : '#374151'} 
                  strokeWidth="0.5"
                  className="transition-colors duration-500"
                />
              )}
            </g>
          ))}

          {/* Nodes */}
          {NODES.map(node => {
            const isActive = activeNodes.includes(node.id);
            const isCurrent = currentNode === node.id;
            const isTarget = node.id === searchId && isCurrent;

            return (
              <g key={`node-${node.id}`} className="transition-all duration-500">
                <circle 
                  cx={node.x} 
                  cy={node.y} 
                  r="5" 
                  fill={isTarget ? '#22c55e' : isCurrent ? '#3b82f6' : isActive ? '#1e3a8a' : '#1f2937'} 
                  stroke={isActive ? '#60a5fa' : '#4b5563'}
                  strokeWidth="0.5"
                />
                <text 
                  x={node.x} 
                  y={node.y} 
                  textAnchor="middle" 
                  dominantBaseline="central" 
                  fill="white" 
                  fontSize="3"
                  fontWeight="bold"
                >
                  {node.id}
                </text>
                
                {isCurrent && (
                  <motion.circle
                    cx={node.x} cy={node.y} r="6"
                    fill="none" stroke={isTarget ? '#22c55e' : '#3b82f6'} strokeWidth="0.5"
                    initial={{ scale: 1, opacity: 1 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  />
                )}
              </g>
            );
          })}
        </svg>
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
