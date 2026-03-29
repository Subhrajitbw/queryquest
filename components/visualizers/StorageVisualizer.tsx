'use client';

import React from 'react';
import { useStepPlayer } from '@/hooks/useStepPlayer';
import StepControls from '@/components/StepControls';
import { motion, AnimatePresence } from 'motion/react';
import { HardDrive, Cpu, ArrowRight, ArrowLeft, Database } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useMemo } from 'react';

const STEPS = [
  {
    title: 'Initial State',
    description: 'Data is stored on disk in blocks (pages). The memory (Buffer Pool) is empty.',
    state: {
      action: 'Idle',
      diskPages: [
        { id: 'P1', rows: [1, 2, 3], loaded: false },
        { id: 'P2', rows: [4, 5, 6], loaded: false },
        { id: 'P3', rows: [7, 8, 9], loaded: false },
      ],
      bufferPool: [],
      query: 'SELECT * FROM users WHERE id = 5',
      cacheHit: null,
    },
  },
  {
    title: 'Query Received',
    description: 'The database receives a query to find user with ID 5. It first checks the Buffer Pool.',
    state: {
      action: 'Checking Buffer Pool',
      diskPages: [
        { id: 'P1', rows: [1, 2, 3], loaded: false },
        { id: 'P2', rows: [4, 5, 6], loaded: false },
        { id: 'P3', rows: [7, 8, 9], loaded: false },
      ],
      bufferPool: [],
      query: 'SELECT * FROM users WHERE id = 5',
      cacheHit: false,
    },
  },
  {
    title: 'Cache Miss (Disk I/O)',
    description: 'The page containing ID 5 (Page 2) is not in memory. The database must read it from disk.',
    state: {
      action: 'Reading from Disk',
      diskPages: [
        { id: 'P1', rows: [1, 2, 3], loaded: false },
        { id: 'P2', rows: [4, 5, 6], loaded: true },
        { id: 'P3', rows: [7, 8, 9], loaded: false },
      ],
      bufferPool: [],
      query: 'SELECT * FROM users WHERE id = 5',
      cacheHit: false,
    },
  },
  {
    title: 'Page Loaded into Buffer Pool',
    description: 'Page 2 is loaded into the Buffer Pool in memory. The query can now be executed.',
    state: {
      action: 'Loaded into Memory',
      diskPages: [
        { id: 'P1', rows: [1, 2, 3], loaded: true },
        { id: 'P2', rows: [4, 5, 6], loaded: true },
        { id: 'P3', rows: [7, 8, 9], loaded: false },
      ],
      bufferPool: [{ id: 'P2', rows: [4, 5, 6] }],
      query: 'SELECT * FROM users WHERE id = 5',
      cacheHit: false,
    },
  },
  {
    title: 'New Query Received',
    description: 'A new query arrives for user ID 4, which is also on Page 2.',
    state: {
      action: 'Checking Buffer Pool',
      diskPages: [
        { id: 'P1', rows: [1, 2, 3], loaded: false },
        { id: 'P2', rows: [4, 5, 6], loaded: true },
        { id: 'P3', rows: [7, 8, 9], loaded: false },
      ],
      bufferPool: [{ id: 'P2', rows: [4, 5, 6] }],
      query: 'SELECT * FROM users WHERE id = 4',
      cacheHit: null,
    },
  },
  {
    title: 'Cache Hit (No Disk I/O)',
    description: 'Page 2 is already in the Buffer Pool! The database serves the data directly from memory, which is much faster.',
    state: {
      action: 'Cache Hit',
      diskPages: [
        { id: 'P1', rows: [1, 2, 3], loaded: false },
        { id: 'P2', rows: [4, 5, 6], loaded: true },
        { id: 'P3', rows: [7, 8, 9], loaded: false },
      ],
      bufferPool: [{ id: 'P2', rows: [4, 5, 6] }],
      query: 'SELECT * FROM users WHERE id = 4',
      cacheHit: true,
    },
  },
];

export default function StorageVisualizer() {
  const { lastExecutedQuery } = useAppStore();
  
  const currentQuery = useMemo(() => {
    if (!lastExecutedQuery) return 'SELECT * FROM users WHERE id = 5';
    return lastExecutedQuery;
  }, [lastExecutedQuery]);

  const searchId = useMemo(() => {
    if (!lastExecutedQuery) return 5;
    const match = lastExecutedQuery.match(/WHERE\s+(\w+)\s*=\s*(\d+)/i);
    return match ? parseInt(match[2]) : 5;
  }, [lastExecutedQuery]);

  const steps = useMemo(() => [
    {
      title: 'Initial State',
      description: 'Data is stored on disk in blocks (pages). The memory (Buffer Pool) is empty.',
      state: {
        action: 'Idle',
        diskPages: [
          { id: 'P1', rows: [1, 2, 3], loaded: false },
          { id: 'P2', rows: [4, 5, 6], loaded: false },
          { id: 'P3', rows: [7, 8, 9], loaded: false },
        ],
        bufferPool: [],
        query: currentQuery,
        cacheHit: null,
      },
    },
    {
      title: 'Query Received',
      description: `The database receives a query to find user with ID ${searchId}. It first checks the Buffer Pool.`,
      state: {
        action: 'Checking Buffer Pool',
        diskPages: [
          { id: 'P1', rows: [1, 2, 3], loaded: false },
          { id: 'P2', rows: [4, 5, 6], loaded: false },
          { id: 'P3', rows: [7, 8, 9], loaded: false },
        ],
        bufferPool: [],
        query: currentQuery,
        cacheHit: false,
      },
    },
    {
      title: 'Cache Miss (Disk I/O)',
      description: `The page containing ID ${searchId} (Page 2) is not in memory. The database must read it from disk.`,
      state: {
        action: 'Reading from Disk',
        diskPages: [
          { id: 'P1', rows: [1, 2, 3], loaded: false },
          { id: 'P2', rows: [4, 5, 6], loaded: true },
          { id: 'P3', rows: [7, 8, 9], loaded: false },
        ],
        bufferPool: [],
        query: currentQuery,
        cacheHit: false,
      },
    },
    {
      title: 'Page Loaded into Buffer Pool',
      description: 'Page 2 is loaded into the Buffer Pool in memory. The query can now be executed.',
      state: {
        action: 'Loaded into Memory',
        diskPages: [
          { id: 'P1', rows: [1, 2, 3], loaded: true },
          { id: 'P2', rows: [4, 5, 6], loaded: true },
          { id: 'P3', rows: [7, 8, 9], loaded: false },
        ],
        bufferPool: [{ id: 'P2', rows: [4, 5, 6] }],
        query: currentQuery,
        cacheHit: false,
      },
    },
    {
      title: 'New Query Received',
      description: `A new query arrives for user ID ${searchId - 1}, which is also on Page 2.`,
      state: {
        action: 'Checking Buffer Pool',
        diskPages: [
          { id: 'P1', rows: [1, 2, 3], loaded: false },
          { id: 'P2', rows: [4, 5, 6], loaded: true },
          { id: 'P3', rows: [7, 8, 9], loaded: false },
        ],
        bufferPool: [{ id: 'P2', rows: [4, 5, 6] }],
        query: currentQuery.replace(searchId.toString(), (searchId - 1).toString()),
        cacheHit: null,
      },
    },
    {
      title: 'Cache Hit (No Disk I/O)',
      description: 'Page 2 is already in the Buffer Pool! The database serves the data directly from memory, which is much faster.',
      state: {
        action: 'Cache Hit',
        diskPages: [
          { id: 'P1', rows: [1, 2, 3], loaded: false },
          { id: 'P2', rows: [4, 5, 6], loaded: true },
          { id: 'P3', rows: [7, 8, 9], loaded: false },
        ],
        bufferPool: [{ id: 'P2', rows: [4, 5, 6] }],
        query: currentQuery.replace(searchId.toString(), (searchId - 1).toString()),
        cacheHit: true,
      },
    },
  ], [currentQuery, searchId]);

  const player = useStepPlayer(steps, 2500);
  const { currentStepData } = player;
  const state = currentStepData.state;

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-1">{currentStepData.title}</h3>
        <p className="text-gray-400 text-sm">{currentStepData.description}</p>
      </div>

      <div className="flex flex-col items-center gap-4 bg-gray-900/50 p-4 rounded-xl border border-gray-800">
        <div className="text-sm text-gray-400 uppercase tracking-wider font-bold">Current Query</div>
        <div className="font-mono text-blue-400 bg-blue-500/10 px-4 py-2 rounded-lg border border-blue-500/30">
          {state.query}
        </div>
        {state.cacheHit !== null && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`px-3 py-1 rounded-full text-sm font-bold ${
              state.cacheHit ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}
          >
            {state.cacheHit ? 'CACHE HIT (Fast)' : 'CACHE MISS (Slow)'}
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
        {/* Disk Storage */}
        <div className="glass-card p-6 border-t-4 border-t-gray-600">
          <div className="flex items-center gap-3 mb-6">
            <HardDrive className="h-8 w-8 text-gray-400" />
            <div>
              <h4 className="text-lg font-bold text-white">Disk Storage</h4>
              <p className="text-xs text-gray-400">Slow, Persistent</p>
            </div>
          </div>
          <div className="space-y-3">
            {state.diskPages.map((page) => (
              <motion.div 
                key={page.id}
                className={`p-3 rounded-lg border flex justify-between items-center ${
                  page.loaded ? 'bg-blue-500/10 border-blue-500/30' : 'bg-gray-800/50 border-gray-700'
                }`}
                animate={{
                  borderColor: page.loaded ? 'rgba(59, 130, 246, 0.5)' : 'rgba(55, 65, 81, 1)',
                }}
              >
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-gray-500" />
                  <span className="font-mono font-bold text-gray-300">{page.id}</span>
                </div>
                <div className="flex gap-1">
                  {page.rows.map((row) => (
                    <div key={row} className="w-6 h-6 rounded bg-gray-700 flex items-center justify-center text-xs font-mono text-gray-400">
                      {row}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Arrow Animation */}
        <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center z-10">
          <AnimatePresence>
            {state.action === 'Reading from Disk' && (
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0 }}
                className="text-blue-400 flex flex-col items-center"
              >
                <span className="text-xs font-bold mb-1 bg-gray-900 px-2 rounded">I/O Read</span>
                <ArrowRight className="h-8 w-8 animate-pulse" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Memory (Buffer Pool) */}
        <div className="glass-card p-6 border-t-4 border-t-green-500">
          <div className="flex items-center gap-3 mb-6">
            <Cpu className="h-8 w-8 text-green-400" />
            <div>
              <h4 className="text-lg font-bold text-white">Memory (Buffer Pool)</h4>
              <p className="text-xs text-gray-400">Fast, Volatile</p>
            </div>
          </div>
          <div className="min-h-[150px] border-2 border-dashed border-gray-700 rounded-xl p-4 flex flex-col gap-3">
            <AnimatePresence>
              {state.bufferPool.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex items-center justify-center text-gray-500 italic text-sm"
                >
                  Buffer Pool Empty
                </motion.div>
              ) : (
                state.bufferPool.map((page) => (
                  <motion.div
                    key={page.id}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 flex justify-between items-center shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                  >
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-green-500" />
                      <span className="font-mono font-bold text-green-400">{page.id}</span>
                    </div>
                    <div className="flex gap-1">
                      {page.rows.map((row) => (
                        <div key={row} className={`w-6 h-6 rounded flex items-center justify-center text-xs font-mono ${
                          (state.query.includes(row.toString())) ? 'bg-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-gray-800 text-gray-300'
                        }`}>
                          {row}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
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
