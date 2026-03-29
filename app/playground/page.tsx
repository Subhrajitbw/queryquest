'use client';

import { useState, useEffect } from 'react';
import { 
  Play, 
  Database, 
  Table as TableIcon, 
  History, 
  ChevronRight, 
  ChevronDown, 
  Zap, 
  TerminalSquare,
  CheckCircle
} from 'lucide-react';
import { getSchema } from '@/lib/db';
import SqlEditor from '@/components/SqlEditor';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '@/lib/store';
import DataTable from '@/components/DataTable';
import { buildExecutionSteps, executeQuery, ExecutionStep } from '@/lib/executionEngine';
import ExecutionModal from '@/components/visualizers/ExecutionModal';

interface SchemaTable {
  table: string;
  columns: { name: string; type: string }[];
}

interface QueryHistory {
  query: string;
  timestamp: number;
}

export default function PlaygroundPage() {
  const { addBadge, setLastExecutedQuery, setLastExecution, lastExecutedQuery } = useAppStore();
  const [query, setQuery] = useState(lastExecutedQuery || 'SELECT * FROM customers LIMIT 5;');
  const [result, setResult] = useState<{ columns: string[], values: any[][] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [schema, setSchema] = useState<SchemaTable[]>([]);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<QueryHistory[]>([]);
  
  // Visualization State
  const [steps, setSteps] = useState<ExecutionStep[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Persistence: Update store when query changes
  const handleQueryChange = (val: string) => {
    setQuery(val);
    setLastExecutedQuery(val);
  };

  // Load schema and history on mount
  useEffect(() => {
    const loadData = async () => {
      const s = await getSchema();
      setSchema(s);
      
      const savedHistory = localStorage.getItem('queryquest-history');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }

      // Sync persisted query if available
      if (lastExecutedQuery) {
        setQuery(lastExecutedQuery);
      }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveToHistory = (q: string) => {
    const newHistory = [{ query: q, timestamp: Date.now() }, ...history.filter(h => h.query !== q)].slice(0, 10);
    setHistory(newHistory);
    localStorage.setItem('queryquest-history', JSON.stringify(newHistory));
  };

  const handleRunQuery = async () => {
    if (!query.trim()) return;
    setIsExecuting(true);
    setError(null);
    setSteps([]);

    try {
      const executionResult = await executeQuery(query);
      if (!executionResult.success) {
        throw new Error(executionResult.error || 'An error occurred while executing the query.');
      }

      const res = {
        columns: executionResult.columns,
        values: executionResult.rows.map((row) => executionResult.columns.map((column) => row[column])),
      };
      setResult(res);
      saveToHistory(query);
      setLastExecutedQuery(query);
      
      addBadge('first_query');
      if (query.toUpperCase().includes('JOIN')) {
        addBadge('first_join');
      }

      const generatedSteps = await buildExecutionSteps(query);
      setSteps(generatedSteps);
      setLastExecution(query, executionResult, generatedSteps);
      if (generatedSteps.length > 0) {
        setIsModalOpen(true);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while executing the query.');
      setResult(null);
    } finally {
      setIsExecuting(false);
    }
  };

  const toggleTable = (tableName: string) => {
    const newExpanded = new Set(expandedTables);
    if (newExpanded.has(tableName)) {
      newExpanded.delete(tableName);
    } else {
      newExpanded.add(tableName);
    }
    setExpandedTables(newExpanded);
  };

  const loadChallenge = () => {
    const challenges = [
      "SELECT name, price FROM products WHERE price > 100 ORDER BY price DESC;",
      "SELECT c.name, o.id FROM customers c JOIN orders o ON c.id = o.customer_id;",
      "SELECT category, COUNT(*) as count FROM products GROUP BY category;"
    ];
    const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)];
    setQuery(randomChallenge);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[calc(100vh-8rem)]">
      {/* Left Sidebar: Schema & History */}
      <div className="lg:col-span-1 flex flex-col gap-4 h-full overflow-hidden">
        <div className="glass-card flex-1 flex flex-col overflow-hidden">
          <div className="border-b border-white/10 bg-white/5 px-4 py-3 font-medium text-gray-300 flex items-center gap-2">
            <Database className="h-4 w-4 text-blue-400" />
            Schema
          </div>
          <div className="flex-1 overflow-y-auto p-2 text-sm text-gray-300">
            {schema.map((s) => (
              <div key={s.table} className="mb-1">
                <button 
                  onClick={() => toggleTable(s.table)}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 hover:bg-white/5 transition-colors"
                >
                  {expandedTables.has(s.table) ? (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  )}
                  <TableIcon className="h-4 w-4 text-blue-400" />
                  <span className="font-medium">{s.table}</span>
                </button>
                <AnimatePresence>
                  {expandedTables.has(s.table) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pl-8 pr-2 py-1 space-y-1">
                        {s.columns.map(col => (
                          <div key={col.name} className="flex justify-between text-xs">
                            <span className="text-gray-400">{col.name}</span>
                            <span className="text-blue-500/70 font-mono">{col.type}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card flex-1 flex flex-col overflow-hidden">
          <div className="border-b border-white/10 bg-white/5 px-4 py-3 font-medium text-gray-300 flex items-center gap-2">
            <History className="h-4 w-4 text-purple-400" />
            History
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {history.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">No query history yet.</div>
            ) : (
              <div className="space-y-1">
                {history.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => setQuery(h.query)}
                    className="w-full text-left rounded px-3 py-2 text-xs text-gray-400 hover:bg-white/5 hover:text-gray-200 transition-colors truncate font-mono"
                    title={h.query}
                  >
                    {h.query}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Area: Editor, Results, Visualization */}
      <div className="lg:col-span-3 flex flex-col gap-6 h-full">
        <div className="flex flex-col gap-1 mb-2">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <TerminalSquare className="h-6 w-6 text-blue-500" />
            SQL PLAYGROUND
          </h1>
          <p className="text-gray-400 text-sm flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wider">Trial & Error</span>
            Free exploration sandbox. Experiment with queries and visualize execution.
          </p>
        </div>

        {/* TOP: Editor Section */}
        <div className="glass-card flex flex-col overflow-hidden border-blue-500/20 shrink-0">
          <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 font-medium text-gray-300">
                <TerminalSquare className="h-4 w-4 text-blue-400" />
                SQL Editor
              </div>
              <button
                onClick={loadChallenge}
                className="flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-500 hover:bg-yellow-500/20 transition-colors"
              >
                <Zap className="h-3 w-3" />
                Challenge Me
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 hidden sm:inline-block">Ctrl + Enter to run</span>
              <button
                onClick={handleRunQuery}
                disabled={isExecuting}
                className="flex items-center gap-2 rounded bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)]"
              >
                <Play className="h-4 w-4" />
                Run Query
              </button>
            </div>
          </div>
          <div className="h-48 relative">
            <SqlEditor value={query} onChange={handleQueryChange} onRun={handleRunQuery} />
          </div>
        </div>

        {/* BOTTOM: Results Section */}
        <div className="flex flex-col gap-6 overflow-y-auto pb-8 pr-2">
          <div className="glass-card flex flex-col overflow-hidden">
            <div className="border-b border-white/10 bg-white/5 px-4 py-3 font-medium text-gray-300 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                Query Results
              </div>
              {result && result.columns.length > 0 && (
                <span className="text-xs text-gray-500">{result.values.length} rows</span>
              )}
            </div>
            <div className="min-h-[200px] bg-[#050810]">
              {error && (
                <div className="m-4 rounded-md bg-red-500/10 border border-red-500/20 p-4 text-red-400 font-mono text-sm">
                  {error}
                </div>
              )}
              
              {result && result.columns.length > 0 && (
                <DataTable
                  columns={result.columns.map(col => ({ header: col, accessorKey: col }))}
                  data={result.values.map(row => {
                    const rowData: any = {};
                    result.columns.forEach((col, i) => {
                      rowData[col] = row[i];
                    });
                    return rowData;
                  })}
                />
              )}
              
              {result && result.columns.length === 0 && !error && (
                <div className="flex h-32 items-center justify-center text-gray-500">
                  Query executed successfully. No results to display.
                </div>
              )}
              
              {!result && !error && !isExecuting && (
                <div className="flex h-32 items-center justify-center text-gray-500 italic">
                  Run a query to see the output and visualization.
                </div>
              )}
 
              {isExecuting && (
                <div className="flex h-32 items-center justify-center">
                  <div className="h-8 w-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* EXECUTION MODAL */}
        <ExecutionModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          steps={steps}
          query={query}
        />
      </div>
    </div>
  );
}
