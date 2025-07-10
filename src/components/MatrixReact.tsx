import React, { useState } from 'react';
import { FixedSizeGrid as Grid } from 'react-window'; // 추가

// Define types for CustomMessageBox props
interface CustomMessageBoxProps {
    message: string;
    onClose: () => void;
}

// Custom Alert/Message Box Component
const CustomMessageBox: React.FC<CustomMessageBoxProps> = ({ message, onClose }) => {
    if (!message) return null;

    return (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full transform transition-all duration-300 scale-100 opacity-100">
                <p className="text-gray-800 text-lg mb-4 text-center">{message}</p>
                <div className="flex justify-center">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-blue-600 text-gray-500 font-semibold rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition duration-150 ease-in-out"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};

// Define types for a cell's data (can be number, string, or an object with 'text')
type CellData = number | string | { id: number; text: string };

// XYMatrix 가상화 버전
interface XYMatrixVirtualProps {
    data: CellData[][];
    onCellClick?: (rowIndex: number, colIndex: number, cellValue: CellData) => void;
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
    onCellClick,
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
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center p-8 bg-gray-100 rounded-lg shadow-inner text-gray-600 text-lg font-medium">
                데이터가 없습니다.(No data available.)
            </div>
        );
    }

    const numRows = data.length;
    const numCols = data[0].length;

    // 셀 크기
    const cellWidth = xAxisWidths.length === numCols ? xAxisWidths[0] : 30;
    const cellHeight = yAxisHeights.length === numRows ? yAxisHeights[0] : 30;

    // 전체 행/열: +1은 축 라벨
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
                    }}
                >
                    {xAxisLabels[columnIndex - 1]}
                </div>
            );
        }
        // Y축 라벨
        if (columnIndex === 0) {
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
                    }}
                >
                    {yAxisLabels[rowIndex - 1]}
                </div>
            );
        }
        // 데이터 셀
        const cell = data[rowIndex - 1][columnIndex - 1];
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
                onClick={() => onCellClick && onCellClick(rowIndex - 1, columnIndex - 1, cell)}
            >
                {typeof cell === 'object' && cell !== null && 'text' in cell ? (cell as { text: string }).text : cell}
            </div>
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
        </div>
    );
};

// Main App Component
const MatrixReact: React.FC = () => {
    // Define the size of the matrix
    const MATRIX_SIZE = 1000; // Changed to 1000x1000

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

    // State for the custom message box
    interface MessageBoxState {
        isVisible: boolean;
        message: string;
    }
    const [messageBox, setMessageBox] = useState<MessageBoxState>({
        isVisible: false,
        message: '',
    });

    // Function to handle cell clicks
    const handleCellClick = (rowIndex: number, colIndex: number, cellValue: CellData): void => {
        const valueToDisplay = typeof cellValue === 'object' && cellValue !== null && 'text' in cellValue ? cellValue.text : cellValue;
        const newMessage = `클릭되었습니다! 행: ${rowIndex} (${yAxis[rowIndex]}), 열: ${colIndex} (${xAxis[colIndex]}), 값: ${valueToDisplay}`;
        setMessageBox({ isVisible: true, message: newMessage });

        // Create a new matrix data array to update the clicked cell
        const newMatrixData = matrixData.map((row: CellData[], rIdx: number) =>
            row.map((cell: CellData, cIdx: number) => {
                // If the current cell is the clicked cell, change its value to 'X'
                if (rIdx === rowIndex && cIdx === colIndex) {
                    return 'X';
                }
                return cell;
            })
        );
        // Update the state with the new matrix data
        setMatrixData(newMatrixData);
    };

    // Function to close the message box
    const closeMessageBox = (): void => {
        setMessageBox({ isVisible: false, message: '' });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 font-inter w-[80vw]">
            {/* Page Title */}
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-8 text-center leading-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                    XY Matrix 컴포넌트 (가상화 적용)
                </span>
            </h1>

            {/* Font Size Controls */}
            <div className="bg-white p-4 rounded-xl shadow-lg mb-8 w-full flex flex-col sm:flex-row items-center justify-center gap-4 border border-gray-200">
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
            <div className="bg-white p-6 rounded-2xl shadow-2xl mb-12 w-[70vw] border border-blue-200 overflow-auto max-h-[80vh]">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 text-center">
                    1000x1000 그리드 (가상화)
                </h2>
                <XYMatrixVirtual
                    data={matrixData}
                    onCellClick={handleCellClick}
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

            {/* Example with empty data */}
            <div className="bg-white p-6 rounded-2xl shadow-2xl mb-12 w-full max-w-2xl border border-purple-200">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 text-center">
                    빈 데이터 예시 (Empty Data Example)
                </h2>
                <XYMatrixVirtual data={[]} onCellClick={handleCellClick} xAxisLabels={xAxis} yAxisLabels={yAxis} />
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
                    onCellClick={(r, c, val) => {
                        const newMessage = `클릭된 객체: ${(val as { text: string }).text} (ID: ${(val as { id: number }).id})`;
                        setMessageBox({ isVisible: true, message: newMessage });
                    }}
                    width={300}
                    height={150}
                />
            </div>

            <CustomMessageBox
                message={messageBox.message}
                onClose={closeMessageBox}
            />

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
