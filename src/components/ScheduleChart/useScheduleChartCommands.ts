import { useCallback } from 'react';
import type { Task } from './types';

export default function useScheduleChartCommands() {
  // Task 추가/삭제, Undo/Redo 등 커맨드 로직
  // 예시:
  const handleAddTask = useCallback(() => { /* ... */ }, []);
  const handleDeleteTask = useCallback(() => { /* ... */ }, []);
  const handleUndo = useCallback(() => { /* ... */ }, []);
  const handleRedo = useCallback(() => { /* ... */ }, []);

  return {
    handleAddTask,
    handleDeleteTask,
    handleUndo,
    handleRedo,
    // ...etc
  };
}