'use client';

import React, { useEffect, useRef, useState } from 'react';
import { 
  FileText, Heading1, Heading2, Heading3, List, Hash, Quote, Code, 
  Image, Table, CheckSquare, Type, Minus, ChevronDown, ChevronRight,
  Database, Grid3X3, BarChart3, TreePine, Layers, X
} from 'lucide-react';
import { BlockType } from '@/types';

interface BlockTypeSelectorProps {
  onSelect: (type: BlockType, options?: any) => void;
  onClose: () => void;
  position?: { x: number; y: number }; // Keep for backward compatibility but won't be used
}

const blockTypes = [
  { 
    category: 'Basic blocks',
    items: [
      { type: 'text' as BlockType, icon: Type, label: 'Text', description: 'Just start writing with plain text.' },
      { type: 'heading1' as BlockType, icon: Heading1, label: 'Heading 1', description: 'Big section heading.' },
      { type: 'heading2' as BlockType, icon: Heading2, label: 'Heading 2', description: 'Medium section heading.' },
      { type: 'heading3' as BlockType, icon: Heading3, label: 'Heading 3', description: 'Small section heading.' },
      { type: 'quote' as BlockType, icon: Quote, label: 'Quote', description: 'Capture a quote.' },
      { type: 'code' as BlockType, icon: Code, label: 'Code', description: 'Capture a code snippet.' },
      { type: 'divider' as BlockType, icon: Minus, label: 'Divider', description: 'Visually divide blocks.' },
    ]
  },
  {
    category: 'Lists & Tasks',
    items: [
      { type: 'bullet' as BlockType, icon: List, label: 'Bulleted list', description: 'Create a simple bulleted list.' },
      { type: 'numbered' as BlockType, icon: Hash, label: 'Numbered list', description: 'Create a list with numbering.' },
      { type: 'checklist' as BlockType, icon: CheckSquare, label: 'To-do list', description: 'Track tasks with a to-do list.' },
      { type: 'nested_list' as BlockType, icon: TreePine, label: 'Nested list', description: 'Multi-level hierarchical list.' },
    ]
  },
  {
    category: 'Advanced Tables',
    items: [
      { type: 'table' as BlockType, icon: Table, label: 'Simple table', description: 'Basic table for organizing data.' },
      { type: 'advanced_table' as BlockType, icon: Grid3X3, label: 'Advanced table', description: 'Table with column types and formatting.' },
      { type: 'dropdown_table' as BlockType, icon: Layers, label: 'Dropdown table', description: 'Expandable table sections.' },
    ]
  },
  {
    category: 'Media',
    items: [
      { type: 'image' as BlockType, icon: Image, label: 'Image', description: 'Upload or embed with a link.' },
    ]
  }
];

const BlockTypeSelector: React.FC<BlockTypeSelectorProps> = ({ 
  onSelect, 
  onClose, 
  position // Keep for backward compatibility but ignore
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [showTableOptions, setShowTableOptions] = useState(false);
  const [showListOptions, setShowListOptions] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showTableOptions || showListOptions) {
          setShowTableOptions(false);
          setShowListOptions(false);
        } else {
          onClose();
        }
      }
    };

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose, showTableOptions, showListOptions]);

  const handleSelect = (type: BlockType, options?: any) => {
    onSelect(type, options);
    onClose();
  };

  const handleAdvancedTableSelect = (columns: number, rows: number, hasHeaders: boolean) => {
    const headers = Array.from({ length: columns }, (_, i) => `Column ${i + 1}`);
    const tableRows = Array.from({ length: rows }, () => 
      Array.from({ length: columns }, () => '')
    );
    
    handleSelect('advanced_table', {
      tableData: {
        headers: hasHeaders ? headers : [],
        rows: tableRows,
        columnTypes: Array.from({ length: columns }, () => 'text'),
        styling: {
          headerBg: '#374151',
          alternatingRows: true,
          borders: true,
          compact: false
        }
      }
    });
  };

  const handleDropdownTableSelect = () => {
    handleSelect('dropdown_table', {
      sections: [
        {
          id: `section-${Date.now()}`,
          title: 'Section 1',
          isExpanded: true,
          tableData: {
            headers: ['Column 1', 'Column 2', 'Column 3'],
            rows: [['', '', '']]
          }
        }
      ]
    });
  };

  const handleNestedListSelect = (listType: 'bullet' | 'numbered') => {
    handleSelect('nested_list', {
      listItems: [
        {
          id: `item-${Date.now()}`,
          content: '',
          level: 0,
          children: []
        }
      ],
      listType
    });
  };

  const TableOptionsPanel = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setShowTableOptions(false)}
            className="text-gray-400 hover:text-white"
          >
            <ChevronRight className="w-4 h-4 transform rotate-180" />
          </button>
          <span className="text-sm font-semibold text-white">Table Options</span>
        </div>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      {/* Quick Table Sizes */}
      <div>
        <div className="text-xs text-gray-400 mb-2">Quick sizes:</div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleAdvancedTableSelect(2, 3, true)}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-xs text-center transition-colors"
          >
            2×3 Table
          </button>
          <button
            onClick={() => handleAdvancedTableSelect(3, 4, true)}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-xs text-center transition-colors"
          >
            3×4 Table
          </button>
          <button
            onClick={() => handleAdvancedTableSelect(4, 3, true)}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-xs text-center transition-colors"
          >
            4×3 Table
          </button>
          <button
            onClick={() => handleAdvancedTableSelect(5, 5, true)}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-xs text-center transition-colors"
          >
            5×5 Table
          </button>
        </div>
      </div>

      {/* Advanced Table Options */}
      <div className="space-y-3">
        <button
          onClick={() => handleDropdownTableSelect()}
          className="w-full flex items-center space-x-3 p-3 hover:bg-gray-700 rounded text-sm text-gray-300 hover:text-white transition-colors"
        >
          <Layers className="w-4 h-4" />
          <div className="text-left">
            <div className="font-medium">Dropdown Table</div>
            <div className="text-xs text-gray-500">Expandable table sections</div>
          </div>
        </button>
        
        <button
          onClick={() => handleAdvancedTableSelect(3, 3, true)}
          className="w-full flex items-center space-x-3 p-3 hover:bg-gray-700 rounded text-sm text-gray-300 hover:text-white transition-colors"
        >
          <Database className="w-4 h-4" />
          <div className="text-left">
            <div className="font-medium">Database Table</div>
            <div className="text-xs text-gray-500">With column types and formatting</div>
          </div>
        </button>
      </div>
    </div>
  );

  const ListOptionsPanel = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setShowListOptions(false)}
            className="text-gray-400 hover:text-white"
          >
            <ChevronRight className="w-4 h-4 transform rotate-180" />
          </button>
          <span className="text-sm font-semibold text-white">List Options</span>
        </div>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="space-y-2">
        <button
          onClick={() => handleSelect('bullet')}
          className="w-full flex items-center space-x-3 p-3 hover:bg-gray-700 rounded text-sm text-gray-300 hover:text-white transition-colors"
        >
          <List className="w-4 h-4" />
          <div className="text-left">
            <div className="font-medium">Simple Bullet List</div>
            <div className="text-xs text-gray-500">Basic bulleted list</div>
          </div>
        </button>
        
        <button
          onClick={() => handleSelect('numbered')}
          className="w-full flex items-center space-x-3 p-3 hover:bg-gray-700 rounded text-sm text-gray-300 hover:text-white transition-colors"
        >
          <Hash className="w-4 h-4" />
          <div className="text-left">
            <div className="font-medium">Simple Numbered List</div>
            <div className="text-xs text-gray-500">Basic numbered list</div>
          </div>
        </button>
        
        <button
          onClick={() => handleNestedListSelect('bullet')}
          className="w-full flex items-center space-x-3 p-3 hover:bg-gray-700 rounded text-sm text-gray-300 hover:text-white transition-colors"
        >
          <TreePine className="w-4 h-4" />
          <div className="text-left">
            <div className="font-medium">Nested Bullet List</div>
            <div className="text-xs text-gray-500">Multi-level bullet list with indentation</div>
          </div>
        </button>
        
        <button
          onClick={() => handleNestedListSelect('numbered')}
          className="w-full flex items-center space-x-3 p-3 hover:bg-gray-700 rounded text-sm text-gray-300 hover:text-white transition-colors"
        >
          <TreePine className="w-4 h-4" />
          <div className="text-left">
            <div className="font-medium">Nested Numbered List</div>
            <div className="text-xs text-gray-500">Multi-level numbered list with sub-items</div>
          </div>
        </button>
        
        <button
          onClick={() => handleSelect('checklist')}
          className="w-full flex items-center space-x-3 p-3 hover:bg-gray-700 rounded text-sm text-gray-300 hover:text-white transition-colors"
        >
          <CheckSquare className="w-4 h-4" />
          <div className="text-left">
            <div className="font-medium">Checklist</div>
            <div className="text-xs text-gray-500">Task list with checkboxes</div>
          </div>
        </button>
      </div>
    </div>
  );

  const ModalContent = () => (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Add a block</h3>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      {blockTypes.map(({ category, items }) => (
        <div key={category} className="mb-6">
          <div className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3 px-2">
            {category}
          </div>
          <div className="space-y-1">
            {items.map(({ type, icon: Icon, label, description }) => {
              
              // Handle special cases with sub-menus
              if (type === 'advanced_table' || type === 'dropdown_table' || type === 'table') {
                return (
                  <button
                    key={type}
                    onClick={() => setShowTableOptions(true)}
                    className="w-full flex items-center space-x-3 p-3 hover:bg-gray-700 rounded-lg text-sm text-gray-300 hover:text-white transition-colors group"
                  >
                    <div className="flex-shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="font-medium truncate">Tables</div>
                      <div className="text-xs text-gray-500 truncate">Choose table type and size</div>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                  </button>
                );
              }

              if (type === 'nested_list' || type === 'bullet' || type === 'numbered' || type === 'checklist') {
                return (
                  <button
                    key={type}
                    onClick={() => setShowListOptions(true)}
                    className="w-full flex items-center space-x-3 p-3 hover:bg-gray-700 rounded-lg text-sm text-gray-300 hover:text-white transition-colors group"
                  >
                    <div className="flex-shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="font-medium truncate">Lists & Tasks</div>
                      <div className="text-xs text-gray-500 truncate">Choose list type and structure</div>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                  </button>
                );
              }

              // Regular block types
              return (
                <button
                  key={type}
                  onClick={() => handleSelect(type)}
                  className="w-full flex items-center space-x-3 p-3 hover:bg-gray-700 rounded-lg text-sm text-gray-300 hover:text-white transition-colors group"
                >
                  <div className="flex-shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-medium truncate">{label}</div>
                    <div className="text-xs text-gray-500 truncate">{description}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-70 transition-opacity" />
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Quick shortcuts hint */}
      <div className="border-t border-gray-700 pt-4 mt-4">
        <div className="text-xs text-gray-500 px-2">
          <p className="mb-2 font-medium"><strong>Tip:</strong> Type "/" for quick access</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="bg-gray-700 px-2 py-1 rounded">/table</span>
            <span className="bg-gray-700 px-2 py-1 rounded">/list</span>
            <span className="bg-gray-700 px-2 py-1 rounded">/todo</span>
            <span className="bg-gray-700 px-2 py-1 rounded">/code</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Modal Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        {/* Modal Container */}
        <div 
          ref={modalRef}
          className="bg-gray-800 border border-gray-600 rounded-lg shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
        >
          {showTableOptions ? (
            <div className="p-4">
              <TableOptionsPanel />
            </div>
          ) : showListOptions ? (
            <div className="p-4">
              <ListOptionsPanel />
            </div>
          ) : (
            <ModalContent />
          )}
        </div>
      </div>
    </>
  );
};

// Named export
export { BlockTypeSelector };

// Add default export as well for flexibility
export default BlockTypeSelector;