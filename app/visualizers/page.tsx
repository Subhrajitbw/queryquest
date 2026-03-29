'use client';

import { useState } from 'react';
import ERDiagramBuilder from '@/components/visualizers/ERDiagramBuilder';
import SecurityVisualizer from '@/components/visualizers/SecurityVisualizer';
import StorageVisualizer from '@/components/visualizers/StorageVisualizer';

const REPRESENTATIONS = [
  { id: 'er', label: 'ER Diagram', component: ERDiagramBuilder },
  { id: 'security', label: 'Security', component: SecurityVisualizer },
  { id: 'storage', label: 'Storage', component: StorageVisualizer },
] as const;

export default function VisualizersPage() {
  const [activeTab, setActiveTab] = useState<(typeof REPRESENTATIONS)[number]['id']>('er');
  const ActiveComponent =
    REPRESENTATIONS.find((item) => item.id === activeTab)?.component ?? ERDiagramBuilder;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Database Representations</h1>
        <p className="text-gray-400">Stable views of schema, security patterns, and storage concepts.</p>
      </div>

      <div className="mb-8 flex flex-wrap justify-center gap-2">
        {REPRESENTATIONS.map((tab) => (
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

      <div className="flex-1 w-full relative">
        <ActiveComponent />
      </div>
    </div>
  );
}
