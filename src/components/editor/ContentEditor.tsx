'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Edit3, Save, X, Trash2, GripVertical, Plus, Minus, Check, ChevronDown, 
  ChevronRight, Upload, Link, ExternalLink, MoreHorizontal, Trash, Copy, Paperclip
} from 'lucide-react';
import { ContentBlock, BlockType, PageItem } from '@/types';
import { useWorkspace } from '@/context/WorkspaceContext';

interface ContentEditorProps {
  block: ContentBlock;
  pageId: string;
  onUpdate: (blockId: string, content: string, metadata?: any) => void;
  onDelete: (blockId: string) => void;
  onDuplicate?: (blockId: string) => void;
  onReorder?: (draggedBlockId: string, targetBlockId: string, position: 'before' | 'after') => void;
  isDragOver?: boolean;
  dragPosition?: 'before' | 'after' | null;
}

interface TableData {
  headers: string[];
  rows: string[][];
  columnTypes?: string[];
  styling?: {
    headerBg: string;
    alternatingRows: boolean;
    borders: boolean;
    compact: boolean;
  };
}

interface ListItem {
  id: string;
  content: string;
  level: number;
  children?: ListItem[];
  isDropdown?: boolean;
  dropdownOptions?: string[];
  selectedOption?: string;
}

interface ChecklistItem {
  id: string;
  content: string;
  checked: boolean;
}

interface ImageData {
  url: string;
  caption: string;
  alt: string;
}

interface PageLink {
  pageId: string;
  pageTitle: string;
  sectionId: string;
  subsectionId?: string;
}

export const ContentEditor: React.FC<ContentEditorProps> = ({
  block,
  pageId,
  onUpdate,
  onDelete,
  onDuplicate,
  onReorder,
  isDragOver = false,
  dragPosition = null
}) => {
  const { state, dispatch } = useWorkspace();
  const [isEditing, setIsEditing] = useState(state.editingBlockId === block.id);
  const [content, setContent] = useState(block.content);
  const [metadata, setMetadata] = useState(block.metadata || {});
  const [showActions, setShowActions] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showPageLinkDialog, setShowPageLinkDialog] = useState<{
    show: boolean; 
    rowIndex?: number; 
    colIndex?: number
  }>({show: false});
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const blockRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get all available pages for linking
  const getAllPages = useCallback(() => {
    if (!state.workspace) return [];
    
    const pages: (PageItem & { sectionTitle: string, subsectionTitle?: string })[] = [];
    
    // Helper function to recursively collect pages
    const addPagesRecursively = (pageList: PageItem[], sectionTitle: string, subsectionTitle?: string) => {
      pageList.forEach(page => {
        pages.push({
          ...page,
          sectionTitle,
          subsectionTitle,
        });
        
        // Check if page has nested pages (children) based on parentId
        const childPages = pageList.filter(p => p.parentId === page.id);
        if (childPages.length > 0) {
          addPagesRecursively(childPages, sectionTitle, subsectionTitle);
        }
      });
    };
    
    state.workspace.sections.forEach(section => {
      // Add section pages
      addPagesRecursively(section.pages, section.title);
      
      // Add subsection pages
      section.subsections?.forEach(subsection => {
        addPagesRecursively(subsection.pages, section.title, subsection.title);
      });
    });
    
    return pages.filter(page => page.id !== pageId);
  }, [state.workspace, pageId]);

  useEffect(() => {
    setIsEditing(state.editingBlockId === block.id);
  }, [state.editingBlockId, block.id]);

  useEffect(() => {
    if (isEditing && textareaRef.current && ['text', 'heading1', 'heading2', 'heading3', 'quote', 'code'].includes(block.type)) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(content.length, content.length);
      autoResizeTextarea();
    }
  }, [isEditing, content]);

  // Use useCallback to prevent unnecessary re-renders
  const handleSave = useCallback(() => {
    onUpdate(block.id, content.trim(), metadata);
    setIsEditing(false);
    dispatch({ type: 'SET_EDITING_BLOCK', payload: null });
  }, [content, metadata, block.id, onUpdate, dispatch]);

  const handleCancel = useCallback(() => {
    setContent(block.content);
    setMetadata(block.metadata || {});
    setIsEditing(false);
    dispatch({ type: 'SET_EDITING_BLOCK', payload: null });
  }, [block.content, block.metadata, dispatch]);

  const startEditing = useCallback(() => {
    setIsEditing(true);
    dispatch({ type: 'SET_EDITING_BLOCK', payload: block.id });
  }, [block.id, dispatch]);

  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && block.type !== 'code') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    autoResizeTextarea();
  };

  // Initialize default data for advanced blocks
  const initializeBlockData = useCallback(() => {
    switch (block.type) {
      case 'table':
      case 'advanced_table':
        if (!metadata.tableData) {
          setMetadata(prev => ({
            ...prev,
            tableData: {
              headers: ['Column 1', 'Column 2', 'Column 3'],
              rows: [['', '', ''], ['', '', ''], ['', '', '']],
              columnTypes: ['text', 'text', 'text'],
              styling: {
                headerBg: '#374151',
                alternatingRows: true,
                borders: true,
                compact: false
              }
            }
          }));
        }
        break;
      case 'nested_list':
        if (!metadata.listItems) {
          setMetadata(prev => ({
            ...prev,
            listItems: [
              { id: `item-${Date.now()}`, content: '', level: 0, children: [] }
            ],
            listType: 'bullet'
          }));
        }
        break;
      case 'checklist':
        if (!metadata.checklistItems) {
          setMetadata(prev => ({
            ...prev,
            checklistItems: [
              { id: `check-${Date.now()}`, content: '', checked: false }
            ]
          }));
        }
        break;
      case 'image':
        if (!metadata.imageData) {
          setMetadata(prev => ({
            ...prev,
            imageData: { url: '', caption: '', alt: '' }
          }));
        }
        break;
    }
  }, [block.type, metadata]);

  // Initialize data when editing starts
  useEffect(() => {
    if (isEditing) {
      initializeBlockData();
    }
  }, [isEditing, initializeBlockData]);

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', block.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const draggedBlockId = e.dataTransfer.getData('text/plain');
    
    if (draggedBlockId !== block.id && onReorder) {
      const rect = blockRef.current?.getBoundingClientRect();
      if (rect) {
        const dropY = e.clientY;
        const blockMiddle = rect.top + rect.height / 2;
        const position = dropY < blockMiddle ? 'before' : 'after';
        onReorder(draggedBlockId, block.id, position);
      }
    }
  };

  // Page linking functions
  const handleCellPageLink = useCallback((rowIndex: number, colIndex: number, pageLink: PageLink) => {
    const tableData: TableData = metadata.tableData || {
      headers: ['Column 1', 'Column 2'],
      rows: [['', ''], ['', '']],
      columnTypes: ['text', 'text'],
      styling: { headerBg: '#374151', alternatingRows: true, borders: true, compact: false }
    };

    // Update cell with page link
    const newTableData = {
      ...tableData,
      rows: tableData.rows.map((row: string[], rIdx: number) => 
        rIdx === rowIndex 
          ? row.map((cell: string, cIdx: number) => cIdx === colIndex ? `🔗 ${pageLink.pageTitle}` : cell)
          : row
      )
    };

    // Store page link in metadata
    const linkKey = `pageLink_${rowIndex}_${colIndex}`;
    setMetadata(prev => ({
      ...prev,
      tableData: newTableData,
      pageLinks: {
        ...prev.pageLinks,
        [linkKey]: pageLink
      }
    }));
  }, [metadata.tableData]);

  const handleCellClick = useCallback((rowIndex: number, colIndex: number, cellValue: string) => {
    // Check if cell contains a page link
    const linkKey = `pageLink_${rowIndex}_${colIndex}`;
    const pageLink = metadata.pageLinks?.[linkKey];
    
    if (pageLink && cellValue.startsWith('🔗')) {
      // Navigate to the linked page
      const allPages = getAllPages();
      const linkedPage = allPages.find(p => p.id === pageLink.pageId);
      if (linkedPage) {
        dispatch({ type: 'SET_CURRENT_PAGE', payload: linkedPage });
      }
    }
  }, [metadata.pageLinks, getAllPages, dispatch]);

  // Table Component with proper functionality
  const TableEditor = () => {
    const tableData: TableData = metadata.tableData || {
      headers: ['Column 1', 'Column 2', 'Column 3'],
      rows: [['', '', ''], ['', '', ''], ['', '', '']],
      columnTypes: ['text', 'text', 'text'],
      styling: { headerBg: '#374151', alternatingRows: true, borders: true, compact: false }
    };

    const updateTableData = (newTableData: TableData) => {
      setMetadata(prev => ({ ...prev, tableData: newTableData }));
    };

    const addRow = () => {
      const newRow = new Array(tableData.headers.length).fill('');
      updateTableData({
        ...tableData,
        rows: [...tableData.rows, newRow]
      });
    };

    const addColumn = () => {
      const newHeaders = [...tableData.headers, `Column ${tableData.headers.length + 1}`];
      const newRows = tableData.rows.map(row => [...row, '']);
      const newColumnTypes = [...(tableData.columnTypes || []), 'text'];
      
      updateTableData({
        ...tableData,
        headers: newHeaders,
        rows: newRows,
        columnTypes: newColumnTypes
      });
    };

    const updateCell = (rowIndex: number, colIndex: number, value: string) => {
      const newRows = [...tableData.rows];
      newRows[rowIndex] = [...newRows[rowIndex]];
      newRows[rowIndex][colIndex] = value;
      
      updateTableData({
        ...tableData,
        rows: newRows
      });
    };

    const updateHeader = (colIndex: number, value: string) => {
      const newHeaders = [...tableData.headers];
      newHeaders[colIndex] = value;
      
      updateTableData({
        ...tableData,
        headers: newHeaders
      });
    };

    const deleteRow = (rowIndex: number) => {
      if (tableData.rows.length > 1) {
        const newRows = tableData.rows.filter((_, idx) => idx !== rowIndex);
        updateTableData({
          ...tableData,
          rows: newRows
        });
      }
    };

    const deleteColumn = (colIndex: number) => {
      if (tableData.headers.length > 1) {
        const newHeaders = tableData.headers.filter((_, idx) => idx !== colIndex);
        const newRows = tableData.rows.map(row => row.filter((_, idx) => idx !== colIndex));
        const newColumnTypes = (tableData.columnTypes || []).filter((_, idx) => idx !== colIndex);
        
        updateTableData({
          ...tableData,
          headers: newHeaders,
          rows: newRows,
          columnTypes: newColumnTypes
        });
      }
    };

    if (isEditing) {
      return (
        <div className="border border-gray-600 rounded-lg overflow-hidden">
          <div className="overflow-x-auto max-h-96">
            <table className="w-full min-w-max">
              <thead>
                <tr style={{ backgroundColor: tableData.styling?.headerBg || '#374151' }}>
                  {tableData.headers.map((header, colIndex) => (
                    <th key={`header-${colIndex}`} className="relative group min-w-32">
                      <input
                        type="text"
                        value={header}
                        onChange={(e) => updateHeader(colIndex, e.target.value)}
                        className="w-full p-3 bg-transparent text-white font-semibold border-none outline-none focus:bg-gray-600 rounded"
                        placeholder="Column header"
                      />
                      <button
                        onClick={() => deleteColumn(colIndex)}
                        className="absolute top-1 right-1 p-1 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 bg-gray-700 rounded"
                        title="Delete column"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </th>
                  ))}
                  <th className="p-3 min-w-12">
                    <button 
                      onClick={addColumn} 
                      className="text-gray-400 hover:text-white hover:bg-gray-600 p-1 rounded"
                      title="Add column"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {tableData.rows.map((row, rowIndex) => (
                  <tr
                    key={`row-${rowIndex}`}
                    className={`group ${rowIndex % 2 === 1 && tableData.styling?.alternatingRows ? 'bg-gray-800' : ''}`}
                  >
                    {row.map((cell, colIndex) => (
                      <td key={`cell-${rowIndex}-${colIndex}`} className="relative">
                        <input
                          type="text"
                          value={cell}
                          onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                          className="w-full p-3 bg-transparent text-gray-300 border-none outline-none focus:bg-gray-700 rounded"
                          placeholder="Enter data"
                        />
                      </td>
                    ))}
                    <td className="p-3">
                      <button
                        onClick={() => deleteRow(rowIndex)}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 p-1 rounded hover:bg-gray-600"
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
          <div className="p-3 border-t border-gray-600 flex justify-between bg-gray-800">
            <button
              onClick={addRow}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded"
            >
              <Plus className="w-3 h-3" />
              <span>Add row</span>
            </button>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span>
                {tableData.rows.length} rows × {tableData.headers.length} columns
              </span>
            </div>
          </div>
        </div>
      );
    }

    // Display mode
    return (
      <div className="border border-gray-600 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: tableData.styling?.headerBg || '#374151' }}>
                {tableData.headers.map((header, idx) => (
                  <th 
                    key={`display-header-${idx}`} 
                    className="p-3 text-left font-semibold text-white border-r border-gray-600 last:border-r-0"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.rows.map((row, rowIdx) => (
                <tr 
                  key={`display-row-${rowIdx}`} 
                  className={`${rowIdx % 2 === 1 && tableData.styling?.alternatingRows ? 'bg-gray-800' : ''} hover:bg-gray-700 transition-colors`}
                >
                  {row.map((cell, cellIdx) => (
                    <td 
                      key={`display-cell-${rowIdx}-${cellIdx}`} 
                      className="p-3 text-gray-300 border-r border-gray-600 last:border-r-0 border-b border-gray-700"
                    >
                      {cell || <span className="text-gray-500 italic">Empty</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {tableData.rows.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            <p>No data in table</p>
          </div>
        )}
      </div>
    );
  };

  // Nested List Component with proper functionality
  const NestedListEditor = () => {
    const listData: ListItem[] = metadata.listItems || [
      { id: `item-${Date.now()}`, content: '', level: 0, children: [] }
    ];
    const listType: 'bullet' | 'numbered' = metadata.listType || 'bullet';

    const updateListData = (newListItems: ListItem[]) => {
      setMetadata(prev => ({ ...prev, listItems: newListItems }));
    };

    const addItem = (afterItemId?: string, level: number = 0) => {
      const newItem: ListItem = { 
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
        content: '', 
        level, 
        children: [] 
      };
      
      let newListItems: ListItem[];
      if (afterItemId) {
        const insertIndex = listData.findIndex(item => item.id === afterItemId) + 1;
        newListItems = [...listData.slice(0, insertIndex), newItem, ...listData.slice(insertIndex)];
      } else {
        newListItems = [...listData, newItem];
      }
      updateListData(newListItems);
    };

    const updateItem = (itemId: string, content: string) => {
      const newListItems = listData.map(item => 
        item.id === itemId ? { ...item, content } : item
      );
      updateListData(newListItems);
    };

    const deleteItem = (itemId: string) => {
      if (listData.length > 1) {
        const newListItems = listData.filter(item => item.id !== itemId);
        updateListData(newListItems);
      }
    };

    const indentItem = (itemId: string) => {
      const newListItems = listData.map(item => 
        item.id === itemId ? { ...item, level: Math.min(item.level + 1, 4) } : item
      );
      updateListData(newListItems);
    };

    const unindentItem = (itemId: string) => {
      const newListItems = listData.map(item => 
        item.id === itemId ? { ...item, level: Math.max(item.level - 1, 0) } : item
      );
      updateListData(newListItems);
    };

    const toggleListType = () => {
      const newType = listType === 'bullet' ? 'numbered' : 'bullet';
      setMetadata(prev => ({ ...prev, listType: newType }));
    };

    if (isEditing) {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={toggleListType}
              className="flex items-center space-x-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
            >
              <span>{listType === 'bullet' ? '•' : '1.'}</span>
              <span>{listType === 'bullet' ? 'Bullet' : 'Numbered'} List</span>
            </button>
            <button
              onClick={() => addItem()}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
            >
              <Plus className="w-3 h-3" />
              <span>Add Item</span>
            </button>
          </div>
          
          {listData.map((item, index) => (
            <div key={item.id} className="flex items-start space-x-2 group" style={{ paddingLeft: `${item.level * 24}px` }}>
              <div className="flex-shrink-0 pt-2 min-w-6">
                {listType === 'bullet' ? 
                  <span className="text-gray-400 text-lg">•</span> : 
                  <span className="text-gray-400 text-sm">{index + 1}.</span>
                }
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={item.content}
                  onChange={(e) => updateItem(item.id, e.target.value)}
                  className="w-full bg-transparent text-gray-300 border border-gray-600 rounded px-3 py-2 focus:border-blue-500 outline-none"
                  placeholder="List item content..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      addItem(item.id, item.level);
                    } else if (e.key === 'Tab') {
                      e.preventDefault();
                      if (e.shiftKey) {
                        unindentItem(item.id);
                      } else {
                        indentItem(item.id);
                      }
                    }
                  }}
                />
              </div>
              <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1">
                <button
                  onClick={() => indentItem(item.id)}
                  disabled={item.level >= 4}
                  className="p-1 text-gray-400 hover:text-white hover:bg-gray-600 rounded disabled:opacity-50"
                  title="Indent"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
                <button
                  onClick={() => unindentItem(item.id)}
                  disabled={item.level <= 0}
                  className="p-1 text-gray-400 hover:text-white hover:bg-gray-600 rounded disabled:opacity-50"
                  title="Unindent"
                >
                  <ChevronDown className="w-3 h-3 rotate-90" />
                </button>
                <button
                  onClick={() => addItem(item.id, item.level)}
                  className="p-1 text-gray-400 hover:text-white hover:bg-gray-600 rounded"
                  title="Add item below"
                >
                  <Plus className="w-3 h-3" />
                </button>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="p-1 text-red-400 hover:text-red-300 hover:bg-red-600/20 rounded"
                  title="Delete item"
                >
                  <Trash className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Display mode
    return (
      <div className="space-y-2">
        {listData.map((item, index) => (
          <div key={item.id} className="flex items-start space-x-3" style={{ paddingLeft: `${item.level * 24}px` }}>
            <span className="text-gray-400 mt-1 flex-shrink-0">
              {listType === 'bullet' ? '•' : `${index + 1}.`}
            </span>
            <span className="text-gray-300 flex-1">
              {item.content || <span className="text-gray-500 italic">Empty item</span>}
            </span>
          </div>
        ))}
        {listData.length === 0 && (
          <div className="p-4 text-center text-gray-500 italic border-2 border-dashed border-gray-600 rounded">
            Empty list - click to add items
          </div>
        )}
      </div>
    );
  };

  // Checklist Component with proper functionality
  const ChecklistEditor = () => {
    const checklistItems: ChecklistItem[] = metadata.checklistItems || [
      { id: `check-${Date.now()}`, content: '', checked: false }
    ];

    const updateChecklistData = (newItems: ChecklistItem[]) => {
      setMetadata(prev => ({ ...prev, checklistItems: newItems }));
    };

    const addItem = (afterItemId?: string) => {
      const newItem: ChecklistItem = { 
        id: `check-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
        content: '', 
        checked: false 
      };
      
      let newItems: ChecklistItem[];
      if (afterItemId) {
        const insertIndex = checklistItems.findIndex(item => item.id === afterItemId) + 1;
        newItems = [...checklistItems.slice(0, insertIndex), newItem, ...checklistItems.slice(insertIndex)];
      } else {
        newItems = [...checklistItems, newItem];
      }
      updateChecklistData(newItems);
    };

    const updateItem = (itemId: string, content: string) => {
      const newItems = checklistItems.map(item => 
        item.id === itemId ? { ...item, content } : item
      );
      updateChecklistData(newItems);
    };

    const toggleItem = (itemId: string) => {
      const newItems = checklistItems.map(item => 
        item.id === itemId ? { ...item, checked: !item.checked } : item
      );
      updateChecklistData(newItems);
    };

    const deleteItem = (itemId: string) => {
      if (checklistItems.length > 1) {
        const newItems = checklistItems.filter(item => item.id !== itemId);
        updateChecklistData(newItems);
      }
    };

    if (isEditing) {
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-medium text-white">Task Checklist</h4>
            <button
              onClick={() => addItem()}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
            >
              <Plus className="w-3 h-3" />
              <span>Add Task</span>
            </button>
          </div>
          
          {checklistItems.map((item) => (
            <div key={item.id} className="flex items-start space-x-3 group p-2 rounded hover:bg-gray-800">
              <button
                onClick={() => toggleItem(item.id)}
                className={`flex-shrink-0 mt-1 w-5 h-5 border-2 rounded-md flex items-center justify-center transition-colors ${
                  item.checked 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : 'border-gray-400 hover:border-gray-300 hover:bg-gray-700'
                }`}
              >
                {item.checked && <Check className="w-3 h-3" />}
              </button>
              <div className="flex-1">
                <input
                  type="text"
                  value={item.content}
                  onChange={(e) => updateItem(item.id, e.target.value)}
                  className={`w-full bg-transparent border border-gray-600 rounded px-3 py-2 focus:border-blue-500 outline-none transition-colors ${
                    item.checked 
                      ? 'line-through text-gray-500' 
                      : 'text-gray-300'
                  }`}
                  placeholder="Task description..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      addItem(item.id);
                    }
                  }}
                />
              </div>
              <button
                onClick={() => deleteItem(item.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-300 hover:bg-red-600/20 rounded"
                title="Delete task"
              >
                <Trash className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      );
    }

    // Display mode
    const completedCount = checklistItems.filter(item => item.checked).length;
    const totalCount = checklistItems.length;
    const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
    
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-3 mb-4">
          <div className="text-sm text-gray-400 font-medium">
            {completedCount}/{totalCount} completed
          </div>
          <div className="flex-1 bg-gray-700 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-green-500 h-full transition-all duration-500 rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="text-sm text-gray-400 font-mono">
            {Math.round(progressPercentage)}%
          </div>
        </div>
        
        <div className="space-y-2">
          {checklistItems.map((item) => (
            <div key={item.id} className="flex items-start space-x-3 p-2 rounded hover:bg-gray-800 cursor-pointer transition-colors" onClick={() => toggleItem(item.id)}>
              <div className={`flex-shrink-0 mt-1 w-5 h-5 border-2 rounded-md flex items-center justify-center ${
                item.checked 
                  ? 'bg-green-500 border-green-500 text-white' 
                  : 'border-gray-400'
              }`}>
                {item.checked && <Check className="w-3 h-3" />}
              </div>
              <span className={`text-gray-300 flex-1 ${item.checked ? 'line-through text-gray-500' : ''}`}>
                {item.content || <span className="text-gray-500 italic">Empty task</span>}
              </span>
            </div>
          ))}
        </div>
        
        {checklistItems.length === 0 && (
          <div className="p-6 text-center text-gray-500 italic border-2 border-dashed border-gray-600 rounded">
            Empty checklist - click to add tasks
          </div>
        )}
      </div>
    );
  };

  // Image Component with file support
  const ImageEditor = () => {
    const imageData: ImageData = metadata.imageData || { url: '', caption: '', alt: '' };
    
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const newImageData = { 
            ...imageData, 
            url: event.target?.result as string, 
            alt: file.name 
          };
          setMetadata(prev => ({ ...prev, imageData: newImageData }));
        };
        reader.readAsDataURL(file);
      }
    };

    const updateImageData = (field: keyof ImageData, value: string) => {
      const newImageData = { ...imageData, [field]: value };
      setMetadata(prev => ({ ...prev, imageData: newImageData }));
    };

    if (isEditing) {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="flex flex-col items-center space-y-2 p-6 bg-gray-700 hover:bg-gray-600 border-2 border-dashed border-gray-500 hover:border-gray-400 rounded-lg transition-colors"
            >
              <Upload className="w-8 h-8 text-gray-400" />
              <span className="text-sm text-gray-300">Upload Image</span>
            </button>
            
            <div className="space-y-2">
              <input
                type="url"
                value={imageData.url}
                onChange={(e) => updateImageData('url', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 outline-none"
                placeholder="Or paste image URL"
              />
              <input
                type="text"
                value={imageData.caption}
                onChange={(e) => updateImageData('caption', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 outline-none"
                placeholder="Image caption (optional)"
              />
            </div>
          </div>
          
          <input 
            ref={fileInputRef} 
            type="file" 
            accept="image/*" 
            onChange={handleImageUpload} 
            className="hidden" 
          />
          
          {imageData.url && (
            <div className="border border-gray-600 rounded-lg overflow-hidden">
              <img 
                src={imageData.url} 
                alt={imageData.alt || 'Uploaded image'} 
                className="w-full h-auto max-h-96 object-contain bg-gray-800"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              {imageData.caption && (
                <div className="p-3 bg-gray-700 text-sm text-gray-300 text-center">
                  {imageData.caption}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return imageData.url ? (
      <div className="space-y-2">
        <img 
          src={imageData.url} 
          alt={imageData.alt || 'Image'} 
          className="w-full h-auto rounded border border-gray-600 max-h-96 object-contain bg-gray-800"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        {imageData.caption && (
          <p className="text-sm text-gray-400 text-center italic">{imageData.caption}</p>
        )}
      </div>
    ) : (
      <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-gray-500 transition-colors">
        <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
        <p className="text-gray-500">Click to add an image</p>
      </div>
    );
  };

  // Page Link Dialog Component
  const PageLinkDialog = () => {
    if (!showPageLinkDialog.show) return null;
    
    const availablePages = getAllPages();

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold text-white mb-4">Link to Page</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {availablePages.map((page: any) => (
              <button
                key={page.id}
                onClick={() => {
                  if (showPageLinkDialog.rowIndex !== undefined && showPageLinkDialog.colIndex !== undefined) {
                    handleCellPageLink(
                      showPageLinkDialog.rowIndex,
                      showPageLinkDialog.colIndex,
                      {
                        pageId: page.id,
                        pageTitle: page.title,
                        sectionId: page.sectionId || '',
                        subsectionId: page.subsectionId
                      }
                    );
                  }
                  setShowPageLinkDialog({show: false});
                }}
                className="w-full text-left p-3 rounded hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-sm">{page.icon}</span>
                  <div className="flex-1">
                    <p className="text-white font-medium">{page.title}</p>
                    <p className="text-xs text-gray-400">
                      {page.sectionTitle} {page.subsectionTitle && `• ${page.subsectionTitle}`}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setShowPageLinkDialog({show: false})}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderEditingView = () => {
    const commonEditControls = (
      <div className="flex items-center space-x-2 mt-3 p-2 bg-gray-800 border border-gray-600 rounded">
        <button 
          onClick={handleSave} 
          className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
        >
          <Save className="w-3 h-3" />
          <span>Save</span>
        </button>
        <button 
          onClick={handleCancel} 
          className="flex items-center space-x-1 px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
        >
          <X className="w-3 h-3" />
          <span>Cancel</span>
        </button>
      </div>
    );

    switch (block.type) {
      case 'table':
      case 'advanced_table':
        return <div className="space-y-3"><TableEditor />{commonEditControls}</div>;
      case 'nested_list':
        return <div className="space-y-3"><NestedListEditor />{commonEditControls}</div>;
      case 'checklist':
        return <div className="space-y-3"><ChecklistEditor />{commonEditControls}</div>;
      case 'image':
        return <div className="space-y-3"><ImageEditor />{commonEditControls}</div>;
      default:
        return (
          <div className="space-y-3">
            <div className="flex items-start space-x-2 group">
              <div className="flex-shrink-0 pt-2">
                <GripVertical className="w-4 h-4 text-gray-500 cursor-move" />
              </div>
              <div className="flex-1">
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-gray-800 border-2 border-blue-500 rounded-lg px-4 py-3 text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  style={{ 
                    minHeight: '60px', 
                    fontFamily: block.type === 'code' ? 'monospace' : 'inherit', 
                    fontSize: getTextSize(block.type) 
                  }}
                  placeholder={getPlaceholder(block.type)}
                />
              </div>
            </div>
            {commonEditControls}
          </div>
        );
    }
  };

  const renderDisplayView = () => {
    const displayContent = content || getPlaceholder(block.type);
    const isEmpty = !content.trim() && !Object.keys(metadata).length;
    const blockClasses = `group relative cursor-pointer transition-all duration-200 rounded-lg px-3 py-2 ${
      isEmpty ? 'text-gray-500 italic border-2 border-dashed border-gray-600 hover:border-gray-500' : 'text-white hover:bg-gray-800'
    } ${isDragging ? 'opacity-50 scale-95' : ''}`;

    const renderBlockContent = () => {
      switch (block.type) {
        case 'table':
        case 'advanced_table':
          return metadata.tableData ? <TableEditor /> : 
            <div className={blockClasses}>Click to add a table</div>;
        case 'nested_list':
          return metadata.listItems ? <NestedListEditor /> : 
            <div className={blockClasses}>Click to add a nested list</div>;
        case 'checklist':
          return metadata.checklistItems ? <ChecklistEditor /> : 
            <div className={blockClasses}>Click to add a checklist</div>;
        case 'image':
          return <ImageEditor />;
        case 'heading1':
          return <h1 className={`text-4xl font-bold ${blockClasses}`}>{displayContent}</h1>;
        case 'heading2':
          return <h2 className={`text-3xl font-bold ${blockClasses}`}>{displayContent}</h2>;
        case 'heading3':
          return <h3 className={`text-2xl font-bold ${blockClasses}`}>{displayContent}</h3>;
        case 'bullet':
          return (
            <div className={`flex items-start space-x-3 ${blockClasses}`}>
              <span className="text-gray-400 mt-1 text-lg">•</span>
              <span className="flex-1">{displayContent}</span>
            </div>
          );
        case 'numbered':
          return (
            <div className={`flex items-start space-x-3 ${blockClasses}`}>
              <span className="text-gray-400 mt-1">1.</span>
              <span className="flex-1">{displayContent}</span>
            </div>
          );
        case 'quote':
          return (
            <blockquote className={`border-l-4 border-blue-500 pl-4 italic bg-gray-800/50 ${blockClasses}`}>
              {displayContent}
            </blockquote>
          );
        case 'code':
          return (
            <pre className={`bg-gray-900 px-4 py-3 rounded-lg font-mono text-sm overflow-x-auto border border-gray-600 ${blockClasses}`}>
              <code className="text-green-400">{displayContent}</code>
            </pre>
          );
        case 'divider':
          return <hr className="border-gray-600 my-6 border-2" />;
        default:
          return <p className={blockClasses}>{displayContent}</p>;
      }
    };

    return (
      <div 
        ref={blockRef} 
        onMouseEnter={() => setShowActions(true)} 
        onMouseLeave={() => setShowActions(false)} 
        onDragOver={handleDragOver} 
        onDrop={handleDrop} 
        className={`relative group ${isDragOver ? 'bg-gray-800/50 border border-blue-500 rounded-lg' : ''}`}
      >
        <div onClick={startEditing} className="flex items-start space-x-2">
          <div 
            className={`flex-shrink-0 pt-2 transition-opacity ${showActions || isDragging ? 'opacity-100' : 'opacity-0'}`} 
            draggable 
            onDragStart={handleDragStart} 
            onDragEnd={handleDragEnd}
          >
            <GripVertical className={`w-4 h-4 text-gray-500 cursor-move hover:text-gray-300 ${isDragging ? 'text-blue-500' : ''}`} />
          </div>
          <div className="flex-1">{renderBlockContent()}</div>
        </div>
        
        {isDragOver && dragPosition === 'before' && (
          <div className="absolute -top-1 left-0 right-0 h-1 bg-blue-500 rounded-full shadow-lg" />
        )}
        {isDragOver && dragPosition === 'after' && (
          <div className="absolute -bottom-1 left-0 right-0 h-1 bg-blue-500 rounded-full shadow-lg" />
        )}
        
        {showActions && !isDragging && (
          <div className="absolute right-2 top-2 flex items-center space-x-1 bg-gray-900 border border-gray-600 rounded-lg shadow-xl p-1">
            <button
              onClick={(e) => { e.stopPropagation(); startEditing(); }}
              className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
              title="Edit block"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            {onDuplicate && (
              <button
                onClick={(e) => { e.stopPropagation(); onDuplicate(block.id); }}
                className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
                title="Duplicate block"
              >
                <Copy className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={(e) => { 
                e.stopPropagation(); 
                if (confirm('Delete this block?')) { 
                  onDelete(block.id); 
                } 
              }}
              className="p-2 hover:bg-red-600 rounded text-gray-400 hover:text-white transition-colors"
              title="Delete block"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="my-3">
      {isEditing ? renderEditingView() : renderDisplayView()}
      <PageLinkDialog />
    </div>
  );
};

const getPlaceholder = (type: BlockType): string => {
  switch (type) {
    case 'heading1': return 'Heading 1';
    case 'heading2': return 'Heading 2';
    case 'heading3': return 'Heading 3';
    case 'bullet': return 'Bullet point';
    case 'numbered': return 'Numbered item';
    case 'quote': return 'Quote text';
    case 'code': return 'Code snippet';
    case 'table': return 'Table';
    case 'advanced_table': return 'Advanced table';
    case 'nested_list': return 'Nested list';
    case 'checklist': return 'Task list';
    case 'image': return 'Image';
    default: return 'Type something...';
  }
};

const getTextSize = (type: BlockType): string => {
  switch (type) {
    case 'heading1': return '2.5rem';
    case 'heading2': return '2rem';  
    case 'heading3': return '1.5rem';
    case 'code': return '0.875rem';
    default: return '1rem';
  }
};