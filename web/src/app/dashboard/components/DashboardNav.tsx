import Link from 'next/link';

interface DashboardNavProps {
  currentPath: string;
}

export default function DashboardNav({ currentPath }: DashboardNavProps) {
  const navItems = [
    { href: '/dashboard', label: 'ダッシュボード' },
    { href: '/dashboard/clients', label: 'OAuth2クライアント' },
    { href: '/dashboard/users', label: 'ユーザー管理' },
  ];

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href as never}
              className={`px-1 py-4 text-sm font-medium ${
                currentPath === item.href
                  ? 'border-b-2 border-indigo-500 text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}