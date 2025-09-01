'use client';

import { Home, Users, FileText, Calendar, BarChart3, UserCheck, Settings } from 'lucide-react';

const menuItems = [
  { icon: Home, label: 'Dashboard', active: true },
  { icon: Users, label: 'Team Management' },
  { icon: FileText, label: 'Projects' },
  { icon: Calendar, label: 'Calendar' },
  { icon: BarChart3, label: 'Analytics' },
  { icon: UserCheck, label: 'Attendance' },
  { icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white shadow-sm h-screen sticky top-0">
      <nav className="p-4 space-y-2">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              className={`flex items-center space-x-3 p-3 rounded-lg w-full text-left transition-colors ${
                item.active
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon size={20} />
              <span className={item.active ? 'font-medium' : ''}>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}