'use client';

import React from 'react';
import { useStepPlayer } from '@/hooks/useStepPlayer';
import StepControls from '@/components/StepControls';
import DataTable from '../DataTable';
import { motion } from 'motion/react';
import { AlertTriangle, ShieldCheck, Database } from 'lucide-react';

import { useAppStore } from '@/lib/store';

const STEPS = [
  {
    title: 'Initial State',
    description: 'Two users, Alice and Bob, are interacting with the database. The initial balance of Account 1 is $1000.',
    state: {
      aliceTx: 'Idle',
      bobTx: 'Idle',
      dbBalance: 1000,
      aliceRead: null,
      bobRead: null,
      anomaly: null,
      isolationLevel: 'READ UNCOMMITTED',
    },
  },
  {
    title: 'Alice Starts Transaction',
    description: 'Alice begins a transaction to update the balance.',
    state: {
      aliceTx: 'BEGIN',
      bobTx: 'Idle',
      dbBalance: 1000,
      aliceRead: null,
      bobRead: null,
      anomaly: null,
      isolationLevel: 'READ UNCOMMITTED',
    },
  },
  {
    title: 'Alice Updates Balance',
    description: 'Alice adds $500 to Account 1. The new balance is $1500, but she has NOT committed yet.',
    state: {
      aliceTx: 'UPDATE accounts SET balance = 1500 WHERE id = 1',
      bobTx: 'Idle',
      dbBalance: 1500, // Uncommitted
      aliceRead: null,
      bobRead: null,
      anomaly: null,
      isolationLevel: 'READ UNCOMMITTED',
    },
  },
  {
    title: 'Bob Reads Balance (Dirty Read)',
    description: 'Bob reads the balance. Because the isolation level is READ UNCOMMITTED, he sees the uncommitted $1500.',
    state: {
      aliceTx: 'Uncommitted',
      bobTx: 'SELECT balance FROM accounts WHERE id = 1',
      dbBalance: 1500,
      aliceRead: null,
      bobRead: 1500,
      anomaly: 'Dirty Read',
      isolationLevel: 'READ UNCOMMITTED',
    },
  },
  {
    title: 'Alice Rolls Back',
    description: 'Alice encounters an error and rolls back her transaction. The balance reverts to $1000.',
    state: {
      aliceTx: 'ROLLBACK',
      bobTx: 'Processing with $1500',
      dbBalance: 1000,
      aliceRead: null,
      bobRead: 1500,
      anomaly: 'Dirty Read',
      isolationLevel: 'READ UNCOMMITTED',
    },
  },
  {
    title: 'Bob Uses Invalid Data',
    description: 'Bob is now using $1500 for his calculations, which is incorrect because Alice rolled back. This is the danger of a Dirty Read.',
    state: {
      aliceTx: 'Rolled Back',
      bobTx: 'Using invalid $1500',
      dbBalance: 1000,
      aliceRead: null,
      bobRead: 1500,
      anomaly: 'Dirty Read',
      isolationLevel: 'READ UNCOMMITTED',
    },
  },
  {
    title: 'Change Isolation Level',
    description: 'Let\'s change the isolation level to READ COMMITTED to prevent Dirty Reads.',
    state: {
      aliceTx: 'Idle',
      bobTx: 'Idle',
      dbBalance: 1000,
      aliceRead: null,
      bobRead: null,
      anomaly: null,
      isolationLevel: 'READ COMMITTED',
    },
  },
  {
    title: 'Alice Updates Balance Again',
    description: 'Alice again updates the balance to $1500 but hasn\'t committed.',
    state: {
      aliceTx: 'UPDATE accounts SET balance = 1500 WHERE id = 1',
      bobTx: 'Idle',
      dbBalance: 1500, // Uncommitted
      aliceRead: null,
      bobRead: null,
      anomaly: null,
      isolationLevel: 'READ COMMITTED',
    },
  },
  {
    title: 'Bob Reads Balance (Blocked/Old Value)',
    description: 'Bob tries to read. Under READ COMMITTED, he only sees the last committed value ($1000), preventing the Dirty Read.',
    state: {
      aliceTx: 'Uncommitted',
      bobTx: 'SELECT balance FROM accounts WHERE id = 1',
      dbBalance: 1500, // Uncommitted
      aliceRead: null,
      bobRead: 1000, // Sees committed value
      anomaly: 'Prevented',
      isolationLevel: 'READ COMMITTED',
    },
  },
];

export default function ConcurrencyVisualizer() {
  const { lastExecutedQuery } = useAppStore();
  const player = useStepPlayer(STEPS, 2500);
  const { currentStepData } = player;
  const state = currentStepData.state;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between bg-gray-800/50 p-4 rounded-xl border border-gray-700">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">{currentStepData.title}</h3>
          <p className="text-gray-400 text-sm">{currentStepData.description}</p>
        </div>
        <div className="flex items-center gap-3 bg-blue-900/30 px-4 py-2 rounded-lg border border-blue-500/30">
          <ShieldCheck className="h-5 w-5 text-blue-400" />
          <span className="text-blue-200 font-mono text-sm">ISOLATION: {state.isolationLevel}</span>
        </div>
      </div>

      {lastExecutedQuery && (
        <div className="w-full p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-xs text-blue-400 uppercase font-bold mb-2 text-left">Current Context</p>
          <div className="text-sm text-gray-300 font-mono text-left break-all">{lastExecutedQuery}</div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Alice's Transaction */}
        <motion.div 
          className={`glass-card p-6 border-l-4 ${state.aliceTx.includes('ROLLBACK') ? 'border-l-red-500' : 'border-l-purple-500'}`}
          animate={{ scale: state.aliceTx !== 'Idle' ? 1.02 : 1 }}
        >
          <h4 className="text-lg font-bold text-purple-400 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">A</div>
            Transaction A (Alice)
          </h4>
          <div className="bg-gray-900/50 p-4 rounded-lg font-mono text-sm text-gray-300 min-h-[80px] flex items-center border border-gray-800">
            {state.aliceTx}
          </div>
        </motion.div>

        {/* Database State */}
        <motion.div 
          className="glass-card p-6 border-t-4 border-t-blue-500 flex flex-col items-center justify-center relative"
          animate={{ scale: state.dbBalance === 1500 ? 1.05 : 1 }}
        >
          <Database className="h-12 w-12 text-blue-400 mb-4" />
          <h4 className="text-lg font-bold text-white mb-2">Database</h4>
          <div className="text-3xl font-mono font-bold text-green-400">
            ${state.dbBalance}
          </div>
          {state.aliceTx === 'Uncommitted' && (
            <span className="absolute top-4 right-4 text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded border border-yellow-500/30">
              Uncommitted
            </span>
          )}
        </motion.div>

        {/* Bob's Transaction */}
        <motion.div 
          className={`glass-card p-6 border-r-4 ${state.anomaly === 'Dirty Read' ? 'border-r-red-500' : 'border-r-orange-500'}`}
          animate={{ scale: state.bobTx !== 'Idle' ? 1.02 : 1 }}
        >
          <h4 className="text-lg font-bold text-orange-400 mb-4 flex items-center gap-2 justify-end">
            Transaction B (Bob)
            <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">B</div>
          </h4>
          <div className="bg-gray-900/50 p-4 rounded-lg font-mono text-sm text-gray-300 min-h-[80px] flex items-center justify-end text-right border border-gray-800">
            {state.bobTx}
          </div>
          {state.bobRead !== null && (
            <div className="mt-4 flex justify-end">
              <div className={`px-3 py-1 rounded text-sm font-mono ${state.anomaly === 'Dirty Read' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}>
                Read Value: ${state.bobRead}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {state.anomaly && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl border flex items-center gap-3 ${
            state.anomaly === 'Prevented' 
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          {state.anomaly === 'Prevented' ? <ShieldCheck className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
          <div>
            <h4 className="font-bold">{state.anomaly === 'Prevented' ? 'Anomaly Prevented' : 'Concurrency Anomaly Detected'}</h4>
            <p className="text-sm opacity-80">
              {state.anomaly === 'Prevented' 
                ? 'READ COMMITTED isolation level successfully prevented the Dirty Read.' 
                : 'A Dirty Read occurred because Transaction B read uncommitted data from Transaction A.'}
            </p>
          </div>
        </motion.div>
      )}

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
