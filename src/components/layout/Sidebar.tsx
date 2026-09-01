import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  const getUserRole = () => {
    const roles = user?.userRoles.map(ur => ur.role.name) || [];
    if (roles.includes('SuperAdmin')) return 'SuperAdmin';
    if (roles.includes('Admin')) return 'Admin';
    if (roles.includes('Teacher')) return 'Teacher';
    if (roles.includes('Student')) return 'Student';
    return roles[0] || 'User';
  };

  const userRole = getUserRole();

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['SuperAdmin', 'Admin', 'Teacher', 'Student'] },
    { path: '/courses', label: userRole === 'Student' ? 'My Courses' : userRole === 'Teacher' ? 'Teaching Courses' : 'Course Management', icon: '📚', roles: ['SuperAdmin', 'Admin', 'Teacher', 'Student'] },
    { path: '/exams', label: userRole === 'Student' ? 'My Exams & Quizzes' : 'Exams & Questions', icon: '📝', roles: ['SuperAdmin', 'Admin', 'Teacher', 'Student'] },
    { path: '/grading', label: 'Grading Studio', icon: '✅', roles: ['SuperAdmin', 'Admin', 'Teacher'] },
    { path: '/students', label: userRole === 'Teacher' ? 'My Class Students' : 'Student Directory', icon: '👥', roles: ['SuperAdmin', 'Admin', 'Teacher'] },
    { path: '/teachers', label: userRole === 'Student' ? 'My Instructors' : 'Teacher Directory', icon: '👨‍🏫', roles: ['SuperAdmin', 'Admin', 'Student'] },
    { path: '/id-cards', label: userRole === 'Student' ? 'My Student ID' : userRole === 'Teacher' ? 'My Teacher ID' : 'ID Cards & QR', icon: '🪪', roles: ['SuperAdmin', 'Admin', 'Teacher', 'Student'] },
    { path: '/attendance', label: userRole === 'Student' ? 'My Attendance' : 'Attendance', icon: '✓', roles: ['SuperAdmin', 'Admin', 'Teacher', 'Student'] },
    { path: '/discussions', label: 'Discussions', icon: '💬', roles: ['SuperAdmin', 'Admin', 'Teacher', 'Student'] },
    { path: '/certificates', label: userRole === 'Student' ? 'My Certificates' : 'Certificates', icon: '🏅', roles: ['SuperAdmin', 'Admin', 'Teacher', 'Student'] },
    { path: '/reports', label: 'Reports', icon: '📈', roles: ['SuperAdmin', 'Admin', 'Teacher'] },
    { path: '/fees', label: 'Fees & Finance', icon: '💰', roles: ['SuperAdmin', 'Admin'] },
    { path: '/search', label: 'Search', icon: '🔎', roles: ['SuperAdmin', 'Admin', 'Teacher', 'Student'] },
    { path: '/notifications', label: 'Notifications', icon: '🔔', roles: ['SuperAdmin', 'Admin', 'Teacher', 'Student'], badge: unreadCount },
    { path: '/settings', label: 'Settings / RBAC', icon: '⚙️', roles: ['SuperAdmin'] },
  ];

  const visibleItems = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <div className="glass m-3 flex h-[calc(100vh-1.5rem)] w-64 shrink-0 flex-col overflow-y-auto text-slate-900 dark:text-white">
      {/* Logo */}
      <div className="border-b border-white/30 p-6 dark:border-white/10">
        <h2 className="bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-2xl font-bold text-transparent dark:from-indigo-300 dark:to-cyan-300">
          TZIT
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Education ERP</p>
      </div>

      {/* User Info */}
      {user && (
        <div className="border-b border-white/30 p-6 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 font-semibold text-white shadow-lg shadow-indigo-500/20">
              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{userRole}</p>
            </div>
          </div>
        </div>
      )}

      {/* Menu Items */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {visibleItems.map(item => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`
                  flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200
                  ${location.pathname === item.path
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-slate-600 hover:bg-white/40 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-xs font-bold ${
                    location.pathname === item.path ? 'bg-white text-indigo-600' : 'bg-rose-500 text-white'
                  }`}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-white/30 p-4 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
        <p>© 2024 TZIT Education</p>
      </div>
    </div>
  );
};
