'use client';

import React from 'react';
import { useStepPlayer } from '@/hooks/useStepPlayer';
import StepControls from '@/components/StepControls';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, ShieldCheck, Database, Terminal, UserX, UserCheck } from 'lucide-react';

import { useAppStore } from '@/lib/store';

const STEPS = [
  {
    title: 'The Vulnerability',
    description: 'A login form takes a username and password. The backend constructs a SQL query by directly concatenating the user input.',
    state: {
      inputType: 'normal',
      username: 'admin',
      password: 'password123',
      query: "SELECT * FROM users WHERE username = 'admin' AND password = 'password123'",
      result: 'Login Failed',
      isSecure: false,
    },
  },
  {
    title: 'The Attack (SQL Injection)',
    description: 'An attacker enters a malicious string. The single quote (\') breaks out of the string literal, and OR 1=1 makes the WHERE clause always true.',
    state: {
      inputType: 'malicious',
      username: "admin' OR '1'='1",
      password: "any",
      query: "SELECT * FROM users WHERE username = 'admin' OR '1'='1' AND password = 'any'",
      result: 'Login Successful (Bypassed!)',
      isSecure: false,
    },
  },
  {
    title: 'How it Works',
    description: 'The database interprets the injected OR \'1\'=\'1\' as part of the SQL command, not as data. Since 1=1 is true, it returns the first user (usually admin).',
    state: {
      inputType: 'malicious',
      username: "admin' OR '1'='1",
      password: "any",
      query: "SELECT * FROM users WHERE username = 'admin' OR '1'='1' AND password = 'any'",
      result: 'Login Successful (Bypassed!)',
      isSecure: false,
      highlight: "OR '1'='1'",
    },
  },
  {
    title: 'The Fix: Prepared Statements',
    description: 'To prevent this, we use Prepared Statements (Parameterized Queries). The SQL structure is sent to the database first, separately from the data.',
    state: {
      inputType: 'secure',
      username: "admin' OR '1'='1",
      password: "any",
      query: "SELECT * FROM users WHERE username = ? AND password = ?",
      params: ["admin' OR '1'='1", "any"],
      result: 'Pending...',
      isSecure: true,
    },
  },
  {
    title: 'Safe Execution',
    description: 'The database treats the malicious input strictly as a literal string value, not as executable code. It looks for a user literally named "admin\' OR \'1\'=\'1".',
    state: {
      inputType: 'secure',
      username: "admin' OR '1'='1",
      password: "any",
      query: "SELECT * FROM users WHERE username = ? AND password = ?",
      params: ["admin' OR '1'='1", "any"],
      result: 'Login Failed (Safe)',
      isSecure: true,
    },
  },
];

export default function SecurityVisualizer() {
  const { lastExecutedQuery } = useAppStore();
  const player = useStepPlayer(STEPS, 3000);
  const { currentStepData } = player;
  const state = currentStepData.state;

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">{currentStepData.title}</h3>
          <p className="text-gray-400 text-sm">{currentStepData.description}</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${state.isSecure ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-red-500/20 border-red-500/30 text-red-400'}`}>
          {state.isSecure ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
          <span className="font-bold text-sm">{state.isSecure ? 'SECURE' : 'VULNERABLE'}</span>
        </div>
      </div>

      {lastExecutedQuery && (
        <div className="w-full p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-xs text-blue-400 uppercase font-bold mb-2 text-left">Current Context</p>
          <div className="text-sm text-gray-300 font-mono text-left break-all">{lastExecutedQuery}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Frontend Form */}
        <div className="glass-card p-6 border-t-4 border-t-purple-500">
          <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Terminal className="h-5 w-5 text-purple-400" />
            Login Form (Client)
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Username</label>
              <div className={`w-full bg-gray-900 border rounded-lg p-3 font-mono text-sm transition-colors ${
                state.inputType === 'malicious' ? 'border-red-500/50 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'border-gray-700 text-gray-300'
              }`}>
                {state.username}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Password</label>
              <div className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 font-mono text-sm text-gray-500">
                ••••••••
              </div>
            </div>
            <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors opacity-50 cursor-not-allowed">
              Login
            </button>
          </div>
        </div>

        {/* Backend Database */}
        <div className="glass-card p-6 border-t-4 border-t-blue-500 flex flex-col">
          <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-400" />
            Database Execution
          </h4>

          <div className="flex-1 flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Constructed Query</label>
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 font-mono text-sm leading-relaxed text-gray-300 relative overflow-hidden">
                {state.highlight ? (
                  <span>
                    SELECT * FROM users WHERE username = &apos;admin&apos; <span className="bg-red-500/30 text-red-300 px-1 rounded font-bold animate-pulse">{state.highlight}</span> AND password = &apos;any&apos;
                  </span>
                ) : (
                  <span>{state.query}</span>
                )}
              </div>
            </div>

            {state.params && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-green-900/20 border border-green-500/30 rounded-lg p-3"
              >
                <label className="block text-xs font-bold text-green-400 uppercase mb-1">Parameters (Treated as Data)</label>
                <div className="font-mono text-sm text-green-300">
                  [1] = &quot;{state.params[0]}&quot;<br/>
                  [2] = &quot;{state.params[1]}&quot;
                </div>
              </motion.div>
            )}

            <div className="mt-auto pt-4 border-t border-gray-800">
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Result</label>
              <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                state.result.includes('Bypassed') 
                  ? 'bg-red-500/20 border-red-500/50 text-red-400' 
                  : state.result.includes('Safe')
                    ? 'bg-green-500/20 border-green-500/50 text-green-400'
                    : 'bg-gray-800 border-gray-700 text-gray-400'
              }`}>
                {state.result.includes('Bypassed') ? <UserCheck className="h-6 w-6" /> : <UserX className="h-6 w-6" />}
                <span className="font-bold">{state.result}</span>
              </div>
            </div>
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
