'use client';

import React from 'react';
import { Plus, Trash } from 'lucide-react';

interface ListItem {
  id: string;
  content: string;
  level: number;
  children: ListItem[];
}

interface NestedListEditorProps {
  listItems: ListItem[];
  listType: 'bullet' | 'numbered';
  isEditing: boolean;
  onUpdate: (newListItems: ListItem[]) => void;
}

export const NestedListEditor: React.FC<NestedListEditorProps> = ({
  listItems,
  listType,
  isEditing,
  onUpdate
}) => {
  const addItem = (afterItemId?: string, level: number = 0) => {
    const newItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: '',
      level,
      children: []
    };

    let newListItems;
    if (afterItemId) {
      const insertIndex = listItems.findIndex(item => item.id === afterItemId) + 1;
      newListItems = [
        ...listItems.slice(0, insertIndex),
        newItem,
        ...listItems.slice(insertIndex)
      ];
    } else {
      newListItems = [...listItems, newItem];
    }

    onUpdate(newListItems);
  };

  const updateItem = (itemId: string, content: string) => {
    const newListItems = listItems.map(item => 
      item.id === itemId ? { ...item, content } : item
    );
    onUpdate(newListItems);
  };

  const deleteItem = (itemId: string) => {
    if (listItems.length > 1) {
      const newListItems = listItems.filter(item => item.id !== itemId);
      onUpdate(newListItems);
    }
  };

  const indentItem = (itemId: string) => {
    const newListItems = listItems.map(item => 
      item.id === itemId ? { ...item, level: Math.min(item.level + 1, 3) } : item
    );
    onUpdate(newListItems);
  };

  const unindentItem = (itemId: string) => {
    const newListItems = listItems.map(item => 
      item.id === itemId ? { ...item, level: Math.max(item.level - 1, 0) } : item
    );
    onUpdate(newListItems);
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        {listItems.map((item, index) => (
          <div key={item.id} className="flex items-start space-x-2 group" style={{ paddingLeft: `${item.level * 20}px` }}>
            <div className="flex-shrink-0 pt-2">
              {listType === 'bullet' ? (
                <span className="text-gray-400">•</span>
              ) : (
                <span className="text-gray-400">{index + 1}.</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={item.content}
                onChange={(e) => updateItem(item.id, e.target.value)}
                className="w-full bg-transparent text-gray-300 border-none outline-none focus:bg-gray-800 rounded px-1"
                placeholder="List item"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
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
                onClick={() => addItem(item.id, item.level)}
                className="p-1 text-gray-400 hover:text-white"
                title="Add item below"
              >
                <Plus className="w-3 h-3" />
              </button>
              <button
                onClick={() => deleteItem(item.id)}
                className="p-1 text-red-400 hover:text-red-300"
                title="Delete item"
              >
                <Trash className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
        <button
          onClick={() => addItem()}
          className="flex items-center space-x-1 px-2 py-1 text-sm text-gray-400 hover:text-white"
        >
          <Plus className="w-3 h-3" />
          <span>Add item</span>
        </button>
      </div>
    );
  }

  // Display mode
  return (
    <div className="space-y-1">
      {listItems.map((item, index) => (
        <div key={item.id} className="flex items-start space-x-2" style={{ paddingLeft: `${item.level * 20}px` }}>
          <span className="text-gray-400 mt-1">
            {listType === 'bullet' ? '•' : `${index + 1}.`}
          </span>
          <span className="text-gray-300 flex-1">
            {item.content || <span className="text-gray-500 italic">Empty item</span>}
          </span>
        </div>
      ))}
    </div>
  );
};