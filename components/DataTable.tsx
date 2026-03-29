'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface ColumnDef {
  header: string;
  accessorKey: string;
}

export interface DataTableProps {
  columns: ColumnDef[];
  data: any[];
  activeRowIndices?: number[];
  activeColIndices?: number[];
  highlightedCells?: { rowIndex: number; colIndex: number; color?: string }[];
  updatedCells?: { rowIndex: number; colIndex: number; previousValue: any }[];
  deletedRowIndices?: number[];
  insertedRowIndices?: number[];
  fadedRowIndices?: number[];
  className?: string;
  title?: string;
}

export default function DataTable({
  columns,
  data,
  activeRowIndices = [],
  activeColIndices = [],
  highlightedCells = [],
  updatedCells = [],
  deletedRowIndices = [],
  insertedRowIndices = [],
  fadedRowIndices = [],
  className = '',
  title,
}: DataTableProps) {
  return (
    <div className={`flex flex-col overflow-hidden rounded-xl border border-gray-800 bg-gray-900/50 ${className}`}>
      {title && (
        <div className="bg-gray-800/80 px-4 py-2 border-b border-gray-700">
          <h3 className="text-sm font-semibold text-gray-200">{title}</h3>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-300">
          <thead className="text-xs text-gray-400 uppercase bg-gray-800/50">
            <tr>
              {columns.map((col, colIndex) => {
                const isActiveCol = activeColIndices.includes(colIndex);
                return (
                  <th
                    key={col.accessorKey}
                    className={`px-4 py-3 font-medium transition-colors ${
                      isActiveCol ? 'bg-blue-500/20 text-blue-300' : ''
                    }`}
                  >
                    {col.header}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {data.map((row, rowIndex) => {
                const isActiveRow = activeRowIndices.includes(rowIndex);
                const isDeleted = deletedRowIndices.includes(rowIndex);
                const isInserted = insertedRowIndices.includes(rowIndex);
                const isFaded = fadedRowIndices.includes(rowIndex);

                return (
                  <motion.tr
                    key={row.id || rowIndex}
                    initial={isInserted ? { opacity: 0, backgroundColor: 'rgba(34, 197, 94, 0.2)' } : false}
                    animate={{
                      opacity: isDeleted ? 0.3 : isFaded ? 0.1 : 1,
                      backgroundColor: isDeleted
                        ? 'rgba(239, 68, 68, 0.1)'
                        : isActiveRow
                        ? 'rgba(59, 130, 246, 0.1)'
                        : 'transparent',
                    }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`border-b border-gray-800/50 transition-colors ${
                      isActiveRow ? 'border-blue-500/30' : 'hover:bg-gray-800/30'
                    }`}
                  >
                    {columns.map((col, colIndex) => {
                      const isActiveCol = activeColIndices.includes(colIndex);
                      const highlightedCell = highlightedCells.find(
                        (c) => c.rowIndex === rowIndex && c.colIndex === colIndex
                      );
                      const updatedCell = updatedCells.find(
                        (c) => c.rowIndex === rowIndex && c.colIndex === colIndex
                      );

                      let cellBg = 'transparent';
                      if (highlightedCell) {
                        cellBg = highlightedCell.color || 'rgba(59, 130, 246, 0.2)';
                      } else if (isActiveCol) {
                        cellBg = 'rgba(59, 130, 246, 0.05)';
                      }

                      return (
                        <motion.td
                          key={`${rowIndex}-${colIndex}`}
                          animate={{ backgroundColor: cellBg }}
                          className={`px-4 py-3 relative ${
                            isDeleted ? 'line-through text-gray-500' : ''
                          }`}
                        >
                          {updatedCell ? (
                            <div className="flex flex-col">
                              <span className="text-xs text-red-400 line-through opacity-70">
                                {String(updatedCell.previousValue)}
                              </span>
                              <motion.span
                                initial={{ color: '#4ade80', y: 5 }}
                                animate={{ color: '#d1d5db', y: 0 }}
                                transition={{ duration: 0.5 }}
                              >
                                {String(row[col.accessorKey])}
                              </motion.span>
                            </div>
                          ) : (
                            <span>{row[col.accessorKey] !== undefined ? String(row[col.accessorKey]) : ''}</span>
                          )}
                        </motion.td>
                      );
                    })}
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
        {data.length === 0 && (
          <div className="p-4 text-center text-gray-500 italic">No data available</div>
        )}
      </div>
    </div>
  );
}
