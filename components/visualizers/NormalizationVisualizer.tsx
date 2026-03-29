'use client';

import React from 'react';
import { useStepPlayer } from '@/hooks/useStepPlayer';
import StepControls from '@/components/StepControls';
import DataTable from '../DataTable';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

import { useAppStore } from '@/lib/store';

const STEPS = [
  {
    title: 'Unnormalized Form (UNF)',
    description: 'Data contains repeating groups (arrays/lists within a single cell). This makes querying and updating very difficult.',
    state: {
      step: 'UNF',
      tables: [
        {
          name: 'Orders_UNF',
          columns: [
            { header: 'OrderID', accessorKey: 'orderId' },
            { header: 'Customer', accessorKey: 'customer' },
            { header: 'Items (ID, Name, Qty)', accessorKey: 'items' },
          ],
          data: [
            { orderId: 1, customer: 'C1 (Alice, NY)', items: '[I1, Apple, 2], [I2, Banana, 1]' },
            { orderId: 2, customer: 'C2 (Bob, LA)', items: '[I1, Apple, 3]' },
          ],
          highlightedCells: [
            { rowIndex: 0, colIndex: 2, color: 'rgba(239, 68, 68, 0.2)' },
            { rowIndex: 1, colIndex: 2, color: 'rgba(239, 68, 68, 0.2)' },
          ]
        }
      ],
      anomaly: 'Cannot easily query how many Apples were sold in total.',
    }
  },
  {
    title: 'First Normal Form (1NF)',
    description: 'Rule: Eliminate repeating groups. Ensure all attributes are atomic. Primary Key is now (OrderID, ItemID).',
    state: {
      step: '1NF',
      tables: [
        {
          name: 'Orders_1NF',
          columns: [
            { header: 'OrderID (PK)', accessorKey: 'orderId' },
            { header: 'ItemID (PK)', accessorKey: 'itemId' },
            { header: 'ItemName', accessorKey: 'itemName' },
            { header: 'Qty', accessorKey: 'qty' },
            { header: 'CustID', accessorKey: 'custId' },
            { header: 'CustName', accessorKey: 'custName' },
            { header: 'CustCity', accessorKey: 'custCity' },
          ],
          data: [
            { orderId: 1, itemId: 'I1', itemName: 'Apple', qty: 2, custId: 'C1', custName: 'Alice', custCity: 'NY' },
            { orderId: 1, itemId: 'I2', itemName: 'Banana', qty: 1, custId: 'C1', custName: 'Alice', custCity: 'NY' },
            { orderId: 2, itemId: 'I1', itemName: 'Apple', qty: 3, custId: 'C2', custName: 'Bob', custCity: 'LA' },
          ],
          highlightedCells: [
            { rowIndex: 0, colIndex: 4, color: 'rgba(234, 179, 8, 0.2)' },
            { rowIndex: 1, colIndex: 4, color: 'rgba(234, 179, 8, 0.2)' },
            { rowIndex: 0, colIndex: 2, color: 'rgba(59, 130, 246, 0.2)' },
            { rowIndex: 2, colIndex: 2, color: 'rgba(59, 130, 246, 0.2)' },
          ]
        }
      ],
      anomaly: 'Update Anomaly: If Alice moves to SF, we must update multiple rows. Partial Dependencies exist.',
    }
  },
  {
    title: 'Second Normal Form (2NF)',
    description: 'Rule: 1NF + Remove Partial Dependencies. Non-key attributes must depend on the ENTIRE primary key, not just part of it.',
    state: {
      step: '2NF',
      tables: [
        {
          name: 'Orders',
          columns: [
            { header: 'OrderID (PK)', accessorKey: 'orderId' },
            { header: 'CustID', accessorKey: 'custId' },
            { header: 'CustName', accessorKey: 'custName' },
            { header: 'CustCity', accessorKey: 'custCity' },
          ],
          data: [
            { orderId: 1, custId: 'C1', custName: 'Alice', custCity: 'NY' },
            { orderId: 2, custId: 'C2', custName: 'Bob', custCity: 'LA' },
          ],
        },
        {
          name: 'Items',
          columns: [
            { header: 'ItemID (PK)', accessorKey: 'itemId' },
            { header: 'ItemName', accessorKey: 'itemName' },
          ],
          data: [
            { itemId: 'I1', itemName: 'Apple' },
            { itemId: 'I2', itemName: 'Banana' },
          ],
        },
        {
          name: 'Order_Items',
          columns: [
            { header: 'OrderID (PK)', accessorKey: 'orderId' },
            { header: 'ItemID (PK)', accessorKey: 'itemId' },
            { header: 'Qty', accessorKey: 'qty' },
          ],
          data: [
            { orderId: 1, itemId: 'I1', qty: 2 },
            { orderId: 1, itemId: 'I2', qty: 1 },
            { orderId: 2, itemId: 'I1', qty: 3 },
          ],
        }
      ],
      anomaly: 'Transitive Dependency: In Orders, CustName depends on CustID, which depends on OrderID.',
    }
  },
  {
    title: 'Third Normal Form (3NF)',
    description: 'Rule: 2NF + Remove Transitive Dependencies. Non-key attributes must depend ONLY on the primary key.',
    state: {
      step: '3NF',
      tables: [
        {
          name: 'Orders',
          columns: [
            { header: 'OrderID (PK)', accessorKey: 'orderId' },
            { header: 'CustID (FK)', accessorKey: 'custId' },
          ],
          data: [
            { orderId: 1, custId: 'C1' },
            { orderId: 2, custId: 'C2' },
          ],
        },
        {
          name: 'Customers',
          columns: [
            { header: 'CustID (PK)', accessorKey: 'custId' },
            { header: 'CustName', accessorKey: 'custName' },
            { header: 'CustCity', accessorKey: 'custCity' },
          ],
          data: [
            { custId: 'C1', custName: 'Alice', custCity: 'NY' },
            { custId: 'C2', custName: 'Bob', custCity: 'LA' },
          ],
        },
        {
          name: 'Items',
          columns: [
            { header: 'ItemID (PK)', accessorKey: 'itemId' },
            { header: 'ItemName', accessorKey: 'itemName' },
          ],
          data: [
            { itemId: 'I1', itemName: 'Apple' },
            { itemId: 'I2', itemName: 'Banana' },
          ],
        },
        {
          name: 'Order_Items',
          columns: [
            { header: 'OrderID (PK)', accessorKey: 'orderId' },
            { header: 'ItemID (PK)', accessorKey: 'itemId' },
            { header: 'Qty', accessorKey: 'qty' },
          ],
          data: [
            { orderId: 1, itemId: 'I1', qty: 2 },
            { orderId: 1, itemId: 'I2', qty: 1 },
            { orderId: 2, itemId: 'I1', qty: 3 },
          ],
        }
      ],
      anomaly: 'The database is now in 3NF. But what about BCNF?',
    }
  },
  {
    title: 'Boyce-Codd Normal Form (BCNF) - The Problem',
    description: 'Consider a new table: Advising. A student has one advisor per major. An advisor only advises one major. PK: (StudentID, Major).',
    state: {
      step: 'BCNF_Prob',
      tables: [
        {
          name: 'Advising (in 3NF, but not BCNF)',
          columns: [
            { header: 'StudentID (PK)', accessorKey: 'studentId' },
            { header: 'Major (PK)', accessorKey: 'major' },
            { header: 'Advisor', accessorKey: 'advisor' },
          ],
          data: [
            { studentId: 'S1', major: 'Math', advisor: 'Prof. A' },
            { studentId: 'S2', major: 'Math', advisor: 'Prof. A' },
            { studentId: 'S1', major: 'Physics', advisor: 'Prof. B' },
          ],
          highlightedCells: [
            { rowIndex: 0, colIndex: 2, color: 'rgba(239, 68, 68, 0.2)' },
            { rowIndex: 1, colIndex: 2, color: 'rgba(239, 68, 68, 0.2)' },
          ]
        }
      ],
      anomaly: 'Anomaly: Advisor -> Major (Prof. A always advises Math). But Advisor is NOT a candidate key. This violates BCNF.',
    }
  },
  {
    title: 'Boyce-Codd Normal Form (BCNF) - The Solution',
    description: 'Rule: 3NF + Every determinant must be a candidate key. We split the table to make Advisor a candidate key.',
    state: {
      step: 'BCNF_Sol',
      tables: [
        {
          name: 'Student_Advisor',
          columns: [
            { header: 'StudentID (PK)', accessorKey: 'studentId' },
            { header: 'Advisor (PK)', accessorKey: 'advisor' },
          ],
          data: [
            { studentId: 'S1', advisor: 'Prof. A' },
            { studentId: 'S2', advisor: 'Prof. A' },
            { studentId: 'S1', advisor: 'Prof. B' },
          ],
        },
        {
          name: 'Advisor_Major',
          columns: [
            { header: 'Advisor (PK)', accessorKey: 'advisor' },
            { header: 'Major', accessorKey: 'major' },
          ],
          data: [
            { advisor: 'Prof. A', major: 'Math' },
            { advisor: 'Prof. B', major: 'Physics' },
          ],
        }
      ],
      anomaly: 'Fully Normalized! No anomalies remain.',
    }
  }
];

export default function NormalizationVisualizer() {
  const { lastExecutedQuery } = useAppStore();
  const player = useStepPlayer(STEPS, 4000);
  const { currentStepData } = player;
  const state = currentStepData.state;

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-1">{currentStepData.title}</h3>
        <p className="text-gray-400 text-sm">{currentStepData.description}</p>
      </div>

      {lastExecutedQuery && (
        <div className="w-full p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-xs text-blue-400 uppercase font-bold mb-2 text-left">Current Context</p>
          <div className="text-sm text-gray-300 font-mono text-left break-all">{lastExecutedQuery}</div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[400px]">
        <AnimatePresence mode="popLayout">
          {state.tables.map((table: any, index: number) => (
            <motion.div
              key={`${state.step}-${table.name}`}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className={state.tables.length === 1 ? 'md:col-span-2 max-w-3xl mx-auto w-full' : ''}
            >
              <DataTable
                title={table.name}
                columns={table.columns}
                data={table.data}
                highlightedCells={table.highlightedCells || []}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {state.anomaly && (
        <motion.div 
          key={state.anomaly}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl border flex items-center gap-3 ${
            state.anomaly.includes('Fully Normalized') 
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
          }`}
        >
          {state.anomaly.includes('Fully Normalized') ? <CheckCircle className="h-6 w-6 shrink-0" /> : <AlertTriangle className="h-6 w-6 shrink-0" />}
          <p className="font-medium text-sm">{state.anomaly}</p>
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
