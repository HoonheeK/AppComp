import React, { useState, useEffect } from 'react';
import { FixedSizeGrid as Grid } from 'react-window'; // 추가

// Define types for a cell's data (can be number, string, or an object with 'text')
type CellData = number | string | { id: number; text: string };

// XYMatrix 가상화 버전
interface XYMatrixVirtualProps {
    data: CellData[][];
    xAxisLabels?: string[];
    yAxisLabels?: string[];
    xAxisWidths?: number[];
    yAxisHeights?: number[];
    cellFontSize?: string;
    xAxisFontSize?: string;
    yAxisFontSize?: string;
    width?: number;
    height?: number;
}

const XYMatrixVirtual: React.FC<XYMatrixVirtualProps> = ({
    data,
    xAxisLabels = [],
    yAxisLabels = [],
    xAxisWidths = [],
    yAxisHeights = [],
    cellFontSize = '0.5rem',
    xAxisFontSize = '0.5rem',
    yAxisFontSize = '0.5rem',
    width = 800,
    height = 600,
}) => {
    const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
    const [editingCellValue, setEditingCellValue] = useState<string>('');
    const [editingXLabel, setEditingXLabel] = useState<number | null>(null);
    const [editingXLabelValue, setEditingXLabelValue] = useState<string>('');
    const [editingYLabel, setEditingYLabel] = useState<number | null>(null);
    const [editingYLabelValue, setEditingYLabelValue] = useState<string>('');

    const [localData, setLocalData] = useState<CellData[][]>(data);
    const [localXAxis, setLocalXAxis] = useState<string[]>(xAxisLabels);
    const [localYAxis, setLocalYAxis] = useState<string[]>(yAxisLabels);
    const [editor, setEditor] = useState<{
        type: 'cell' | 'x' | 'y';
        row?: number;
        col?: number;
        value: string;
        left: number;
        top: number;
    } | null>(null);

    useEffect(() => {
        setLocalData(data);
    }, [data]);
    useEffect(() => {
        setLocalXAxis(xAxisLabels);
    }, [xAxisLabels]);
    useEffect(() => {
        setLocalYAxis(yAxisLabels);
    }, [yAxisLabels]);

    if (!localData || localData.length === 0) {
        return (
            <div className="flex items-center justify-center p-8 bg-gray-100 rounded-lg shadow-inner text-gray-600 text-lg font-medium">
                데이터가 없습니다.(No data available.)
            </div>
        );
    }
    // 셀/축 더블클릭 핸들러
    const handleDoubleClick = (
        type: 'cell' | 'x' | 'y',
        row: number,
        col: number,
        value: string,
        event: React.MouseEvent
    ) => {
        const rect = (event.target as HTMLElement).getBoundingClientRect();
        setEditor({
            type,
            row,
            col,
            value,
            left: rect.left,
            top: rect.top,
        });
    };

    const numRows = localData.length;
    const numCols = localData[0].length;
    const cellWidth = xAxisWidths.length === numCols ? xAxisWidths[0] : 30;
    const cellHeight = yAxisHeights.length === numRows ? yAxisHeights[0] : 30;
    const totalRows = numRows + 1;
    const totalCols = numCols + 1;

    // 셀 렌더러
    const Cell = ({ columnIndex, rowIndex, style }: any) => {
        // 좌상단(0,0): 빈칸
        if (rowIndex === 0 && columnIndex === 0) {
            return (
                <div style={{ ...style, background: '#f3f4f6', fontWeight: 'bold', border: '1px solid #e5e7eb' }} />
            );
        }
        // X축 라벨
        if (rowIndex === 0) {
            // X축 라벨 인라인 수정
            if (editingXLabel === columnIndex - 1) {
                return (
                    <input
                        style={{
                            ...style,
                            fontSize: xAxisFontSize,
                            fontWeight: 'bold',
                            textAlign: 'center',
                            border: '2px solid #3498db',
                            background: '#fffbe6',
                            width: '100%',
                            height: '100%',
                        }}
                        value={editingXLabelValue}
                        // autoFocus
                        onChange={e => {
                            console.log('X축 입력:', e.target.value);
                            setEditingXLabelValue(e.target.value);
                        }}
                        onBlur={() => {
                            console.log('X축 onBlur');
                            setEditingXLabel(null);
                            setEditingXLabelValue('');
                        }}
                        onKeyDown={e => {
                            console.log('X축 onKeyDown:', e.key);
                            if (e.key === 'Enter') {
                                setLocalXAxis(prev => prev.map((v, i) => i === columnIndex - 1 ? editingXLabelValue : v));
                                setEditingXLabel(null);
                                setEditingXLabelValue('');
                            } else if (e.key === 'Escape') {
                                setEditingXLabel(null);
                                setEditingXLabelValue('');
                            }
                        }}
                    />
                );
            }
            return (
                <div
                    style={{
                        ...style,
                        background: '#e5e7eb',
                        fontWeight: 'bold',
                        border: '1px solid #e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: cellWidth,
                        minHeight: cellHeight,
                        fontSize: xAxisFontSize,
                        cursor: 'pointer',
                    }}
                    onDoubleClick={() => {
                        setEditingXLabel(columnIndex - 1);
                        setEditingXLabelValue(localXAxis[columnIndex - 1]);
                    }}
                >
                    {localXAxis[columnIndex - 1]}
                </div>
            );
        }
        // Y축 라벨
        if (columnIndex === 0) {
            // Y축 라벨 인라인 수정
            if (editingYLabel === rowIndex - 1) {
                return (
                    <input
                        style={{
                            ...style,
                            fontSize: yAxisFontSize,
                            fontWeight: 'bold',
                            textAlign: 'center',
                            border: '2px solid #3498db',
                            background: '#fffbe6',
                            width: '100%',
                            height: '100%',
                        }}
                        value={editingYLabelValue}
                        // autoFocus
                        onChange={e => {
                            console.log('Y축 입력:', e.target.value);
                            setEditingYLabelValue(e.target.value);
                        }}
                        onBlur={() => {
                            console.log('Y축 onBlur');
                            setEditingYLabel(null);
                            setEditingYLabelValue('');
                        }}
                        onKeyDown={e => {
                            console.log('Y축 onKeyDown:', e.key);
                            if (e.key === 'Enter') {
                                setLocalYAxis(prev => prev.map((v, i) => i === rowIndex - 1 ? editingYLabelValue : v));
                                setEditingYLabel(null);
                                setEditingYLabelValue('');
                            } else if (e.key === 'Escape') {
                                setEditingYLabel(null);
                                setEditingYLabelValue('');
                            }
                        }}
                    />
                );
            }
            return (
                <div
                    style={{
                        ...style,
                        background: '#e5e7eb',
                        fontWeight: 'bold',
                        border: '1px solid #e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: cellWidth,
                        minHeight: cellHeight,
                        fontSize: yAxisFontSize,
                        cursor: 'pointer',
                    }}
                    onDoubleClick={() => {
                        setEditingYLabel(rowIndex - 1);
                        setEditingYLabelValue(localYAxis[rowIndex - 1]);
                    }}
                >
                    {localYAxis[rowIndex - 1]}
                </div>
            );
        }
        // 데이터 셀
        // 셀 인라인 수정
        if (editingCell && editingCell.row === rowIndex - 1 && editingCell.col === columnIndex - 1) {
            return (
                <input
                    style={{
                        ...style,
                        fontSize: cellFontSize,
                        fontWeight: 600,
                        textAlign: 'center',
                        border: '2px solid #3498db',
                        background: '#fffbe6',
                        width: '100%',
                        height: '100%',
                    }}
                    value={editingCellValue}
                    // autoFocus
                    onChange={e => {
                        console.log('셀 입력:', e.target.value);
                        setEditingCellValue(e.target.value);
                    }}
                    onBlur={() => {
                        console.log('셀 onBlur');
                        setEditingCell(null);
                        setEditingCellValue('');
                    }}
                    onKeyDown={e => {
                        console.log('셀 onKeyDown:', e.key);
                        if (e.key === 'Enter') {
                            setLocalData(prev =>
                                prev.map((row, rIdx) =>
                                    row.map((cell, cIdx) =>
                                        rIdx === rowIndex - 1 && cIdx === columnIndex - 1
                                            ? editingCellValue
                                            : cell
                                    )
                                )
                            );
                            setEditingCell(null);
                            setEditingCellValue('');
                        } else if (e.key === 'Escape') {
                            setEditingCell(null);
                            setEditingCellValue('');
                        }
                    }}
                />
            );
        }
        const cell = localData[rowIndex - 1][columnIndex - 1];
        return (
            <div
                style={{
                    ...style,
                    fontSize: cellFontSize,
                    border: '1px solid #e5e7eb',
                    background: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontWeight: 600,
                    color: '#22223b',
                }}
                onDoubleClick={e =>
                    handleDoubleClick(
                        'cell',
                        rowIndex - 1,
                        columnIndex - 1,
                        typeof cell === 'object' && cell !== null && 'text' in cell
                            ? cell.text
                            : String(cell),
                        e
                    )
                }
            >
        { typeof cell === 'object' && cell !== null && 'text' in cell ? (cell as { text: string }).text : cell }
            </div >
        );
    };

return (
    <div style={{ width, height }}>
        <Grid
            columnCount={totalCols}
            rowCount={totalRows}
            columnWidth={cellWidth}
            rowHeight={cellHeight}
            width={width}
            height={height}
        >
            {Cell}
        </Grid>
        {editor && (
            <input
                style={{
                    position: 'fixed',
                    left: editor.left,
                    top: editor.top,
                    zIndex: 9999,
                    background: '#fffbe6',
                    border: '2px solid #3498db',
                    fontSize: cellFontSize,
                    fontWeight: 600,
                    width: 80,
                }}
                value={editor.value}
                autoFocus
                onChange={e => setEditor({ ...editor, value: e.target.value })}
                onBlur={() => setEditor(null)}
                onKeyDown={e => {
                    if (e.key === 'Enter') {
                        // 값 반영 로직 (예시)
                        // setLocalData, setLocalXAxis, setLocalYAxis 등
                        setEditor(null);
                    } else if (e.key === 'Escape') {
                        setEditor(null);
                    }
                }}
            />
        )}
    </div>
);
};

// Main MatrixReact Component
const MatrixReact: React.FC = () => {
    // Define the size of the matrix
    const MATRIX_SIZE = 2000; // Changed to 1000x1000

    // State for font sizes
    const [currentCellFontSize, setCurrentCellFontSize] = useState<string>('0.5rem');
    const [currentXAxisFontSize, setCurrentXAxisFontSize] = useState<string>('0.5rem');
    const [currentYAxisFontSize, setCurrentYAxisFontSize] = useState<string>('0.5rem');

    // Function to generate initial matrix data
    const generateMatrixData = (size: number): CellData[][] => {
        const data: CellData[][] = [];
        for (let i = 0; i < size; i++) {
            const row: CellData[] = [];
            for (let j = 0; j < size; j++) {
                row.push(i * size + j + 1); // Fill with sequential numbers
            }
            data.push(row);
        }
        return data;
    };

    // Function to generate axis labels
    const generateAxisLabels = (prefix: string, size: number): string[] => {
        const labels: string[] = [];
        for (let i = 0; i < size; i++) {
            labels.push(`${prefix} ${i + 1}`);
        }
        return labels;
    };

    // State for the matrix data
    const [matrixData, setMatrixData] = useState<CellData[][]>(() => generateMatrixData(MATRIX_SIZE));

    // Sample X-axis labels
    const [xAxis] = useState<string[]>(() => generateAxisLabels('Col', MATRIX_SIZE));
    // Sample Y-axis labels
    const [yAxis] = useState<string[]>(() => generateAxisLabels('Row', MATRIX_SIZE));

    // Custom widths for X-axis columns (pixels) - using a fixed width for 1000x1000 for performance
    const customXWidths: number[] = Array(MATRIX_SIZE).fill(30); // Each column 30px wide
    // Custom heights for Y-axis rows (pixels) - using a fixed height for 1000x1000 for performance
    const customYHeights: number[] = Array(MATRIX_SIZE).fill(30); // Each row 30px high

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 font-inter w-[80vw]">
            {/* Page Title */}
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-8 text-center leading-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                    XY Matrix 컴포넌트 (가상화 적용)
                </span>
            </h1>

            {/* Font Size Controls */}
            <div className="bg-white p-4 rounded-xl shadow-lg mb-8 flex flex-col sm:flex-row items-center justify-center gap-4 border border-gray-200">
                <label htmlFor="yFontSizeInput" className="text-lg font-semibold text-gray-700 whitespace-nowrap">
                    Y축 글자 크기:
                </label>
                <input
                    type="range"
                    id="yFontSizeInput"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={parseFloat(currentYAxisFontSize)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentYAxisFontSize(`${e.target.value}rem`)}
                    className="w-full sm:w-auto flex-grow h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg"
                />
                <span className="text-lg font-medium text-gray-800">{currentYAxisFontSize}</span>

                <label htmlFor="fontSizeInput" className="text-lg font-semibold text-gray-700 whitespace-nowrap">
                    셀 글자 크기:
                </label>
                <input
                    type="range"
                    id="fontSizeInput"
                    min="0.3"
                    max="1.5"
                    step="0.1"
                    value={parseFloat(currentCellFontSize)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentCellFontSize(`${e.target.value}rem`)}
                    className="w-full sm:w-auto flex-grow h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg"
                />
                <span className="text-lg font-medium text-gray-800">{currentCellFontSize}</span>

                <label htmlFor="xFontSizeInput" className="text-lg font-semibold text-gray-700 whitespace-nowrap">
                    X축 글자 크기:
                </label>
                <input
                    type="range"
                    id="xFontSizeInput"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={parseFloat(currentXAxisFontSize)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentXAxisFontSize(`${e.target.value}rem`)}
                    className="w-full sm:w-auto flex-grow h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg"
                />
                <span className="text-lg font-medium text-gray-800">{currentXAxisFontSize}</span>
            </div>

            {/* Main XY Matrix Example with Virtualization */}
            <div className="bg-white p-6 shadow-2xl mb-12 w-[70vw] border border-blue-200 ">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 text-center">
                    1000x1000 그리드 (가상화)
                </h2>
                <XYMatrixVirtual
                    data={matrixData}
                    xAxisLabels={xAxis}
                    yAxisLabels={yAxis}
                    xAxisWidths={customXWidths}
                    yAxisHeights={customYHeights}
                    cellFontSize={currentCellFontSize}
                    xAxisFontSize={currentXAxisFontSize}
                    yAxisFontSize={currentYAxisFontSize}
                    width={1200}
                    height={1200}
                />
                <p className="text-sm text-blue-600 font-semibold mt-4 text-center">
                    가상화(Virtualization)로 성능 문제 없이 대용량 그리드를 렌더링합니다.
                </p>
            </div>

            {/* Example with complex data (objects) and default sizing */}
            <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-2xl border border-green-200">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 text-center">
                    복잡한 데이터 예시 (기본 크기) (Complex Data Example - Default Sizing)
                </h2>
                <XYMatrixVirtual
                    data={[
                        [{ id: 1, text: '🍎' }, { id: 2, text: '🍊' }],
                        [{ id: 3, text: '🍇' }, { id: 4, text: '🍍' }],
                    ]}
                    xAxisLabels={['Fruit A', 'Fruit B']}
                    yAxisLabels={['Row X', 'Row Y']}
                    width={300}
                    height={150}
                />
            </div>

            {/* Tailwind CSS Script - MUST be at the end of the body or in the head */}
            <script src="https://cdn.tailwindcss.com"></script>
            {/* Google Fonts - Inter */}
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" />
            <style>
                {`
            body {
              font-family: 'Inter', sans-serif;
            }
          `}
            </style>
        </div>
    );
};

export default MatrixReact;
