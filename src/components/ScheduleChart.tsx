import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { MouseEvent } from 'react';

// 타입 정의
type Task = {
  id: string;
  name: string;
  start: string;
  end: string;
  progress: number;
  dependencies: string[];
};

type NonWorkingDays = Record<string, boolean>;

interface NonWorkingDayPickerProps {
  initialNonWorkingDays: NonWorkingDays;
  onSave: (days: NonWorkingDays) => void;
  onClose: () => void;
  year: number;
}

// 날짜 유틸리티 함수
const addDays = (date: Date | string, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const formatDate = (date: Date | string | null): string => {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

const getDaysBetween = (startDate: Date | string, endDate: Date | string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// NonWorkingDayPicker 컴포넌트
const NonWorkingDayPicker: React.FC<NonWorkingDayPickerProps> = ({ initialNonWorkingDays, onSave, onClose, year }) => {
  const [selectedDays, setSelectedDays] = useState<NonWorkingDays>(() => {
    const daysMap: NonWorkingDays = {};
    Object.keys(initialNonWorkingDays).forEach(dateStr => {
      daysMap[dateStr] = true;
    });
    return daysMap;
  });

  const toggleDay = (dateStr: string) => {
    setSelectedDays(prev => {
      const newDays = { ...prev };
      if (newDays[dateStr]) {
        delete newDays[dateStr];
      } else {
        newDays[dateStr] = true;
      }
      return newDays;
    });
  };

  const renderMonth = (monthIndex: number) => {
    const firstDayOfMonth = new Date(year, monthIndex, 1);
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const startDayOfWeek = firstDayOfMonth.getDay();

    const days: React.ReactNode[] = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(<div key={`empty-${monthIndex}-${i}`} className="w-8 h-8 flex items-center justify-center"></div>);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(year, monthIndex, i);
      const dateStr = formatDate(currentDate);
      const isSelected = selectedDays[dateStr];
      const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;

      days.push(
        <div
          key={dateStr}
          className={`w-8 h-8 flex items-center justify-center text-sm rounded-full
            ${isSelected ? 'bg-red-500 text-white' : (isWeekend ? 'bg-gray-200 text-gray-700' : 'bg-white text-gray-800')}
            hover:bg-gray-300 transition-colors cursor-pointer`}
          onClick={() => toggleDay(dateStr)}
        >
          {i}
        </div>
      );
    }

    return (
      <div key={`month-${monthIndex}`} className="flex flex-col items-center p-2 border border-gray-200 rounded-md">
        <div className="font-semibold mb-2">
          {firstDayOfMonth.toLocaleString('ko-KR', { month: 'long' })} {year}
        </div>
        <div className="grid grid-cols-7 gap-1 text-xs text-gray-500 mb-1">
          {['일', '월', '화', '수', '목', '금', '토'].map(day => (
            <div key={day} className="w-8 h-8 flex items-center justify-center">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Non-Working Days 설정 ({year}년)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(12).keys()].map(monthIndex => renderMonth(monthIndex))}
        </div>
        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
            onClick={onClose}
            type="button"
          >
            닫기
          </button>
          <button
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            onClick={() => onSave(selectedDays)}
            type="button"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

const HISTORY_LIMIT = 20;

// 간트 차트 컴포넌트
const ScheduleChart: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(
    [
      { id: '1', name: '프로젝트 계획', start: '2025-07-01', end: '2025-07-05', progress: 100, dependencies: [] },
      { id: '2', name: '요구사항 수집', start: '2025-07-06', end: '2025-07-10', progress: 70, dependencies: ['1'] },
      { id: '3', name: '디자인', start: '2025-07-11', end: '2025-07-18', progress: 40, dependencies: ['2'] },
      { id: '4', name: '개발', start: '2025-07-19', end: '2025-07-30', progress: 10, dependencies: ['3'] },
      { id: '5', name: '테스트', start: '2025-07-25', end: '2025-08-05', progress: 0, dependencies: ['4'] },
      { id: '6', name: '배포', start: '2025-08-06', end: '2025-08-08', progress: 0, dependencies: ['5'] },
    ]
  );
  // History 상태 추가
  const [history, setHistory] = useState<Task[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const chartYear = new Date().getFullYear();
//   const todayDate = new Date().getDay();
  const startDate = new Date(`${chartYear-1}-06-28`);
  const endDate = new Date(`${chartYear+1}-08-15`);
  const totalDays = getDaysBetween(startDate, endDate) + 1;

  const dayWidth = 15;
  const taskHeight = 40;
  const rowGap = 10;

  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const isScrollingLeft = useRef(false);
  const isScrollingRight = useRef(false);

  const taskRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState<number>(0);
  const [dragMode, setDragMode] = useState<'move' | 'resize-left' | 'resize-right' | ''>('');

  const [nonWorkingDays, setNonWorkingDays] = useState<NonWorkingDays>({});
  const [showNonWorkingCalendar, setShowNonWorkingCalendar] = useState<boolean>(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskStart, setNewTaskStart] = useState(formatDate(new Date()));
  const [newTaskEnd, setNewTaskEnd] = useState(formatDate(new Date()));
  const [newTaskProgress, setNewTaskProgress] = useState(0);

  const getDates = useCallback((): string[] => {
    const dates: string[] = [];
    for (let i = 0; i < totalDays; i++) {
      dates.push(formatDate(addDays(startDate, i)));
    }
    return dates;
  }, [startDate, totalDays]);

  const dates = getDates();

  const getTaskPositionAndWidth = useCallback((task: Task) => {
    const taskStart = new Date(task.start);
    const taskEnd = new Date(task.end);

    const startOffsetDays = getDaysBetween(startDate, taskStart);
    const durationDays = getDaysBetween(taskStart, taskEnd) + 1;

    const x = startOffsetDays * dayWidth;
    const width = durationDays * dayWidth;

    return { x, width };
  }, [startDate, dayWidth]);

  const handleMouseDown = useCallback(
    (e: MouseEvent<HTMLDivElement>, taskId: string, mode: 'move' | 'resize-left' | 'resize-right') => {
      e.preventDefault();
      setIsDragging(true);
      setDraggedTaskId(taskId);
      setDragMode(mode);
      setDragStartX(e.clientX);
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent | globalThis.MouseEvent) => {
      if (!isDragging || !draggedTaskId) return;

      const dx = e.clientX - dragStartX;
      const daysMoved = Math.round(dx / dayWidth);

      setTasks(prevTasks =>
        prevTasks.map(task => {
          if (task.id === draggedTaskId) {
            const currentStart = new Date(task.start);
            const currentEnd = new Date(task.end);

            if (dragMode === 'move') {
              const newStart = addDays(currentStart, daysMoved);
              const newEnd = addDays(currentEnd, daysMoved);
              return { ...task, start: formatDate(newStart), end: formatDate(newEnd) };
            } else if (dragMode === 'resize-left') {
              const newStart = addDays(currentStart, daysMoved);
              if (new Date(newStart) <= currentEnd) {
                return { ...task, start: formatDate(newStart) };
              }
            } else if (dragMode === 'resize-right') {
              const newEnd = addDays(currentEnd, daysMoved);
              if (new Date(newEnd) >= currentStart) {
                return { ...task, end: formatDate(newEnd) };
              }
            }
          }
          return task;
        })
      );
      setDragStartX(e.clientX);
    },
    [isDragging, draggedTaskId, dragStartX, dragMode, dayWidth]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDraggedTaskId(null);
    setDragMode('');
  }, []);

  useEffect(() => {
    const onMove = (e: globalThis.MouseEvent) => handleMouseMove(e);
    const onUp = () => handleMouseUp();
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleLeftScroll = useCallback(() => {
    if (!isScrollingRight.current && rightScrollRef.current && leftScrollRef.current) {
      isScrollingLeft.current = true;
      rightScrollRef.current.scrollTop = leftScrollRef.current.scrollTop;
    }
    isScrollingLeft.current = false;
  }, []);

  const handleRightScroll = useCallback(() => {
    if (!isScrollingLeft.current && leftScrollRef.current && rightScrollRef.current) {
      isScrollingRight.current = true;
      leftScrollRef.current.scrollTop = rightScrollRef.current.scrollTop;
    }
    isScrollingRight.current = false;
  }, []);

  const renderDependencyLines = useCallback(() => {
    const lines: React.ReactNode[] = [];
    tasks.forEach((task, taskIndex) => {
      task.dependencies.forEach(predecessorId => {
        const predecessorTask = tasks.find(t => t.id === predecessorId);
        if (predecessorTask) {
          const { x: predecessorX, width: predecessorWidth } = getTaskPositionAndWidth(predecessorTask);
          const { x: successorX } = getTaskPositionAndWidth(task);

          const startPoint = {
            x: predecessorX + predecessorWidth,
            y: tasks.indexOf(predecessorTask) * (taskHeight + rowGap) + taskHeight / 2,
          };
          const endPoint = {
            x: successorX,
            y: taskIndex * (taskHeight + rowGap) + taskHeight / 2,
          };

          const arrowOffset = 5;

          lines.push(
            <path
              key={`${predecessorId}-${task.id}`}
              d={`M ${startPoint.x} ${startPoint.y}
                  L ${startPoint.x + 10} ${startPoint.y}
                  V ${endPoint.y}
                  H ${endPoint.x - arrowOffset}`}
              stroke="#6b7280"
              strokeWidth={2}
              fill="none"
              markerEnd="url(#arrowhead)"
            />
          );
        }
      });
    });
    return lines;
  }, [tasks, getTaskPositionAndWidth, taskHeight, rowGap]);

  // 타임라인/막대 패널의 빈 공간 클릭 시 선택 해제
  const handleChartBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // 막대(Task) 위 클릭이 아니면 선택 해제
    if (e.target === e.currentTarget) {
      setSelectedTaskId(null);
    }
  };

  // 작업 이름 패널의 빈 공간 클릭 시 선택 해제
  const handleTaskListBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setSelectedTaskId(null);
    }
  };

  // History 상태 최초 설정
  useEffect(() => {
    setHistory([tasks]);
    setHistoryIndex(0);
    // eslint-disable-next-line
  }, []);

  // 히스토리 push 함수
  const pushHistory = useCallback((nextTasks: Task[]) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1).concat([nextTasks]);
      // 최대 HISTORY_LIMIT 개만 유지
      if (newHistory.length > HISTORY_LIMIT) {
        newHistory.shift();
      }
      return newHistory;
    });
    setHistoryIndex(idx => Math.min(idx + 1, HISTORY_LIMIT - 1));
  }, [historyIndex]);

  // Task 변경 시 히스토리 기록
  const updateTasks = useCallback((updater: (prev: Task[]) => Task[]) => {
    setTasks(prev => {
      const next = updater(prev);
      pushHistory(next);
      return next;
    });
  }, [pushHistory]);

  // Undo/Redo 핸들러
  const handleUndo = () => {
    if (historyIndex > 0) {
      setTasks(history[historyIndex - 1]);
      setHistoryIndex(historyIndex - 1);
    }
  };
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setTasks(history[historyIndex + 1]);
      setHistoryIndex(historyIndex + 1);
    }
  };

  // 단축키 핸들러 (Ctrl+Z, Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, historyIndex, history]);

  // Task 추가 핸들러
  const handleAddTask = () => {
    if (!newTaskName.trim() || !newTaskStart || !newTaskEnd) return;
    const newTask: Task = {
      id: Date.now().toString(),
      name: newTaskName.trim(),
      start: newTaskStart,
      end: newTaskEnd,
      progress: newTaskProgress,
      dependencies: [],
    };
    updateTasks(prev => [...prev, newTask]);
    setShowAddTaskModal(false);
    setNewTaskName('');
    setNewTaskStart(formatDate(new Date()));
    setNewTaskEnd(formatDate(new Date()));
    setNewTaskProgress(0);
  };

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; taskId: string } | null>(null);

  // Task 삭제 함수
  const handleDeleteTask = useCallback((taskId: string | null) => {
    if (!taskId) return;
    updateTasks(prev => prev.filter(task => task.id !== taskId));
    setSelectedTaskId(null);
    setContextMenu(null);
  }, [updateTasks]);

  // Delete 키로 삭제
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedTaskId) {
        handleDeleteTask(selectedTaskId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTaskId, handleDeleteTask]);

  // Context Menu 열기
  const handleTaskContextMenu = (e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      taskId,
    });
    setSelectedTaskId(taskId);
  };

  // Context Menu 닫기
  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    if (contextMenu) {
      window.addEventListener('click', closeMenu);
      return () => window.removeEventListener('click', closeMenu);
    }
  }, [contextMenu]);

  // Timeline 헤더 정보 생성 함수
const getTimelineHeaderRows = useCallback(() => {
  const years: { value: string; start: number; span: number }[] = [];
  const months: { value: string; start: number; span: number }[] = [];
  let prevYear = '';
  let prevMonth = '';
  let yearStart = 0;
  let monthStart = 0;

  dates.forEach((date, idx) => {
    const d = new Date(date);
    const year = d.getFullYear().toString();
    const month = d.toLocaleString('ko-KR', { month: 'short' });

    // 연도 처리
    if (year !== prevYear) {
      if (prevYear !== '') {
        years.push({ value: prevYear, start: yearStart, span: idx - yearStart });
      }
      prevYear = year;
      yearStart = idx;
    }
    // 월 처리
    if (month !== prevMonth || year !== prevYear) {
      if (prevMonth !== '') {
        months.push({ value: prevMonth, start: monthStart, span: idx - monthStart });
      }
      prevMonth = month;
      monthStart = idx;
    }
    // 마지막 처리
    if (idx === dates.length - 1) {
      years.push({ value: year, start: yearStart, span: idx - yearStart + 1 });
      months.push({ value: month, start: monthStart, span: idx - monthStart + 1 });
    }
  });

  return { years, months };
}, [dates]);

  const timelineHeaderRef = useRef<HTMLDivElement>(null);

  const handleChartScroll = useCallback(() => {
    if (rightScrollRef.current && timelineHeaderRef.current) {
      timelineHeaderRef.current.scrollLeft = rightScrollRef.current.scrollLeft;
    }
  }, []);

  const handleHeaderScroll = useCallback(() => {
    if (timelineHeaderRef.current && rightScrollRef.current) {
      rightScrollRef.current.scrollLeft = timelineHeaderRef.current.scrollLeft;
    }
  }, []);

  return (
    <div className="p-4 bg-gray-100 min-h-screen font-inter flex flex-col items-center">
      <div className="flex justify-between items-center w-full max-w-6xl mb-6">
        <h1 className="text-3xl font-bold text-gray-800">React 간트 차트</h1>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 bg-green-600 text-gray-500 rounded-md shadow-md hover:bg-green-700 transition-colors"
            onClick={() => setShowAddTaskModal(true)}
            type="button"
          >
            + Task
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-gray-500 rounded-md shadow-md hover:bg-blue-700 transition-colors"
            onClick={() => setShowNonWorkingCalendar(true)}
            type="button"
          >
            Non-Working days 설정
          </button>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-white border border-gray-300 rounded shadow-lg py-1"
          style={{ top: contextMenu.y, left: contextMenu.x, minWidth: 120 }}
          onClick={e => e.stopPropagation()}
        >
          <button
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
            onClick={() => handleDeleteTask(contextMenu.taskId)}
          >
            🗑️ Task 삭제
          </button>
        </div>
      )}

      {/* Task 추가 모달 */}
      {showAddTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4 text-gray-800">새 Task 추가</h2>
            <div className="mb-3">
              <label className="block text-gray-700 mb-1">작업명</label>
              <input
                type="text"
                className="w-full border rounded px-2 py-1"
                value={newTaskName}
                onChange={e => setNewTaskName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="mb-3 flex gap-2">
              <div className="flex-1">
                <label className="block text-gray-700 mb-1">시작일</label>
                <input
                  type="date"
                  className="w-full border rounded px-2 py-1"
                  value={newTaskStart}
                  onChange={e => setNewTaskStart(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label className="block text-gray-700 mb-1">종료일</label>
                <input
                  type="date"
                  className="w-full border rounded px-2 py-1"
                  value={newTaskEnd}
                  min={newTaskStart}
                  onChange={e => setNewTaskEnd(e.target.value)}
                />
              </div>
            </div>
            <div className="mb-3">
              <label className="block text-gray-700 mb-1">진행률 (%)</label>
              <input
                type="number"
                className="w-full border rounded px-2 py-1"
                value={newTaskProgress}
                min={0}
                max={100}
                onChange={e => setNewTaskProgress(Number(e.target.value))}
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition"
                onClick={() => setShowAddTaskModal(false)}
                type="button"
              >
                취소
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-gray-500 rounded-md hover:bg-green-700 transition"
                onClick={handleAddTask}
                disabled={!newTaskName.trim() || !newTaskStart || !newTaskEnd}
                type="button"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      {showNonWorkingCalendar && (
        <NonWorkingDayPicker
          year={chartYear}
          initialNonWorkingDays={nonWorkingDays}
          onSave={(newDays) => {
            setNonWorkingDays(newDays);
            setShowNonWorkingCalendar(false);
          }}
          onClose={() => setShowNonWorkingCalendar(false)}
        />
      )}

      <div className="flex bg-white rounded-lg shadow-xl overflow-hidden w-full max-w-6xl" style={{ maxHeight: 'calc(100vh - 150px)' }}>
        {/* 작업 이름 패널 */}
        <div className="w-1/4 bg-gray-50 border-r border-gray-200 p-4 flex flex-col">
          <div className="grid grid-cols-3 gap-2 font-semibold text-gray-700 mb-2 h-10 items-center flex-shrink-0">
            <div>작업 이름</div>
            <div className="text-center">시작일</div>
            <div className="text-center">기간</div>
          </div>
          <div className="overflow-y-auto" ref={leftScrollRef} onScroll={handleLeftScroll} style={{ flexGrow: 1 }} onClick={handleTaskListBackgroundClick}>
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`grid grid-cols-3 gap-2 items-center h-10 px-3 py-2 text-sm border-b border-gray-200 last:border-b-0 cursor-pointer
                  ${selectedTaskId === task.id ? 'bg-yellow-100' : 'bg-transparent'}
                `}
                style={{ height: taskHeight + rowGap }}
                onClick={e => {
                  e.stopPropagation();
                  setSelectedTaskId(task.id);
                }}
                onContextMenu={e => handleTaskContextMenu(e, task.id)}
              >
                <div>{task.name}</div>
                {/* <div className="text-center">{task.start.substring(5)}</div> */}
                <div className="text-center">{task.start}</div>
                <div className="text-center">{getDaysBetween(task.start, task.end) + 1}일</div>
              </div>
            ))}
          </div>
        </div>

        {/* 타임라인 및 작업 막대 패널 */}
        <div className="w-3/4 flex flex-col">
          {/* 3행 Timeline 헤더 */}
          <div
            ref={timelineHeaderRef}
            className="sticky top-0 z-10 bg-gray-50 flex-shrink-0 overflow-x-hidden border-b border-gray-200"
            style={{ overflowX: 'auto' }}
          >
            <div className="flex" style={{ borderBottom: '1px solid #e5e7eb' }}>
              {/* Year Row */}
              {getTimelineHeaderRows().years.map((year, i) => (
                <div
                  key={`year-${year.value}-${i}`}
                  className="text-center text-xs font-semibold text-gray-700 flex items-center justify-center border-r border-gray-200"
                  style={{
                    width: year.span * dayWidth,
                    minWidth: year.span * dayWidth,
                    borderRight: i === getTimelineHeaderRows().years.length - 1 ? 'none' : undefined,
                    height: 28,
                  }}
                >
                  {year.value}
                </div>
              ))}
            </div>
            <div className="flex" style={{ borderBottom: '1px solid #e5e7eb' }}>
              {/* Month Row */}
              {getTimelineHeaderRows().months.map((month, i) => (
                <div
                  key={`month-${month.value}-${i}`}
                  className="text-center text-xs text-gray-600 flex items-center justify-center border-r border-gray-200"
                  style={{
                    width: month.span * dayWidth,
                    minWidth: month.span * dayWidth,
                    borderRight: i === getTimelineHeaderRows().months.length - 1 ? 'none' : undefined,
                    height: 24,
                  }}
                >
                  {month.value}
                </div>
              ))}
            </div>
            <div className="flex">
              {/* Day Row */}
              {dates.map((date, index) => {
                const isWeekend = new Date(date).getDay() === 0 || new Date(date).getDay() === 6;
                const isNonWorking = nonWorkingDays[date];
                return (
                  <div
                    key={date}
                    className={`flex-shrink-0 text-center text-xs py-1 ${isWeekend || isNonWorking ? 'bg-gray-200 text-gray-600' : 'text-gray-600'}`}
                    style={{ width: dayWidth, height: 22 }}
                  >
                    {new Date(date).getDate()}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 간트 차트 그리드 및 작업 막대 */}
          <div
            className="overflow-x-auto overflow-y-auto"
            ref={rightScrollRef}
            onScroll={handleChartScroll}
            style={{ flexGrow: 1 }}
            onClick={handleChartBackgroundClick}
          >
            <div
              className="relative"
              style={{
                width: totalDays * dayWidth,
                height: tasks.length * (taskHeight + rowGap),
              }}
            >
              {/* 세로 그리드 라인 (날짜별) */}
              {dates.map((date, index) => {
                const isWeekend = new Date(date).getDay() === 0 || new Date(date).getDay() === 6;
                const isNonWorking = nonWorkingDays[date];
                return (
                  <div
                    key={`grid-line-${date}`}
                    className={`absolute top-0 h-full border-l border-gray-200 ${isWeekend || isNonWorking ? 'bg-gray-100' : ''}`}
                    style={{ left: index * dayWidth, width: dayWidth }}
                  ></div>
                );
              })}

              {/* 가로 그리드 라인 (작업별) */}
              {tasks.map((_, idx) => (
                <div
                  key={`row-line-${idx}`}
                  className="absolute left-0 w-full border-t border-dashed border-yellow-200 pointer-events-none"
                  style={{
                    top: idx * (taskHeight + rowGap) + rowGap / 2 + taskHeight,
                    height: 0,
                    zIndex: 0,
                  }}
                ></div>
              ))}

              {/* 작업 막대 */}
              {tasks.map((task) => {
                const { x, width } = getTaskPositionAndWidth(task);
                const isSelected = selectedTaskId === task.id;
                return (
                  <div
                    key={task.id}
                    ref={el => { taskRefs.current[task.id] = el; }}
                    className={`absolute rounded-md shadow-md cursor-grab active:cursor-grabbing group
                      ${isSelected ? 'bg-yellow-100 border-2 border-yellow-400' : 'bg-indigo-500'}
                    `}
                    style={{
                      left: x,
                      top: tasks.findIndex(t => t.id === task.id) * (taskHeight + rowGap) + rowGap / 2,
                      width: width,
                      height: taskHeight,
                      zIndex: isSelected ? 2 : 1,
                    }}
                    onClick={e => {
                      e.stopPropagation();
                      setSelectedTaskId(task.id);
                    }}
                    onContextMenu={e => handleTaskContextMenu(e, task.id)}
                  >
                    {/* 진행률 바 */}
                    <div
                      className="absolute top-0 left-0 h-full bg-indigo-700 rounded-md"
                      style={{ width: `${task.progress}%`, opacity: isSelected ? 0.5 : 1 }}
                    ></div>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold pointer-events-none"
                      style={{ color: isSelected ? '#b45309' : '#fff' }}
                    >
                      {task.name} ({task.progress}%)
                    </span>

                    {/* 드래그 핸들 (이동) */}
                    <div
                      className="absolute inset-0 cursor-grab"
                      onMouseDown={(e) => handleMouseDown(e, task.id, 'move')}
                    ></div>

                    {/* 크기 조정 핸들 (왼쪽) */}
                    <div
                      className="absolute top-0 bottom-0 left-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity"
                      onMouseDown={(e) => handleMouseDown(e, task.id, 'resize-left')}
                    ></div>

                    {/* 크기 조정 핸들 (오른쪽) */}
                    <div
                      className="absolute top-0 bottom-0 right-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity"
                      onMouseDown={(e) => handleMouseDown(e, task.id, 'resize-right')}
                    ></div>
                  </div>
                );
              })}

              {/* 의존성 선 */}
              <svg
                className="absolute top-0 left-0 pointer-events-none"
                width={totalDays * dayWidth}
                height={tasks.length * (taskHeight + rowGap)}
              >
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
                  </marker>
                </defs>
                {renderDependencyLines()}
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleChart;
