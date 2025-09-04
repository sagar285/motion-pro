'use client';

import React from 'react';
import { ChevronRight, Home, Folder, FileText } from 'lucide-react';
import { useWorkspace, useNestedPages } from '@/context/WorkspaceContext';

interface BreadcrumbItem {
  id: string;
  title: string;
  type: 'workspace' | 'section' | 'subsection' | 'page';
  icon?: string;
  onClick?: () => void;
}

interface BreadcrumbNavigationProps {
  currentPageId?: string;
  className?: string;
}

export const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({
  currentPageId,
  className = ""
}) => {
  const { state, dispatch } = useWorkspace();
  const { getPageBreadcrumbs, getAllPages } = useNestedPages();

  // Generate breadcrumbs based on current page
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const breadcrumbs: BreadcrumbItem[] = [];

    // Always start with workspace
    if (state.workspace) {
      breadcrumbs.push({
        id: state.workspace.id,
        title: state.workspace.name,
        type: 'workspace',
        icon: '🏢',
        onClick: () => {
          dispatch({ type: 'SET_CURRENT_PAGE', payload: null });
        }
      });
    }

    // If we have a current page, build its hierarchy
    if (currentPageId || state.currentPage?.id) {
      const pageId = currentPageId || state.currentPage!.id;
      const pageBreadcrumbs = getPageBreadcrumbs(pageId);
      
      breadcrumbs.push(...pageBreadcrumbs.map(item => ({
        id: item.id,
        title: item.title,
        type: item.type,
        icon: item.type === 'section' ? '📁' : item.type === 'subsection' ? '📂' : '📄',
        onClick: () => {
          if (item.type === 'page') {
            const allPages = getAllPages();
            const page = allPages.find(p => p.id === item.id);
            if (page) {
              dispatch({ type: 'SET_CURRENT_PAGE', payload: page });
            }
          } else if (item.type === 'section') {
            // Expand section if collapsed
            if (!state.expandedSections.includes(item.id)) {
              dispatch({ type: 'TOGGLE_SECTION', payload: item.id });
            }
          }
        }
      })));
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length <= 1) {
    return null; // Don't show breadcrumbs if only workspace
  }

  return (
    <nav className={`flex items-center space-x-1 text-sm text-gray-400 ${className}`}>
      {breadcrumbs.map((item, index) => (
        <React.Fragment key={item.id}>
          {index > 0 && (
            <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
          )}
          
          <button
            onClick={item.onClick}
            className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors truncate max-w-48 ${
              index === breadcrumbs.length - 1
                ? 'text-white font-medium cursor-default'
                : 'hover:text-white hover:bg-gray-800'
            }`}
            disabled={index === breadcrumbs.length - 1}
          >
            {index === 0 ? (
              <Home className="w-4 h-4 flex-shrink-0" />
            ) : item.type === 'section' ? (
              <Folder className="w-4 h-4 flex-shrink-0" />
            ) : item.type === 'subsection' ? (
              <Folder className="w-3 h-3 flex-shrink-0" />
            ) : (
              <FileText className="w-3 h-3 flex-shrink-0" />
            )}
            
            <span className="truncate">
              {item.title}
            </span>
          </button>
        </React.Fragment>
      ))}
    </nav>
  );
};

// Compact breadcrumb for tight spaces
export const CompactBreadcrumb: React.FC<BreadcrumbNavigationProps> = ({
  currentPageId,
  className = ""
}) => {
  const { state } = useWorkspace();
  const { getPageBreadcrumbs } = useNestedPages();

  if (!currentPageId && !state.currentPage?.id) {
    return null;
  }

  const pageId = currentPageId || state.currentPage!.id;
  const breadcrumbs = getPageBreadcrumbs(pageId);

  // Show only the last 3 levels for compact view
  const compactBreadcrumbs = breadcrumbs.slice(-3);

  return (
    <div className={`flex items-center space-x-1 text-xs text-gray-500 ${className}`}>
      {breadcrumbs.length > 3 && (
        <>
          <span>...</span>
          <ChevronRight className="w-3 h-3" />
        </>
      )}
      
      {compactBreadcrumbs.map((item, index) => (
        <React.Fragment key={item.id}>
          {index > 0 && (
            <ChevronRight className="w-3 h-3 text-gray-600" />
          )}
          
          <span className={`truncate max-w-20 ${
            index === compactBreadcrumbs.length - 1 ? 'text-gray-300 font-medium' : ''
          }`}>
            {item.title}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
};

// Page hierarchy indicator (shows depth visually)
export const PageDepthIndicator: React.FC<{
  pageId: string;
  className?: string;
}> = ({ pageId, className = "" }) => {
  const { getPageDepth } = useNestedPages();
  
  const depth = getPageDepth(pageId);
  
  if (depth === 0) return null;

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {Array.from({ length: Math.min(depth, 5) }, (_, i) => (
        <div
          key={i}
          className={`w-1 h-4 rounded-full ${
            i < depth - 1 ? 'bg-gray-600' : 'bg-blue-500'
          }`}
        />
      ))}
      
      {depth > 5 && (
        <span className="text-xs text-gray-500 ml-1">
          +{depth - 5}
        </span>
      )}
    </div>
  );
};