'use client';

import React from 'react';
import { Plus, Trash, Check } from 'lucide-react';

interface ChecklistItem {
  id: string;
  content: string;
  checked: boolean;
}

interface ChecklistEditorProps {
  checklistItems: ChecklistItem[];
  isEditing: boolean;
  onUpdate: (newItems: ChecklistItem[]) => void;
}

export const ChecklistEditor: React.FC<ChecklistEditorProps> = ({
  checklistItems,
  isEditing,
  onUpdate
}) => {
  const addChecklistItem = (afterItemId?: string) => {
    const newItem = {
      id: `check-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: '',
      checked: false
    };

    let newItems;
    if (afterItemId) {
      const insertIndex = checklistItems.findIndex(item => item.id === afterItemId) + 1;
      newItems = [
        ...checklistItems.slice(0, insertIndex),
        newItem,
        ...checklistItems.slice(insertIndex)
      ];
    } else {
      newItems = [...checklistItems, newItem];
    }

    onUpdate(newItems);
  };

  const updateChecklistItem = (itemId: string, content: string) => {
    const newItems = checklistItems.map(item => 
      item.id === itemId ? { ...item, content } : item
    );
    onUpdate(newItems);
  };

  const toggleChecklistItem = (itemId: string) => {
    const newItems = checklistItems.map(item => 
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );
    onUpdate(newItems);
  };

  const deleteChecklistItem = (itemId: string) => {
    if (checklistItems.length > 1) {
      const newItems = checklistItems.filter(item => item.id !== itemId);
      onUpdate(newItems);
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        {checklistItems.map(item => (
          <div key={item.id} className="flex items-start space-x-3 group">
            <button
              onClick={() => toggleChecklistItem(item.id)}
              className={`flex-shrink-0 mt-1 w-4 h-4 border-2 rounded flex items-center justify-center ${
                item.checked 
                  ? 'bg-blue-500 border-blue-500' 
                  : 'border-gray-400 hover:border-gray-300'
              }`}
            >
              {item.checked && <Check className="w-2 h-2 text-white" />}
            </button>
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={item.content}
                onChange={(e) => updateChecklistItem(item.id, e.target.value)}
                className={`w-full bg-transparent border-none outline-none focus:bg-gray-800 rounded px-1 ${
                  item.checked ? 'line-through text-gray-500' : 'text-gray-300'
                }`}
                placeholder="Task description"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addChecklistItem(item.id);
                  }
                }}
              />
            </div>
            <button
              onClick={() => deleteChecklistItem(item.id)}
              className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-300"
              title="Delete task"
            >
              <Trash className="w-3 h-3" />
            </button>
          </div>
        ))}
        <button
          onClick={() => addChecklistItem()}
          className="flex items-center space-x-1 px-2 py-1 text-sm text-gray-400 hover:text-white"
        >
          <Plus className="w-3 h-3" />
          <span>Add task</span>
        </button>
      </div>
    );
  }

  // Display mode
  const completedCount = checklistItems.filter(item => item.checked).length;
  const totalCount = checklistItems.length;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2 mb-3">
        <div className="text-xs text-gray-400">
          {completedCount}/{totalCount} completed
        </div>
        <div className="flex-1 bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
          />
        </div>
      </div>
      {checklistItems.map(item => (
        <div key={item.id} className="flex items-start space-x-3 cursor-pointer" onClick={() => toggleChecklistItem(item.id)}>
          <div className={`flex-shrink-0 mt-1 w-4 h-4 border-2 rounded flex items-center justify-center ${
            item.checked ? 'bg-blue-500 border-blue-500' : 'border-gray-400'
          }`}>
            {item.checked && <Check className="w-2 h-2 text-white" />}
          </div>
          <span className={`text-gray-300 ${item.checked ? 'line-through text-gray-500' : ''}`}>
            {item.content || <span className="text-gray-500 italic">Empty task</span>}
          </span>
        </div>
      ))}
    </div>
  );
};