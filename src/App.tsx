import React, { useState } from 'react';
import { Grid3x3, Database, FolderSync, FileStack, Home, LayoutDashboard, Settings, Users, ChevronRight, ChevronDown, Folder, FileText, BarChart, Bell, Component, CalendarCheck, Network, ChartColumn, Package } from 'lucide-react'; // 아이콘 임포트
import CalendarView from './components/CalendarView'; // ScheduleManage 컴포넌트 임포트
import TreeComp from './components/TreeChart/TreeComp'; // TreeComp 컴포넌트 임포트
import ChartComp from './components/ChartComp'; // ChartComp 컴포넌트 임포트
import JsonToText from './components/JsonToText'; // JsonToText 컴포넌트 임포트
import ScheduleChart from './components/ScheduleChart/ScheduleChart'; // ScheduleChart 컴포넌트 임포트
import MatrixD3 from './components/MatrixD3'; // Matrix 컴포넌트 임포트
import MatrixReact from './components/MatrixReact'; // Matrix 컴포넌트 임포트

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
        children: [
          {
            name: 'Calendar View',
            icon: CalendarCheck,
            path: '/components/CalendarView',
          },
          {
            name: 'Schedule Chart',
            icon: CalendarCheck,
            path: '/components/ScheduleChart',
          },
        ],
      },
      {
        name: 'Tree 관리',
        icon: Network,
        path: '/components/TreeComp',
      },
      {
        name: 'Chart 관리',
        icon: ChartColumn,
        path: '/components/ChartComp',
      },
      {
        name: 'Matrix',
        icon: Grid3x3,
        children: [
          {
            name: 'Matrix D3',
            icon: Grid3x3,
            path: '/components/MatrixD3',
          },
          {
            name: 'Matrix React',
            icon: Grid3x3,
            path: '/components/MatrixReact',
          },
        ],
      },
    ],
  },
  {
    name: 'Platform Comp 관리',
    icon: Package,
    children: [
      {
        name: 'File Exchange',
        icon: FileStack,
        children: [
          {
            name: 'JSON to Text',
            icon: FileStack,
            path: '/components/JsonToText',
          },
          {
            name: 'JSON to Excel',
            icon: FileStack,
            path: '/components/JsonToExcel',
          }
        ],
      },
      {
        name: 'Database 관리',
        icon: Database,
        path: '/components/Database',
      },
      {
        name: 'Import/Export',
        icon: FolderSync,
        path: '/components/ImportExport',
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
  level: number;
  activePath: string;
  onNavigate: (path: string) => void;
  openMenus: string[];
  toggleMenu: (name: string) => void;
  parentFontSizeRem?: number; // 부모 글자 크기 rem 단위
  childFontScale?: number;    // 자식 글자 크기 비율 (예: 0.85)
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  item,
  level,
  activePath,
  onNavigate,
  openMenus,
  toggleMenu,
  parentFontSizeRem = 1.0,
  childFontScale = 0.85,
}) => {
  const isOpen = item.children && openMenus.includes(item.name);
  const isActive = item.path === activePath;

  // 글자 크기 계산: 최상위는 parentFontSizeRem, 하위는 scale 적용
  const fontSize =
    level === 0
      ? `${parentFontSizeRem}rem`
      : `${parentFontSizeRem * Math.pow(childFontScale, level)}rem`;

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
          ${level > 0 ? `ml-${level * 4}` : ''}
        `}
        onClick={handleClick}
        style={{ fontSize }}
      >
        <div className="flex items-center">
          {item.icon && <item.icon size={20} className="mr-3" />}
          <span className="font-medium">{item.name}</span>
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
              parentFontSizeRem={parentFontSizeRem}
              childFontScale={childFontScale}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Sidebar 컴포넌트
interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  activePath: string;
  onNavigate: (path: string) => void;
  parentFontSizeRem?: number; // 추가: 부모 글자 크기 rem
  childFontScale?: number;    // 추가: 자식 글자 크기 비율
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  toggleSidebar,
  activePath,
  onNavigate,
  parentFontSizeRem = 1.0, // 1rem = 16px
  childFontScale = 0.85,    // 자식은 부모의 85%
}) => {
  const [openMenus, setOpenMenus] = useState<string[]>([]);

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
                parentFontSizeRem={parentFontSizeRem}
                childFontScale={childFontScale}
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
            {activePath === '/components/CalendarView' ? (
              <CalendarView />
            ) : activePath === '/components/TreeComp' ? (
              <TreeComp />
            ) : activePath === '/components/ChartComp' ? (
              <ChartComp />
            ) : activePath === '/components/JsonToText' ? (
              <JsonToText />
            ) : activePath === '/components/ScheduleChart' ? (
              <ScheduleChart />
            ) : activePath === '/components/MatrixD3' ? (
              <MatrixD3 />
            ) : activePath === '/components/MatrixReact' ? (
              <MatrixReact />
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
