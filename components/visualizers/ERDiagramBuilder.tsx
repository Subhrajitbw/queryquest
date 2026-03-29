'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useStepPlayer } from '@/hooks/useStepPlayer';
import StepControls from '@/components/StepControls';

import { useAppStore } from '@/lib/store';

type TableNode = {
  id: string;
  name: string;
  x: number;
  y: number;
  columns: string[];
};

type Link = {
  id: string;
  from: string;
  to: string;
};

const STEPS = [
  {
    title: "Empty Canvas",
    description: "Start with a blank canvas to design your database schema.",
    state: {
      tables: [],
      links: []
    }
  },
  {
    title: "Add Users Table",
    description: "Create a 'users' table to store user information.",
    state: {
      tables: [{ id: 't1', name: 'users', x: 50, y: 50, columns: ['id (PK)', 'name', 'email'] }],
      links: []
    }
  },
  {
    title: "Add Posts Table",
    description: "Create a 'posts' table for user-generated content.",
    state: {
      tables: [
        { id: 't1', name: 'users', x: 50, y: 50, columns: ['id (PK)', 'name', 'email'] },
        { id: 't2', name: 'posts', x: 350, y: 100, columns: ['id (PK)', 'user_id (FK)', 'title'] }
      ],
      links: []
    }
  },
  {
    title: "Create Relationship",
    description: "Link the tables. A user can have many posts (1:N relationship).",
    state: {
      tables: [
        { id: 't1', name: 'users', x: 50, y: 50, columns: ['id (PK)', 'name', 'email'] },
        { id: 't2', name: 'posts', x: 350, y: 100, columns: ['id (PK)', 'user_id (FK)', 'title'] }
      ],
      links: [{ id: 'l1', from: 't1', to: 't2' }]
    }
  }
];

export default function ERDiagramBuilder() {
  const { lastExecutedQuery } = useAppStore();
  const player = useStepPlayer(STEPS, 2000);
  const { currentStepData } = player;
  
  // We sync local state with player state so user can still interact if they want,
  // but player overrides it when stepping.
  const [tables, setTables] = useState<TableNode[]>(currentStepData.state.tables);
  const [links, setLinks] = useState<Link[]>(currentStepData.state.links);

  useEffect(() => {
    setTables(currentStepData.state.tables);
    setLinks(currentStepData.state.links);
  }, [currentStepData]);
  
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [linkingFrom, setLinkingFrom] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (id: string, e: React.PointerEvent) => {
    if (linkingFrom) {
      if (linkingFrom !== id) {
        setLinks([...links, { id: crypto.randomUUID(), from: linkingFrom, to: id }]);
      }
      setLinkingFrom(null);
      return;
    }
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDraggingId(id);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingId || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 75; // offset for center
    const y = e.clientY - rect.top - 50;

    setTables(tables.map(t => t.id === draggingId ? { ...t, x, y } : t));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setDraggingId(null);
    if (e.target instanceof HTMLElement && e.target.hasPointerCapture(e.pointerId)) {
      e.target.releasePointerCapture(e.pointerId);
    }
  };

  const addTable = () => {
    const newId = `t_${crypto.randomUUID()}`;
    setTables([...tables, { id: newId, name: `table_${tables.length + 1}`, x: 100, y: 100, columns: ['id (PK)'] }]);
  };

  const addColumn = (tableId: string) => {
    const columnName = prompt("Enter column name:");
    if (!columnName) return;
    setTables(tables.map(t => t.id === tableId ? { ...t, columns: [...t.columns, columnName] } : t));
  };

  const removeTable = (id: string) => {
    setTables(tables.filter(t => t.id !== id));
    setLinks(links.filter(l => l.from !== id && l.to !== id));
  };

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto p-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white mb-2">{currentStepData.title}</h3>
        <p className="text-gray-400 h-6">{currentStepData.description}</p>
      </div>

      {lastExecutedQuery && (
        <div className="w-full mb-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-xs text-blue-400 uppercase font-bold mb-2 text-left">Current Context</p>
          <div className="text-sm text-gray-300 font-mono text-left break-all">{lastExecutedQuery}</div>
        </div>
      )}

      <div className="flex gap-4 mb-4 w-full justify-between items-center">
        <button onClick={addTable} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors">
          <Plus className="h-4 w-4" /> Add Table
        </button>
        <div className="text-sm text-gray-400 flex items-center px-4 bg-white/5 rounded-md py-2">
          {linkingFrom ? 'Click another table to connect' : 'Click "Link" on a table to connect'}
        </div>
      </div>

      <div 
        ref={containerRef}
        className="w-full h-[500px] glass-card relative overflow-hidden bg-[#050810] border-white/10 touch-none mb-8"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* SVG Links Layer */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {links.map(link => {
            const fromTable = tables.find(t => t.id === link.from);
            const toTable = tables.find(t => t.id === link.to);
            if (!fromTable || !toTable) return null;
            
            // Center points
            const x1 = fromTable.x + 75;
            const y1 = fromTable.y + 50;
            const x2 = toTable.x + 75;
            const y2 = toTable.y + 50;

            return (
              <line 
                key={link.id} 
                x1={x1} y1={y1} x2={x2} y2={y2} 
                stroke="#4b5563" strokeWidth="2" strokeDasharray="5,5"
              />
            );
          })}
        </svg>

        {/* Draggable Tables */}
        {tables.map(table => (
          <div
            key={table.id}
            onPointerDown={(e) => handlePointerDown(table.id, e)}
            className={`absolute w-[150px] bg-gray-900 border-2 rounded-lg shadow-xl select-none cursor-grab active:cursor-grabbing ${
              linkingFrom === table.id ? 'border-blue-500' : 'border-gray-700'
            }`}
            style={{ transform: `translate(${table.x}px, ${table.y}px)` }}
          >
            <div className="bg-gray-800 px-3 py-2 border-b border-gray-700 font-bold text-white flex justify-between items-center rounded-t-md">
              <span className="truncate">{table.name}</span>
              <button 
                onPointerDown={(e) => e.stopPropagation()} 
                onClick={() => removeTable(table.id)}
                className="text-red-400 hover:text-red-300 p-1"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
            <div className="p-2 text-xs text-gray-400 space-y-1">
              {table.columns.map((col, i) => (
                <div key={i} className="truncate">{col}</div>
              ))}
              <button 
                onClick={() => addColumn(table.id)}
                className="w-full text-left text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> Add Column
              </button>
            </div>
            <div className="bg-gray-800/50 p-1 flex justify-center border-t border-gray-700 rounded-b-md">
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setLinkingFrom(linkingFrom === table.id ? null : table.id)}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium px-2 py-1"
              >
                {linkingFrom === table.id ? 'Cancel' : 'Link'}
              </button>
            </div>
          </div>
        ))}
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
