'use client';

import { motion, AnimatePresence } from 'motion/react';
import { Database, HardDrive, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useStepPlayer } from '@/hooks/useStepPlayer';
import StepControls from '@/components/StepControls';
import DataTable, { ColumnDef } from '@/components/DataTable';

import { useAppStore } from '@/lib/store';
import { useMemo } from 'react';

type Account = { id: string; balance: number; prevBalance?: number; status: 'normal' | 'active' | 'error' };

type TransactionState = {
  accounts: Account[];
  logs: string[];
  transactionActive: boolean;
  error: boolean;
};

const steps = [
  {
    title: "Initial State",
    description: "Two accounts exist. We want to transfer $100 from A to B.",
    state: {
      accounts: [
        { id: 'A', balance: 500, status: 'normal' },
        { id: 'B', balance: 300, status: 'normal' }
      ],
      logs: [],
      transactionActive: false,
      error: false
    } as TransactionState
  },
  {
    title: "BEGIN TRANSACTION",
    description: "Start a new transaction block. Changes are isolated.",
    state: {
      accounts: [
        { id: 'A', balance: 500, status: 'normal' },
        { id: 'B', balance: 300, status: 'normal' }
      ],
      logs: ["BEGIN;"],
      transactionActive: true,
      error: false
    } as TransactionState
  },
  {
    title: "READ A",
    description: "Read the balance of Account A.",
    state: {
      accounts: [
        { id: 'A', balance: 500, status: 'active' },
        { id: 'B', balance: 300, status: 'normal' }
      ],
      logs: ["BEGIN;", "SELECT balance FROM accounts WHERE id = 'A'; -- Returns 500"],
      transactionActive: true,
      error: false
    } as TransactionState
  },
  {
    title: "CHECK CONDITION",
    description: "Application checks if A has enough funds (500 >= 100).",
    state: {
      accounts: [
        { id: 'A', balance: 500, status: 'active' },
        { id: 'B', balance: 300, status: 'normal' }
      ],
      logs: ["BEGIN;", "SELECT balance FROM accounts WHERE id = 'A';", "Check: 500 >= 100 (OK)"],
      transactionActive: true,
      error: false
    } as TransactionState
  },
  {
    title: "DEDUCT FROM A",
    description: "Update Account A's balance.",
    state: {
      accounts: [
        { id: 'A', balance: 400, prevBalance: 500, status: 'active' },
        { id: 'B', balance: 300, status: 'normal' }
      ],
      logs: ["BEGIN;", "SELECT balance FROM accounts WHERE id = 'A';", "Check: 500 >= 100 (OK)", "UPDATE accounts SET balance = 400 WHERE id = 'A';"],
      transactionActive: true,
      error: false
    } as TransactionState
  },
  {
    title: "ADD TO B (ERROR)",
    description: "Attempt to update B, but a system error occurs (e.g., constraint violation or crash).",
    state: {
      accounts: [
        { id: 'A', balance: 400, prevBalance: 500, status: 'normal' },
        { id: 'B', balance: 300, status: 'error' }
      ],
      logs: ["BEGIN;", "...", "UPDATE accounts SET balance = 400 WHERE id = 'A';", "UPDATE accounts SET balance = 400 WHERE id = 'B'; -- ERROR!"],
      transactionActive: true,
      error: true
    } as TransactionState
  },
  {
    title: "ROLLBACK",
    description: "The transaction is aborted. All changes within the block are undone.",
    state: {
      accounts: [
        { id: 'A', balance: 500, prevBalance: 400, status: 'normal' },
        { id: 'B', balance: 300, status: 'normal' }
      ],
      logs: ["BEGIN;", "...", "UPDATE accounts SET balance = 400 WHERE id = 'A';", "UPDATE accounts SET balance = 400 WHERE id = 'B'; -- ERROR!", "ROLLBACK;"],
      transactionActive: false,
      error: true
    } as TransactionState
  },
  {
    title: "SUCCESSFUL SCENARIO: ADD TO B",
    description: "Let's replay without the error. Update Account B's balance.",
    state: {
      accounts: [
        { id: 'A', balance: 400, prevBalance: 500, status: 'normal' },
        { id: 'B', balance: 400, prevBalance: 300, status: 'active' }
      ],
      logs: ["BEGIN;", "UPDATE accounts SET balance = 400 WHERE id = 'A';", "UPDATE accounts SET balance = 400 WHERE id = 'B';"],
      transactionActive: true,
      error: false
    } as TransactionState
  },
  {
    title: "COMMIT",
    description: "Transaction completes successfully. Changes are permanent.",
    state: {
      accounts: [
        { id: 'A', balance: 400, status: 'normal' },
        { id: 'B', balance: 400, status: 'normal' }
      ],
      logs: ["BEGIN;", "UPDATE accounts SET balance = 400 WHERE id = 'A';", "UPDATE accounts SET balance = 400 WHERE id = 'B';", "COMMIT;"],
      transactionActive: false,
      error: false
    } as TransactionState
  }
];

export default function TransactionVisualizer() {
  const { lastExecutedQuery } = useAppStore();
  
  const player = useStepPlayer(steps);
  const { currentStepData } = player;
  
  const { state } = currentStepData;

  const columns: ColumnDef[] = [
    { header: 'Account ID', accessorKey: 'id' },
    { header: 'Balance', accessorKey: 'balance' }
  ];

  const updatedCells = state.accounts
    .map((acc, index) => {
      if (acc.prevBalance !== undefined) {
        return { rowIndex: index, colIndex: 1, previousValue: acc.prevBalance };
      }
      return null;
    })
    .filter(Boolean) as { rowIndex: number; colIndex: number; previousValue: any }[];

  const activeRowIndices = state.accounts
    .map((acc, index) => (acc.status === 'active' ? index : -1))
    .filter(index => index !== -1);

  const highlightedCells = state.accounts
    .map((acc, index) => {
      if (acc.status === 'error') {
        return { rowIndex: index, colIndex: 1, color: 'rgba(239, 68, 68, 0.3)' };
      }
      return null;
    })
    .filter(Boolean) as { rowIndex: number; colIndex: number; color?: string }[];

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-6">
      
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white mb-2">What is a SQL Transaction?</h3>
        <p className="text-gray-400 mb-4">
          A transaction is a sequence of database operations treated as a single unit of work. 
          It follows the ACID properties (Atomicity, Consistency, Isolation, Durability) to ensure data integrity.
        </p>
        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
          <h4 className="text-lg font-bold text-white mb-1">{currentStepData.title}</h4>
          <p className="text-gray-400 text-sm">{currentStepData.description}</p>
        </div>
      </div>

      {lastExecutedQuery && (
        <div className="w-full mb-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-xs text-blue-400 uppercase font-bold mb-2 text-left">Current Context</p>
          <div className="text-sm text-gray-300 font-mono text-left break-all">{lastExecutedQuery}</div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mb-8">
        {/* Accounts Table */}
        <div className={`glass-card p-6 border-2 transition-colors ${state.transactionActive ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.2)]' : 'border-white/10'}`}>
          <div className="flex items-center gap-2 mb-4 text-blue-400 font-bold text-lg">
            <Database className="h-5 w-5" />
            Accounts Table
          </div>
          
          <DataTable
            columns={columns}
            data={state.accounts}
            activeRowIndices={activeRowIndices}
            updatedCells={updatedCells}
            highlightedCells={highlightedCells}
          />
        </div>

        {/* Transaction Log */}
        <div className={`glass-card p-6 border-2 ${state.error ? 'border-red-500/50' : 'border-green-500/30'}`}>
          <div className={`flex items-center gap-2 mb-4 font-bold text-lg ${state.error ? 'text-red-400' : 'text-green-400'}`}>
            {state.error ? <AlertTriangle className="h-5 w-5" /> : <HardDrive className="h-5 w-5" />}
            Transaction Log
          </div>
          
          <div className="flex flex-col gap-2 min-h-[200px] bg-black/40 rounded-lg p-4 font-mono text-sm overflow-y-auto">
            <AnimatePresence mode="popLayout">
              {state.logs.map((log, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`${log.includes('ERROR') ? 'text-red-400' : log.includes('ROLLBACK') ? 'text-orange-400' : 'text-green-300'}`}
                >
                  {log}
                </motion.div>
              ))}
            </AnimatePresence>
            {state.logs.length === 0 && (
              <div className="text-gray-500 text-center py-8">No active queries</div>
            )}
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
