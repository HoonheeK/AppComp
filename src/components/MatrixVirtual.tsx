import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { CSSProperties } from 'react';
import { FixedSizeGrid as Grid } from 'react-window'; // 추가


// 셀의 너비와 높이 정의
const CELL_WIDTH = 100;
const CELL_HEIGHT = 50;
const HEADER_WIDTH = 100; // Y축 헤더의 너비
const HEADER_HEIGHT = 50; // X축 헤더의 높이

// 더미 데이터 생성 함수
const generateData = (numRows: number, numCols: number) => {
  const xLabels: string[] = Array.from({ length: numCols }, (_, i) => `X-축 데이터 ${i + 1}`);
  const yLabels: string[] = Array.from({ length: numRows }, (_, i) => `Y-축 데이터 ${i + 1}`);
  const matrixData: string[][] = Array.from({ length: numRows }, (_, rowIndex) =>
    Array.from({ length: numCols }, (_, colIndex) => `셀 (${colIndex + 1}, ${rowIndex + 1})`)
  );
  return { xLabels, yLabels, matrixData };
};

// XYMatrix 컴포넌트의 Props 타입 정의
interface XYMatrixProps {
  numRows: number;
  numCols: number;
}

// Cell 컴포넌트의 Props 타입 정의
interface CellProps {
  columnIndex: number;
  rowIndex: number;
  style: CSSProperties;
}

// Header Cell 컴포넌트의 Props 타입 정의
interface HeaderCellProps {
  index: number;
  style: CSSProperties;
}

const XYMatrix: React.FC<XYMatrixProps> = ({ numRows, numCols }) => {
  const { xLabels, yLabels, matrixData } = generateData(numRows, numCols);

  const xHeaderRef = useRef<HTMLDivElement>(null);
  const yHeaderRef = useRef<HTMLDivElement>(null);
  const matrixBodyRef = useRef<HTMLDivElement>(null);

  const [scrollLeft, setScrollLeft] = useState<number>(0);
  const [scrollTop, setScrollTop] = useState<number>(0);

  // 스크롤 동기화 핸들러
  const handleMatrixScroll = useCallback(() => {
    if (matrixBodyRef.current) {
      const { scrollLeft, scrollTop } = matrixBodyRef.current;
      setScrollLeft(scrollLeft);
      setScrollTop(scrollTop);

      if (xHeaderRef.current) {
        xHeaderRef.current.scrollLeft = scrollLeft;
      }
      if (yHeaderRef.current) {
        yHeaderRef.current.scrollTop = scrollTop;
      }
    }
  }, []);

  // 각 셀을 렌더링하는 컴포넌트
  const Cell: React.FC<CellProps> = useCallback(({ columnIndex, rowIndex, style }) => (
    <div
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid #e5e7eb', // Tailwind gray-200
        backgroundColor: rowIndex % 2 ? '#f9fafb' : '#ffffff', // Tailwind gray-50 / white
        padding: '0.5rem',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        boxSizing: 'border-box', // 패딩과 보더가 너비/높이에 포함되도록
      }}
      className="rounded-sm text-sm"
    >
      {matrixData[rowIndex][columnIndex]}
    </div>
  ), [matrixData]);

  // X축 헤더 셀을 렌더링하는 컴포넌트
  const XHeaderCell: React.FC<HeaderCellProps> = useCallback(({ index, style }) => (
    <div
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid #e5e7eb',
        backgroundColor: '#f3f4f6', // Tailwind gray-100
        fontWeight: 'bold',
        padding: '0.5rem',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        boxSizing: 'border-box',
      }}
      className="rounded-sm text-sm"
    >
      {xLabels[index]}
    </div>
  ), [xLabels]);

  // Y축 헤더 셀을 렌더링하는 컴포넌트
  const YHeaderCell: React.FC<HeaderCellProps> = useCallback(({ index, style }) => (
    <div
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid #e5e7eb',
        backgroundColor: '#f3f4f6',
        fontWeight: 'bold',
        padding: '0.5rem',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        boxSizing: 'border-box',
      }}
      className="rounded-sm text-sm"
    >
      {yLabels[index]}
    </div>
  ), [yLabels]);

  // 가상화 렌더링 로직
  const renderVirtualizedCells = useCallback((containerWidth: number, containerHeight: number, isXHeader: boolean = false, isYHeader: boolean = false) => {
    const visibleRowCount = Math.ceil(containerHeight / CELL_HEIGHT) + 2; // 여유분 +2
    const visibleColCount = Math.ceil(containerWidth / CELL_WIDTH) + 2;   // 여유분 +2

    const startRowIndex = Math.max(0, Math.floor(scrollTop / CELL_HEIGHT));
    const endRowIndex = Math.min(numRows - 1, startRowIndex + visibleRowCount);

    const startColIndex = Math.max(0, Math.floor(scrollLeft / CELL_WIDTH));
    const endColIndex = Math.min(numCols - 1, startColIndex + visibleColCount);

    const cells: React.JSX.Element[] = [];

    if (isXHeader) {
      for (let i = startColIndex; i <= endColIndex; i++) {
        const style: CSSProperties = {
          position: 'absolute',
          top: 0,
          left: i * CELL_WIDTH,
          width: CELL_WIDTH,
          height: HEADER_HEIGHT,
        };
        cells.push(<XHeaderCell key={i} index={i} style={style} />);
      }
    } else if (isYHeader) {
      for (let i = startRowIndex; i <= endRowIndex; i++) {
        const style: CSSProperties = {
          position: 'absolute',
          top: i * CELL_HEIGHT,
          left: 0,
          width: HEADER_WIDTH,
          height: CELL_HEIGHT,
        };
        cells.push(<YHeaderCell key={i} index={i} style={style} />);
      }
    } else {
      for (let i = startRowIndex; i <= endRowIndex; i++) {
        for (let j = startColIndex; j <= endColIndex; j++) {
          const style: CSSProperties = {
            position: 'absolute',
            top: i * CELL_HEIGHT,
            left: j * CELL_WIDTH,
            width: CELL_WIDTH,
            height: CELL_HEIGHT,
          };
          cells.push(<Cell key={`${i}-${j}`} rowIndex={i} columnIndex={j} style={style} />);
        }
      }
    }
    return cells;
  }, [scrollTop, scrollLeft, numRows, numCols, Cell, XHeaderCell, YHeaderCell]);

  // 뷰포트 크기 변화에 따른 매트릭스 크기 업데이트
  const [matrixDimensions, setMatrixDimensions] = useState<{ width: number; height: number }>({
    width: window.innerWidth - HEADER_WIDTH - 32, // 전체 너비에서 Y축 헤더와 패딩을 뺀 값
    height: window.innerHeight - HEADER_HEIGHT - 64, // 전체 높이에서 X축 헤더와 패딩을 뺀 값
  });

  useEffect(() => {
    const handleResize = () => {
      setMatrixDimensions({
        width: window.innerWidth - HEADER_WIDTH - 32,
        height: window.innerHeight - HEADER_HEIGHT - 64,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex flex-col p-4 bg-white rounded-lg shadow-md font-inter" style={{ overflow: 'hidden' }}>
      <div className="flex">
        {/* 코너 빈 공간 */}
        <div
          style={{
            width: HEADER_WIDTH,
            height: HEADER_HEIGHT,
            border: '1px solid #e5e7eb',
            backgroundColor: '#e5e7eb', // Tailwind gray-200
            flexShrink: 0, // 크기 고정
          }}
          className="rounded-sm"
        ></div>

        {/* X축 헤더 */}
        <div
          ref={xHeaderRef}
          style={{
            height: HEADER_HEIGHT,
            width: matrixDimensions.width,
            overflowX: 'hidden', // X축 헤더 자체의 스크롤바 숨기기
            overflowY: 'hidden',
            position: 'relative',
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{ width: numCols * CELL_WIDTH, height: '100%', position: 'relative' }}>
            {renderVirtualizedCells(matrixDimensions.width, HEADER_HEIGHT, true, false)}
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Y축 헤더 */}
        <div
          ref={yHeaderRef}
          style={{
            height: matrixDimensions.height,
            width: HEADER_WIDTH,
            overflowX: 'hidden',
            overflowY: 'hidden', // Y축 헤더 자체의 스크롤바 숨기기
            position: 'relative',
          }}
        >
          <div style={{ height: numRows * CELL_HEIGHT, width: '100%', position: 'relative' }}>
            {renderVirtualizedCells(HEADER_WIDTH, matrixDimensions.height, false, true)}
          </div>
        </div>

        {/* 매트릭스 본문 */}
        <div
          ref={matrixBodyRef}
          onScroll={handleMatrixScroll}
          style={{
            height: matrixDimensions.height,
            width: matrixDimensions.width,
            overflow: 'scroll', // 매트릭스 본문에 스크롤바 표시
            position: 'relative',
          }}
        >
          <div
            style={{
              width: numCols * CELL_WIDTH,
              height: numRows * CELL_HEIGHT,
              position: 'relative',
            }}
          >
            {renderVirtualizedCells(matrixDimensions.width, matrixDimensions.height)}
          </div>
        </div>
      </div>
    </div>
  );
};

// 메인 앱 컴포넌트
const MatrixVirtual: React.FC = () => {
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center w-[80vw]">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
          body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 0;
          }
        `}
      </style>
      <XYMatrix numRows={2000} numCols={2000} />
    </div>
  );
}

export default MatrixVirtual;
