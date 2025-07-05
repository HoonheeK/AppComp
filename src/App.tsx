import React, { useState } from 'react';
import { Home, LayoutDashboard, Settings, Users, ChevronRight, ChevronDown, Folder, FileText, BarChart, Bell, Component, CalendarCheck, Network } from 'lucide-react'; // 아이콘 임포트
import ScheduleManage from './components/ScheduleManage'; // ScheduleManage 컴포넌트 임포트
import TreeComp from './components/TreeComp'; // TreeComp 컴포넌트 임포트

// 내비게이션 항목의 타입을 정의합니다.
interface NavItem {
  name: string;
  icon: React.ElementType; // 아이콘 컴포넌트를 받기 위한 타입
  path?: string;
  children?: NavItem[];
}

// 사이드바 내비게이션 항목 데이터
const navItems: NavItem[] = [
  {
    name: '대시보드',
    icon: LayoutDashboard,
    path: '/',
  },
  {
    name: '사용자 관리',
    icon: Users,
    children: [
      {
        name: '모든 사용자',
        icon: Users,
        path: '/users/all',
      },
      {
        name: '사용자 추가',
        icon: Users,
        path: '/users/add',
      },
    ],
  },
  {
    name: 'App Comp 관리',
    icon: Component,
    children: [
      {
        name: 'Schedule 관리',
        icon: CalendarCheck,
        path: '/components/ScheduleManage',
      },
      {
        name: 'Tree 관리',
        icon: Network,
        path: '/components/TreeComp',
      },
    ],
  },
  {
    name: '프로젝트',
    icon: Folder,
    children: [
      {
        name: '내 프로젝트',
        icon: Folder,
        path: '/projects/my',
      },
      {
        name: '새 프로젝트',
        icon: Folder,
        path: '/projects/new',
      },
      {
        name: '문서',
        icon: FileText,
        children: [
          {
            name: '기술 문서',
            icon: FileText,
            path: '/projects/docs/tech',
          },
          {
            name: '사용자 가이드',
            icon: FileText,
            path: '/projects/docs/guide',
          },
        ],
      },
    ],
  },
  {
    name: '설정',
    icon: Settings,
    path: '/settings',
  },
  {
    name: '보고서',
    icon: BarChart,
    path: '/reports',
  },
  {
    name: '알림',
    icon: Bell,
    path: '/notifications',
  },
];

// SidebarItem 컴포넌트는 단일 내비게이션 항목을 렌더링합니다.
interface SidebarItemProps {
  item: NavItem;
  level: number; // 중첩 레벨을 나타냅니다 (들여쓰기용)
  activePath: string; // 현재 활성화된 경로
  onNavigate: (path: string) => void; // 경로 변경 핸들러
  openMenus: string[]; // 현재 열려 있는 메뉴들의 이름 배열
  toggleMenu: (name: string) => void; // 메뉴 토글 핸들러
}

const SidebarItem: React.FC<SidebarItemProps> = ({ item, level, activePath, onNavigate, openMenus, toggleMenu }) => {
  const isOpen = item.children && openMenus.includes(item.name); // 자식 메뉴가 있고 현재 열려 있는지 확인
  const isActive = item.path === activePath; // 현재 항목이 활성화되었는지 확인

  // 클릭 핸들러: 경로가 있으면 이동, 자식 메뉴가 있으면 토글
  const handleClick = () => {
    if (item.path) {
      onNavigate(item.path);
    }
    if (item.children) {
      toggleMenu(item.name);
    }
  };

  return (
    <div>
      <div
        className={`
          flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors duration-200
          ${isActive ? 'bg-indigo-700 text-white' : 'text-gray-300 hover:bg-gray-700'}
          ${level > 0 ? `ml-${level * 4}` : ''} // 중첩 레벨에 따라 들여쓰기
        `}
        onClick={handleClick}
      >
        <div className="flex items-center">
          {item.icon && <item.icon size={20} className="mr-3" />}
          <span className="text-sm font-medium">{item.name}</span>
        </div>
        {item.children && (
          <div className="ml-auto">
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
        )}
      </div>

      {/* 자식 메뉴 렌더링 (열려 있을 때만) */}
      {item.children && isOpen && (
        <div className="mt-1">
          {item.children.map((child, index) => (
            <SidebarItem
              key={index}
              item={child}
              level={level + 1}
              activePath={activePath}
              onNavigate={onNavigate}
              openMenus={openMenus}
              toggleMenu={toggleMenu}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Sidebar 컴포넌트
interface SidebarProps {
  isOpen: boolean; // 사이드바가 열려 있는지 여부
  toggleSidebar: () => void; // 사이드바 토글 핸들러
  activePath: string; // 현재 활성화된 경로
  onNavigate: (path: string) => void; // 경로 변경 핸들러
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar, activePath, onNavigate }) => {
  const [openMenus, setOpenMenus] = useState<string[]>([]); // 열려 있는 다단계 메뉴들의 이름

  // 메뉴 토글 핸들러
  const toggleMenu = (menuName: string) => {
    setOpenMenus((prevOpenMenus) =>
      prevOpenMenus.includes(menuName)
        ? prevOpenMenus.filter((name) => name !== menuName) // 이미 열려 있으면 닫기
        : [...prevOpenMenus, menuName] // 닫혀 있으면 열기
    );
  };

  return (
    <div
      className={`
        fixed inset-y-0 left-0 z-40 bg-gray-800 text-white w-64 p-4
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:h-auto lg:w-64
      `}
    >
      {/* 모바일에서만 보이는 닫기 버튼 */}
      <button
        onClick={toggleSidebar}
        className="absolute top-4 right-4 text-gray-400 hover:text-white lg:hidden"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>

      {/* 로고 또는 앱 이름 */}
      <div className="flex items-center mb-6">
        <Home size={28} className="mr-3 text-indigo-400" />
        <h1 className="text-2x1 font-bold text-indigo-400">App Comp</h1>
      </div>

      {/* 내비게이션 메뉴 */}
      <nav>
        <ul>
          {navItems.map((item, index) => (
            <li key={index} className="mb-2">
              <SidebarItem
                item={item}
                level={0} // 최상위 레벨
                activePath={activePath}
                onNavigate={onNavigate}
                openMenus={openMenus}
                toggleMenu={toggleMenu}
              />
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

// App 컴포넌트
const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // 사이드바 열림/닫힘 상태
  const [activePath, setActivePath] = useState('/'); // 현재 활성화된 경로

  // 사이드바 토글 핸들러
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // 경로 변경 핸들러
  const handleNavigate = (path: string) => {
    setActivePath(path);
    // 모바일에서는 경로 변경 후 사이드바 닫기
    if (window.innerWidth < 1024) { // Tailwind의 'lg' breakpoint 기준
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 font-inter"> {/* Inter 폰트 적용 */}
      {/* 사이드바 */}
      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        activePath={activePath}
        onNavigate={handleNavigate}
      />

      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 flex flex-col">
        {/* 헤더 (모바일에서 사이드바 토글 버튼 포함) */}
        <header className="bg-white shadow-md p-4 flex items-center justify-between lg:justify-end">
          <button
            onClick={toggleSidebar}
            className="text-gray-600 hover:text-gray-900 lg:hidden"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
          <div className="text-lg font-semibold text-gray-800">
            현재 페이지: <span className="text-indigo-600">{activePath}</span>
          </div>
        </header>

        {/* 실제 콘텐츠 영역 */}
        <main className="flex-1 p-6">
          <div className="bg-white rounded-lg shadow-lg p-8">
            {activePath === '/components/ScheduleManage' ? (
              <ScheduleManage />
            ) : activePath === '/components/TreeComp' ? (
              <TreeComp />
            ) : (
              <>
                <h2 className="text-3xl font-bold text-gray-800 mb-4">환영합니다!</h2>
                <p className="text-gray-700 text-lg">
                  이것은 다단계 사이드바를 갖춘 예시 애플리케이션입니다.
                  왼쪽 사이드바에서 메뉴 항목을 클릭하여 탐색해보세요.
                  <br /><br />
                  현재 활성화된 경로는 <span className="font-semibold text-indigo-600">{activePath}</span> 입니다.
                </p>
                <div className="mt-6 p-4 bg-blue-50 rounded-md border border-blue-200 text-blue-800">
                  <p className="font-medium">팁:</p>
                  <ul className="list-disc list-inside mt-2">
                    <li>상위 메뉴를 클릭하여 하위 메뉴를 확장하거나 축소할 수 있습니다.</li>
                    <li>모바일 화면에서는 왼쪽 상단의 메뉴 아이콘을 클릭하여 사이드바를 열 수 있습니다.</li>
                    <li>각 메뉴 항목은 현재 활성화된 경로를 표시합니다.</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
