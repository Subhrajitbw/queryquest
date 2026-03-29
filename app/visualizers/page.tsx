'use client';

import { useState } from 'react';
import QueryPipeline from '@/components/visualizers/QueryPipeline';
import QueryVisualizer from '@/components/visualizers/QueryVisualizer';
import JoinVisualizer from '@/components/visualizers/JoinVisualizer';
import TransactionVisualizer from '@/components/visualizers/TransactionVisualizer';
import BTreeVisualizer from '@/components/visualizers/BTreeVisualizer';
import NormalizationVisualizer from '@/components/visualizers/NormalizationVisualizer';
import ERDiagramBuilder from '@/components/visualizers/ERDiagramBuilder';
import ConcurrencyVisualizer from '@/components/visualizers/ConcurrencyVisualizer';
import StorageVisualizer from '@/components/visualizers/StorageVisualizer';
import SecurityVisualizer from '@/components/visualizers/SecurityVisualizer';

const VISUALIZERS = [
  { id: 'query', label: 'Dynamic Query', component: QueryVisualizer },
  { id: 'pipeline', label: 'Query Pipeline', component: QueryPipeline },
  { id: 'join', label: 'JOIN Visualizer', component: JoinVisualizer },
  { id: 'transaction', label: 'Transactions', component: TransactionVisualizer },
  { id: 'btree', label: 'B-Tree Index', component: BTreeVisualizer },
  { id: 'normalization', label: 'Normalization', component: NormalizationVisualizer },
  { id: 'er', label: 'ER Diagram', component: ERDiagramBuilder },
  { id: 'concurrency', label: 'Concurrency & ACID', component: ConcurrencyVisualizer },
  { id: 'storage', label: 'Data Storage', component: StorageVisualizer },
  { id: 'security', label: 'Database Security', component: SecurityVisualizer },
];

export default function VisualizersPage() {
  const [activeTab, setActiveTab] = useState(VISUALIZERS[0].id);

  const ActiveComponent = VISUALIZERS.find(v => v.id === activeTab)?.component || QueryVisualizer;

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto py-8 px-4 min-h-[calc(100vh-4rem)]">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Interactive SQL Visualizers</h1>
        <p className="text-gray-400">Understand complex database concepts through interactive animations.</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {VISUALIZERS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-full font-medium transition-all text-sm ${
              activeTab === tab.id 
                ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]' 
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 w-full relative">
        <ActiveComponent />
      </div>
    </div>
  );
}
