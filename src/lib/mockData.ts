import { Workspace, PageItem, Section, ContentBlock } from '@/types';

const personalBrandingContent: ContentBlock[] = [
  {
    id: 'block-1',
    type: 'heading1',
    content: 'Personal Branding // Allan & Sagar',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'block-2',
    type: 'numbered',
    content: 'Define "Targeted Audience"',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'block-3',
    type: 'numbered',
    content: 'Define "Content Pillar" - Topics',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'block-4',
    type: 'numbered',
    content: 'Define an "Effective LinkedIn Initial Outreach Strategy" (suggested below)',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'block-5',
    type: 'text',
    content: 'Below is the structure that I have collected from LinkedIn Experts - Link, combine with what I have experienced so far.',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'block-6',
    type: 'heading2',
    content: 'Step 1: Map client\'s journey backward',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'block-7',
    type: 'text',
    content: 'Understand their touchpoints, and content that convert them.',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'block-8',
    type: 'heading2',
    content: 'Step 2: The Value Ladder',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'block-9',
    type: 'bullet',
    content: 'Awareness content → problems',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const mockWorkspaceData: Workspace = {
  id: 'workspace-1',
  name: 'Motion-Pro Workspace',
  members: [
    {
      id: 'user-1',
      name: 'Allan',
      email: 'allan@motion-pro.com',
      role: 'owner'
    },
    {
      id: 'user-2',
      name: 'Sagar Gupta Gupta',
      email: 'sagar@motion-pro.com',
      role: 'admin'
    }
  ],
  sections: [
    {
      id: 'overall',
      title: 'Overall',
      icon: '📊',
      order: 1,
      pages: [
        {
          id: '1',
          title: 'Corporate Strategy',
          icon: '🎯',
          type: 'page',
          content: [
            {
              id: 'block-corp-1',
              type: 'heading1',
              content: 'Corporate Strategy Overview',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 'block-corp-2',
              type: 'text',
              content: 'This document outlines our strategic direction for the upcoming quarter.',
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          title: 'SOPs + Work Files',
          icon: '⚙️',
          type: 'page',
          content: [],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '3',
          title: 'Company Meeting',
          icon: '👥',
          type: 'page',
          content: [],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '4',
          title: "Feedback Form - We'd love to hear from you!",
          icon: '📝',
          type: 'page',
          content: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
    },
    {
      id: 'marketing',
      title: 'Marketing',
      icon: '📈',
      order: 2,
      pages: [],
      subsections: [
        {
          id: 'management-marketing',
          title: 'Management',
          order: 1,
          pages: [
            {
              id: 'overview-quarter',
              title: 'Overview & Quarter Strategy',
              icon: '📋',
              type: 'database',
              status: 'Management',
              content: [],
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 'product-marketing',
              title: 'Product Marketing // All Segments',
              icon: '🎯',
              type: 'database',
              status: 'Management',
              content: [],
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 'personal-branding',
              title: 'Personal Branding // Allan & Sagar',
              icon: '👤',
              type: 'database',
              status: 'Management',
              assignees: ['Allan', 'Sagar Gupta Gupta'],
              content: personalBrandingContent,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ]
        },
        {
          id: 'execution-marketing',
          title: 'Execution',
          order: 2,
          pages: [
            {
              id: 'pm-research',
              title: 'PM // Research & Plan // All Segments & Services',
              icon: '🔍',
              type: 'database',
              status: 'Execution',
              content: [],
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 'pm-content',
              title: 'PM // Content Plan & Tracking // All Segments',
              icon: '📝',
              type: 'database',
              status: 'Execution',
              content: [],
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 'pb-research',
              title: 'PB // Research & Start Planning',
              icon: '📊',
              type: 'database',
              status: 'Execution',
              content: [],
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ]
        },
        {
          id: 'inbox-marketing',
          title: 'Inbox',
          order: 3,
          pages: [
            {
              id: 'weekly-wrap',
              title: 'Weekly Wrap-Up',
              icon: '📊',
              type: 'database',
              status: 'Inbox',
              content: [],
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 'concerns',
              title: 'Concerns & Supports',
              icon: '❗',
              type: 'database',
              status: 'Inbox',
              content: [],
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ]
        }
      ]
    },
    {
      id: 'bd-sales',
      title: 'BD & Sales',
      icon: '💼',
      order: 3,
      pages: [],
      subsections: [
        {
          id: 'management-bd',
          title: 'Management',
          order: 1,
          pages: [
            {
              id: 'overview-bd',
              title: 'Overview & Quarter Strategy',
              icon: '📋',
              type: 'database',
              status: 'Management',
              content: [],
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 'sales-process',
              title: 'Sales Process _ Guideline',
              icon: '📝',
              type: 'database',
              status: 'Management',
              content: [],
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ]
        },
        {
          id: 'execution-bd',
          title: 'Execution',
          order: 2,
          pages: [
            {
              id: 'bd-strategy',
              title: 'BD & Sales Strategy // Develop alignment among team',
              icon: '🎯',
              type: 'database',
              status: 'Execution',
              assignees: ['Allan', 'Sagar Gupta Gupta'],
              content: [],
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ]
        },
        {
          id: 'inbox-bd',
          title: 'Inbox',
          order: 3,
          pages: [
            {
              id: 'daily-standup',
              title: 'Daily Stand-Up',
              icon: '☀️',
              type: 'database',
              status: 'Inbox',
              content: [],
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 'weekly-wrap-bd',
              title: 'Weekly Wrap-Up',
              icon: '📊',
              type: 'database',
              status: 'Inbox',
              content: [],
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ]
        }
      ]
    },
    {
      id: 'hr-operation',
      title: 'HR & Operation',
      icon: '👥',
      order: 4,
      pages: [
        {
          id: 'hr-policies',
          title: 'HR Policies & Guidelines',
          icon: '📋',
          type: 'page',
          content: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      subsections: [
        {
          id: 'management-hr',
          title: 'Management',
          order: 1,
          pages: []
        },
        {
          id: 'execution-hr',
          title: 'Execution',
          order: 2,
          pages: []
        },
        {
          id: 'inbox-hr',
          title: 'Inbox',
          order: 3,
          pages: []
        }
      ]
    }
  ],
  createdAt: new Date(),
  updatedAt: new Date()
};