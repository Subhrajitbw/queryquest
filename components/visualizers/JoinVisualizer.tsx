'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '@/lib/store';
import { parseQuery } from '@/lib/executionEngine';
import { runQuery } from '@/lib/db';
import { Database, Layers, Link2 } from 'lucide-react';

const DUMMY_A = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
  { id: 3, name: 'Charlie' }
];

const DUMMY_B = [
  { order_id: 101, user_id: 1, item: 'Laptop' },
  { order_id: 102, user_id: 2, item: 'Mouse' },
  { order_id: 103, user_id: 1, item: 'Keyboard' }
];

export default function JoinVisualizer() {
  const { lastExecutedQuery } = useAppStore();
  const [data, setData] = useState<{ tableA: any[], tableB: any[], nameA: string, nameB: string, joinKeyA: string, joinKeyB: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!lastExecutedQuery) {
        setData({ tableA: DUMMY_A, tableB: DUMMY_B, nameA: 'Users', nameB: 'Orders', joinKeyA: 'id', joinKeyB: 'user_id' });
        return;
      }

      const ast = parseQuery(lastExecutedQuery);
      if (ast && ast.joins && ast.joins.length > 0) {
        const tableA = await runQuery(`SELECT * FROM ${ast.from}`);
        const tableB = await runQuery(`SELECT * FROM ${ast.joins[0].table}`);

        if (tableA && tableB) {
          setData({
            tableA: tableA.values.slice(0, 5),
            tableB: tableB.values.slice(0, 5),
            nameA: ast.from,
            nameB: ast.joins[0].table,
            joinKeyA: ast.joins[0].on[0],
            joinKeyB: ast.joins[0].on[1]
          });
          return;
        }
      }
      
      setData({ tableA: DUMMY_A, tableB: DUMMY_B, nameA: 'Users', nameB: 'Orders', joinKeyA: 'id', joinKeyB: 'user_id' });
    }
    loadData();
  }, [lastExecutedQuery]);

  const visual = useMemo(() => {
    if (!data) return null;
    return {
      leftTable: data.nameA,
      rightTable: data.nameB,
      joinType: 'INNER',
      matchingKeys: [data.joinKeyA, data.joinKeyB],
      leftRows: data.tableA,
      rightRows: data.tableB,
      matches: data.tableA.filter(a => data.tableB.some(b => a[data.joinKeyA] === b[data.joinKeyB])).length
    };
  }, [data]);

  if (!data || !visual) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="h-12 w-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
        <p className="text-gray-400">Loading visualization...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-12 py-12 bg-zinc-900/30 rounded-3xl border border-white/5 w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-center gap-12 relative h-48">
        {/* Left Circle */}
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-48 h-48 rounded-full border-4 border-blue-500/50 bg-blue-500/10 flex items-center justify-center relative z-10"
        >
          <div className="text-center">
            <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Left Table</div>
            <div className="text-lg font-bold text-white">{visual.leftTable}</div>
          </div>
        </motion.div>

        {/* Right Circle */}
        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-48 h-48 rounded-full border-4 border-purple-500/50 bg-purple-500/10 flex items-center justify-center -ml-16 relative z-0"
        >
          <div className="text-center pl-8">
            <div className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1">Right Table</div>
            <div className="text-lg font-bold text-white">{visual.rightTable}</div>
          </div>
        </motion.div>

        {/* Intersection Highlight */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <div className="w-16 h-32 bg-yellow-500/20 blur-xl rounded-full flex items-center justify-center">
             {visual.matches !== undefined && visual.matches > 0 && (
               <div className="text-[10px] font-bold text-yellow-500 bg-zinc-950/80 px-2 py-1 rounded-full border border-yellow-500/20 whitespace-nowrap">
                 {visual.matches} Matches Found
               </div>
             )}
           </div>
        </div>
      </div>

      {/* Row Matching Visualization */}
      <div className="w-full px-12 grid grid-cols-3 gap-8 items-center">
        <div className="space-y-2">
          {visual.leftRows?.map((row: any, i: number) => (
            <motion.div 
              key={`left-${i}`}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="p-2 bg-blue-500/5 border border-blue-500/20 rounded text-[10px] font-mono text-blue-300 truncate"
            >
              {JSON.stringify(row)}
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="h-px w-full bg-gradient-to-r from-blue-500/50 via-yellow-500/50 to-purple-500/50" />
          <div className="px-3 py-1 bg-zinc-800 rounded-full border border-white/10 text-[10px] font-mono text-yellow-400">
            {visual.matchingKeys?.join(' = ')}
          </div>
          <div className="h-px w-full bg-gradient-to-r from-blue-500/50 via-yellow-500/50 to-purple-500/50" />
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-2">
            {visual.joinType} JOIN
          </div>
        </div>

        <div className="space-y-2">
          {visual.rightRows?.map((row: any, i: number) => (
            <motion.div 
              key={`right-${i}`}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="p-2 bg-purple-500/5 border border-purple-500/20 rounded text-[10px] font-mono text-purple-300 truncate text-right"
            >
              {JSON.stringify(row)}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
