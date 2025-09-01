'use client';

import React from 'react';
import { Plus, X, Trash } from 'lucide-react';

interface TableData {
  headers: string[];
  rows: string[][];
  columnTypes: string[];
  styling: {
    headerBg: string;
    alternatingRows: boolean;
    borders: boolean;
    compact: boolean;
  };
}

interface AdvancedTableEditorProps {
  tableData: TableData;
  isEditing: boolean;
  onUpdate: (newTableData: TableData) => void;
}

export const AdvancedTableEditor: React.FC<AdvancedTableEditorProps> = ({
  tableData,
  isEditing,
  onUpdate
}) => {
  const addRow = () => {
    const newTableData = {
      ...tableData,
      rows: [...tableData.rows, new Array(tableData.headers.length).fill('')]
    };
    onUpdate(newTableData);
  };

  const addColumn = () => {
    const newTableData = {
      ...tableData,
      headers: [...tableData.headers, `Column ${tableData.headers.length + 1}`],
      rows: tableData.rows.map(row => [...row, '']),
      columnTypes: [...tableData.columnTypes, 'text']
    };
    onUpdate(newTableData);
  };

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    const newTableData = {
      ...tableData,
      rows: tableData.rows.map((row, rIdx) => 
        rIdx === rowIndex 
          ? row.map((cell, cIdx) => cIdx === colIndex ? value : cell)
          : row
      )
    };
    onUpdate(newTableData);
  };

  const updateHeader = (colIndex: number, value: string) => {
    const newTableData = {
      ...tableData,
      headers: tableData.headers.map((header, hIdx) => 
        hIdx === colIndex ? value : header
      )
    };
    onUpdate(newTableData);
  };

  const deleteRow = (rowIndex: number) => {
    if (tableData.rows.length > 1) {
      const newTableData = {
        ...tableData,
        rows: tableData.rows.filter((_, idx) => idx !== rowIndex)
      };
      onUpdate(newTableData);
    }
  };

  const deleteColumn = (colIndex: number) => {
    if (tableData.headers.length > 1) {
      const newTableData = {
        ...tableData,
        headers: tableData.headers.filter((_, idx) => idx !== colIndex),
        rows: tableData.rows.map(row => row.filter((_, idx) => idx !== colIndex)),
        columnTypes: tableData.columnTypes.filter((_, idx) => idx !== colIndex)
      };
      onUpdate(newTableData);
    }
  };

  if (isEditing) {
    return (
      <div className="border border-gray-600 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: tableData.styling.headerBg }}>
                {tableData.headers.map((header, colIndex) => (
                  <th key={colIndex} className="relative group">
                    <input
                      type="text"
                      value={header}
                      onChange={(e) => updateHeader(colIndex, e.target.value)}
                      className="w-full p-2 bg-transparent text-white font-semibold border-none outline-none"
                      placeholder="Column header"
                    />
                    <button
                      onClick={() => deleteColumn(colIndex)}
                      className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300"
                      title="Delete column"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </th>
                ))}
                <th className="p-2">
                  <button
                    onClick={addColumn}
                    className="text-gray-400 hover:text-white"
                    title="Add column"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {tableData.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className={`group ${rowIndex % 2 === 1 && tableData.styling.alternatingRows ? 'bg-gray-800' : ''}`}>
                  {row.map((cell, colIndex) => (
                    <td key={colIndex} className="relative">
                      <input
                        type="text"
                        value={cell}
                        onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                        className="w-full p-2 bg-transparent text-gray-300 border-none outline-none focus:bg-gray-700"
                        placeholder="Enter data"
                      />
                    </td>
                  ))}
                  <td className="p-2">
                    <button
                      onClick={() => deleteRow(rowIndex)}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300"
                      title="Delete row"
                    >
                      <Trash className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-2 border-t border-gray-600 flex justify-between">
          <button
            onClick={addRow}
            className="flex items-center space-x-1 px-2 py-1 text-sm text-gray-400 hover:text-white"
          >
            <Plus className="w-3 h-3" />
            <span>Add row</span>
          </button>
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <span>{tableData.rows.length} rows × {tableData.headers.length} columns</span>
          </div>
        </div>
      </div>
    );
  }

  // Display mode
  return (
    <div className="border border-gray-600 rounded-lg overflow-hidden">
      <table className="w-full">
        <thead>
          <tr style={{ backgroundColor: tableData.styling?.headerBg || '#374151' }}>
            {tableData.headers.map((header, idx) => (
              <th key={idx} className="p-2 text-left font-semibold text-white border-r border-gray-600 last:border-r-0">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tableData.rows.map((row, rowIdx) => (
            <tr key={rowIdx} className={`${rowIdx % 2 === 1 && tableData.styling?.alternatingRows ? 'bg-gray-800' : ''}`}>
              {row.map((cell, cellIdx) => (
                <td key={cellIdx} className="p-2 text-gray-300 border-r border-gray-600 last:border-r-0 border-b border-gray-700">
                  {cell || <span className="text-gray-500">Empty</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="p-2 bg-gray-800 text-xs text-gray-400 text-center">
        {tableData.rows.length} rows × {tableData.headers.length} columns
      </div>
    </div>
  );
};