import React, { useState, useEffect, useCallback } from 'react';
import type { ChangeEvent } from 'react';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.min.css';

// 이벤트 타입 정의
type ScheduleEvent = {
  id: string;
  startDate: string;
  endDate: string;
  title: string;
  description: string;
  time?: string;
};

// 날짜 유틸리티 함수
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTodayDate = () => {
  return formatDate(new Date());
};

const LOCAL_STORAGE_KEY = 'schedule_app_events';

function CalendarView() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  // const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [eventTitle, setEventTitle] = useState<string>('');
  const [eventDescription, setEventDescription] = useState<string>('');
  const [eventTime, setEventTime] = useState<string>('');
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  // const [eventStartDate, setEventStartDate] = useState<string>(getTodayDate());
  // const [eventEndDate, setEventEndDate] = useState<string>(getTodayDate());
  const [eventDateRange, setEventDateRange] = useState<Date[]>([]);


  // 로컬 스토리지에서 이벤트 불러오기 및 저장
  useEffect(() => {
    const storedEvents = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedEvents) {
      try {
        setEvents(JSON.parse(storedEvents));
      } catch (error) {
        console.error("Error parsing events from localStorage:", error);
        setEvents([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(events));
  }, [events]);

  const handleDateClick = (day: number) => {
    // day를 기반으로 첫 번째 날짜를 Date 객체로 생성
    const firstDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setEventDateRange([firstDate]); // 첫 번째 날짜만 배열로 세팅
    setIsModalOpen(true);
    setEventTitle('');
    setEventDescription('');
    setEventTime('');
    setEditingEvent(null);
  };

  const handleEventEdit = (event: ScheduleEvent) => {
    setEventDateRange([new Date(event.startDate), new Date(event.endDate)]);
    setEventTitle(event.title);
    setEventDescription(event.description);
    setEventTime(event.time || '');
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleEventDelete = (eventId: string) => {
    setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
    console.log("Event deleted successfully!");
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingEvent(null);
  };

  const handleSaveEvent = () => {
    if ( 
      eventDateRange.length === 0 ||
      !eventDateRange[0] ||
      !eventTitle.trim()
    ) return;
    // date가 하나만 선택된 경우, 두 번째 값을 첫 번째 값과 동일하게 세팅
    const start = eventDateRange[0];
    const end = eventDateRange.length === 2 && eventDateRange[1] ? eventDateRange[1] : eventDateRange[0];

    const eventData: Omit<ScheduleEvent, 'id'> = {
      startDate: formatDate(start),
      endDate: formatDate(end),
      title: eventTitle.trim(),
      description: eventDescription.trim(),
      time: eventTime.trim(),
    };
    if (editingEvent) {
      setEvents(prevEvents =>
        prevEvents.map(event =>
          event.id === editingEvent.id ? { ...event, ...eventData } : event
        )
      );
    } else {
      const newEvent: ScheduleEvent = {
        id: Date.now().toString(),
        ...eventData,
      };
      setEvents(prevEvents => [...prevEvents, newEvent]);
    }
    handleModalClose();
  };

  const renderCalendarDays = useCallback(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const numDays = getDaysInMonth(year, month);
    const firstDayIndex = getFirstDayOfMonth(year, month);

    const days: React.ReactNode[] = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<div key={`empty-${i}`} className="p-2 text-center border border-gray-200 bg-gray-50"></div>);
    }

    for (let day = 1; day <= numDays; day++) {
      const fullDate = formatDate(new Date(year, month, day));
      const dayEvents = events.filter(event =>
        fullDate >= event.startDate && fullDate <= event.endDate
      );
      const isToday = fullDate === getTodayDate();
      // const isSelected = fullDate === selectedDate;

      days.push(
        <div
          key={day}
          className={`p-2 border border-gray-200 cursor-pointer relative min-h-[100px] flex flex-col ${isToday ? 'bg-blue-100' : 'bg-white'} rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200`}
          onClick={() => handleDateClick(day)}
        >
          <div className={`font-bold text-lg ${isToday ? 'text-blue-700' : 'text-gray-800'}`}>
            {day}
          </div>
          <div className="flex flex-col gap-1 mt-1 overflow-y-auto max-h-[70px] scrollbar-hide">
            {dayEvents.map(event => (
              <div
                key={event.id}
                className="bg-green-200 text-green-800 text-xs px-2 py-1 rounded-md truncate hover:bg-green-300 transition-colors duration-200 flex justify-between items-center"
                onClick={(e) => { e.stopPropagation(); handleEventEdit(event); }}
              >
                <span>{event.time ? `${event.time} ` : ''}{event.title}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleEventDelete(event.id); }}
                  className="ml-2 text-red-600 hover:text-red-800"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return days;
  }, [currentDate, events, handleDateClick, handleEventEdit, handleEventDelete]);

  const goToPreviousMonth = () => {
    setCurrentDate(prevDate => new Date(prevDate.getFullYear(), prevDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(prevDate => new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 1));
  };

  const goToCurrentMonth = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="min-h-screen bg-gray-100 font-inter p-4 flex flex-col items-center w-[80vw]">
      <style>
        {`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        .font-inter {
          font-family: 'Inter', sans-serif;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        `}
      </style>
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">스케줄 관리 앱</h1>
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={goToPreviousMonth}
            className="px-4 py-2 bg-blue-500 text-gray-500 rounded-lg shadow-md hover:bg-blue-600 transition duration-200"
          >
            이전 달
          </button>
          <h2 className="text-2xl font-semibold text-gray-700">
            {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
          </h2>
          <button
            onClick={goToNextMonth}
            className="px-4 py-2 bg-blue-500 text-gray-500 rounded-lg shadow-md hover:bg-blue-600 transition duration-200"
          >
            다음 달
          </button>
        </div>
        <div className="flex justify-center mb-6">
          <button
            onClick={goToCurrentMonth}
            className="px-6 py-2 bg-gray-600 text-gray-500 rounded-lg shadow-md hover:bg-gray-700 transition duration-200"
          >
            오늘
          </button>
        </div>
        <div className="grid grid-cols-7 gap-2 text-center font-bold text-gray-600 mb-4">
          <div>일</div>
          <div>월</div>
          <div>화</div>
          <div>수</div>
          <div>목</div>
          <div>금</div>
          <div>토</div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {renderCalendarDays()}
        </div>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md transform transition-all duration-300 scale-100 opacity-100">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              {editingEvent ? '이벤트 편집' : '새 이벤트 추가'}
            </h3>
            <div className="mb-4 flex-row gap-2">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                일정 기간:
              </label>
              <Flatpickr
                options={{ mode: 'range', dateFormat: 'Y-m-d' }}
                value={eventDateRange}
                onChange={dates => {
                  setEventDateRange(dates as Date[]);
                }}
                className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="날짜를 선택하세요"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="eventTitle" className="block text-gray-700 text-sm font-bold mb-2">
                제목:
              </label>
              <input
                type="text"
                id="eventTitle"
                className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={eventTitle}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setEventTitle(e.target.value)}
                placeholder="이벤트 제목을 입력하세요"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="eventTime" className="block text-gray-700 text-sm font-bold mb-2">
                시간 (선택 사항):
              </label>
              <input
                type="time"
                id="eventTime"
                className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={eventTime}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setEventTime(e.target.value)}
              />
            </div>
            <div className="mb-6">
              <label htmlFor="eventDescription" className="block text-gray-700 text-sm font-bold mb-2">
                설명 (선택 사항):
              </label>
              <textarea
                id="eventDescription"
                className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                value={eventDescription}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setEventDescription(e.target.value)}
                placeholder="이벤트 설명을 입력하세요"
              ></textarea>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleModalClose}
                className="px-5 py-2 bg-gray-300 text-gray-800 rounded-lg shadow-md hover:bg-gray-400 transition duration-200"
              >
                취소
              </button>
              <button
                onClick={handleSaveEvent}
                className="px-5 py-2 bg-blue-500 text-gray-500 rounded-lg shadow-md hover:bg-blue-600 transition duration-200"
                disabled={
                  !eventTitle.trim() ||
                  eventDateRange.length === 0 ||
                  !eventDateRange[0] 
                }
              >
                {editingEvent ? '저장' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarView;
