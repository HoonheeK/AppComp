import { useState } from 'react';

export default function useScheduleChartOptions() {
  // 차트 표시 옵션, 예: 스케일, 보기 설정 등
  const [timelineScale, setTimelineScale] = useState<'day' | 'week'>('day');
  // ...기타 옵션...

  return {
    timelineScale,
    setTimelineScale,
    // ...etc
  };
}