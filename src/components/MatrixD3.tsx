import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';

// 매트릭스 데이터의 타입 정의
interface MatrixData {
    x: string; // X축 카테고리
    y: string; // Y축 카테고리
    value: number; // 셀의 값
}

// 컴포넌트 Props의 타입 정의
interface XYMatrixD3Props {
    data: MatrixData[];
    width?: number;
    height?: number;
    margin?: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
}

// 데이터 인터페이스 정의
interface HeatmapData {
    row: string;
    col: string;
    value: number;
}

const XYMatrixD3: React.FC<XYMatrixD3Props> = ({
    data,
    width = 600,
    height = 400,
    margin = { top: 50, right: 20, bottom: 50, left: 100 },
}) => {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const tooltipRef = useRef<HTMLDivElement | null>(null);

    // 인라인 편집 상태 관리
    const [editCell, setEditCell] = useState<{ x: string; y: string } | null>(null);
    const [editValue, setEditValue] = useState<string>('');
    const [matrixData, setMatrixData] = useState<MatrixData[]>(data);

    // X/Y축 라벨 인라인 편집 상태
    const [editXLabel, setEditXLabel] = useState<string | null>(null);
    const [editXLabelValue, setEditXLabelValue] = useState<string>('');
    const [editYLabel, setEditYLabel] = useState<string | null>(null);
    const [editYLabelValue, setEditYLabelValue] = useState<string>('');

    const [contextMenu, setContextMenu] = useState<{
        visible: boolean;
        x: number;
        y: number;
        cell: { x: string; y: string } | null;
    } | null>(null);

    // 컨텍스트 메뉴 상태에 전체 X/Y축 수정 타입 추가
    const [dialog, setDialog] = useState<{
        type: 'x' | 'y' | 'all-x' | 'all-y' | null;
        label: string;
        value: string;
        cell: { x: string; y: string } | null;
        visible: boolean;
    }>({
        type: null,
        label: '',
        value: '',
        cell: null,
        visible: false,
    });

    // data prop이 바뀌면 내부 상태도 갱신
    useEffect(() => {
        setMatrixData(data);
    }, [data]);

    useEffect(() => {
        if (!matrixData || matrixData.length === 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        // 1. X/Y축의 "고유값" 배열 생성 (순서대로, 중복 허용X)
        const xUnique = matrixData.map(d => d.x);
        const yUnique = matrixData.map(d => d.y);

        // 실제 X/Y축 도메인(고유값) 추출
        const xDomain = Array.from(new Set(xUnique));
        const yDomain = Array.from(new Set(yUnique));

        // 2. scaleBand domain을 고유값으로
        const xScale = d3
            .scaleBand<string>()
            .domain(xDomain)
            .range([0, innerWidth])
            .padding(0.05);

        const yScale = d3
            .scaleBand<string>()
            .domain(yDomain)
            .range([0, innerHeight])
            .padding(0.05);

        const minValue = d3.min(matrixData, (d) => d.value) ?? 0;
        const maxValue = d3.max(matrixData, (d) => d.value) ?? 1;

        const colorScale = d3
            .scaleSequential<string>()
            .domain([minValue, maxValue])
            .interpolator(d3.interpolateYlGnBu);

        // 3. 셀 렌더링 (고유값 기준 위치)
        g.selectAll(".cell")
            .data(matrixData)
            .enter()
            .append("rect")
            .attr("class", "cell")
            .attr("x", (d) => xScale(d.x) || 0)
            .attr("y", (d) => yScale(d.y) || 0)
            .attr("width", xScale.bandwidth())
            .attr("height", yScale.bandwidth())
            .attr("fill", (d) => colorScale(d.value))
            .attr("stroke", "#ccc")
            .attr("stroke-width", 0.5)
            .on("contextmenu", (event: MouseEvent, d) => {
                event.preventDefault();
                setContextMenu({
                    visible: true,
                    x: event.clientX,
                    y: event.clientY,
                    cell: { x: d.x, y: d.y }
                });
            });

        // 4. 셀 값 텍스트 렌더링
        g.selectAll(".cell-label")
            .data(matrixData)
            .enter()
            .append("text")
            .attr("class", "cell-label")
            .attr("x", (d) => (xScale(d.x) || 0) + xScale.bandwidth() / 2)
            .attr("y", (d) => (yScale(d.y) || 0) + yScale.bandwidth() / 2 + 5)
            .attr("text-anchor", "middle")
            .attr("fill", "#222")
            .attr("pointer-events", "none")
            .text((d) => d.value);

        // 5. X축 (고유값 기준 위치, 실제 라벨 표시)
        g.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,0)`)
            .call(
                d3.axisTop(xScale)
                    .tickFormat((x) => x) // 실제 라벨 그대로 표시
            )
            .selectAll<SVGTextElement, string>("text")
            .style("text-anchor", "start")
            .attr("dx", "0.8em")
            .attr("dy", "1.25em")
            .attr("transform", "rotate(-90)");

        // 6. Y축 (고유값 기준 위치, 실제 라벨 표시)
        g.append("g")
            .attr("class", "y-axis")
            .call(
                d3.axisLeft(yScale)
                    .tickFormat((y) => y)
            )
            .selectAll<SVGTextElement, string>("text")
            .style("font-size", "10px");

    }, [matrixData, width, height, margin]);

    // 인라인 에디터 렌더링
    let inputBox: React.JSX.Element | null = null;
    if (editCell) {
        const xCategories = Array.from(new Set(matrixData.map((d) => d.x))).sort();
        const yCategories = Array.from(new Set(matrixData.map((d) => d.y))).sort();
        const xScale = d3
            .scaleBand<string>()
            .domain(xCategories)
            .range([0, width - margin.left - margin.right])
            .padding(0.05);
        const yScale = d3
            .scaleBand<string>()
            .domain(yCategories)
            .range([0, height - margin.top - margin.bottom])
            .padding(0.05);

        const x = (xScale(editCell.x) || 0) + margin.left;
        const y = (yScale(editCell.y) || 0) + margin.top;

        inputBox = (
            <input
                type="number"
                value={editValue}
                autoFocus
                style={{
                    position: "absolute",
                    left: x,
                    top: y,
                    width: xScale.bandwidth(),
                    height: yScale.bandwidth(),
                    fontSize: 14,
                    textAlign: "center",
                    zIndex: 10,
                    background: "rgba(255,255,255,0.95)",
                    border: "2px solid #3498db",
                    borderRadius: 4,
                }}
                onChange={e => setEditValue(e.target.value)}
                onBlur={() => setEditCell(null)}
                onKeyDown={e => {
                    if (e.key === "Enter") {
                        setMatrixData(prev =>
                            prev.map(cell =>
                                cell.x === editCell.x && cell.y === editCell.y
                                    ? { ...cell, value: Number(editValue) }
                                    : cell
                            )
                        );
                        setEditCell(null);
                    } else if (e.key === "Escape") {
                        setEditCell(null);
                    }
                }}
            />
        );
    }

    // X축 라벨 인라인 에디터
    let xLabelInput: React.JSX.Element | null = null;
    if (editXLabel) {
        // x축 라벨 위치 계산
        const xCategories = Array.from(new Set(matrixData.map((d) => d.x))).sort();
        const xScale = d3
            .scaleBand<string>()
            .domain(xCategories)
            .range([0, width - margin.left - margin.right])
            .padding(0.05);

        const x = (xScale(editXLabel) || 0) + margin.left;
        const y = margin.top - 30; // x축 라벨 위에 위치

        xLabelInput = (
            <input
                type="text"
                value={editXLabelValue}
                autoFocus
                style={{
                    position: "absolute",
                    left: x,
                    top: y,
                    width: xScale.bandwidth(),
                    fontSize: 12,
                    textAlign: "center",
                    zIndex: 20,
                    background: "rgba(255,255,255,0.95)",
                    border: "2px solid #f39c12",
                    borderRadius: 4,
                }}
                onChange={e => setEditXLabelValue(e.target.value)}
                onBlur={() => setEditXLabel(null)}
                onKeyDown={e => {
                    if (e.key === "Enter") {
                        setMatrixData(prev =>
                            prev.map(cell =>
                                cell.x === editXLabel
                                    ? { ...cell, x: editXLabelValue }
                                    : cell
                            )
                        );
                        setEditXLabel(null);
                    } else if (e.key === "Escape") {
                        setEditXLabel(null);
                    }
                }}
            />
        );
    }

    // Y축 라벨 인라인 에디터
    let yLabelInput: React.JSX.Element | null = null;
    if (editYLabel) {
        const yCategories = Array.from(new Set(matrixData.map((d) => d.y))).sort();
        const yScale = d3
            .scaleBand<string>()
            .domain(yCategories)
            .range([0, height - margin.top - margin.bottom])
            .padding(0.05);

        const x = margin.left - 80; // y축 라벨 왼쪽에 위치
        const y = (yScale(editYLabel) || 0) + margin.top;

        yLabelInput = (
            <input
                type="text"
                value={editYLabelValue}
                autoFocus
                style={{
                    position: "absolute",
                    left: x,
                    top: y,
                    width: 70,
                    fontSize: 12,
                    textAlign: "center",
                    zIndex: 20,
                    background: "rgba(255,255,255,0.95)",
                    border: "2px solid #e74c3c",
                    borderRadius: 4,
                }}
                onChange={e => setEditYLabelValue(e.target.value)}
                onBlur={() => setEditYLabel(null)}
                onKeyDown={e => {
                    if (e.key === "Enter") {
                        setMatrixData(prev =>
                            prev.map(cell =>
                                cell.y === editYLabel
                                    ? { ...cell, y: editYLabelValue }
                                    : cell
                            )
                        );
                        setEditYLabel(null);
                    } else if (e.key === "Escape") {
                        setEditYLabel(null);
                    }
                }}
            />
        );
    }

    return (
        <div style={{ position: "relative", width, height }}>
            <svg ref={svgRef} width={width} height={height} style={{ overflow: 'visible', display: 'block' }} />
            {inputBox}
            {xLabelInput}
            {yLabelInput}
            {contextMenu?.visible && contextMenu.cell && (
                <div
                    style={{
                        position: 'fixed',
                        top: contextMenu.y,
                        left: contextMenu.x,
                        background: 'white',
                        border: '1px solid #ccc',
                        borderRadius: 4,
                        zIndex: 100,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        minWidth: 160,
                    }}
                    onClick={e => e.stopPropagation()}
                    onContextMenu={e => e.preventDefault()}
                >
                    <button
                        style={{ display: 'block', width: '100%', padding: 8, border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer' }}
                        onClick={() => {
                            setDialog({
                                type: 'x',
                                label: contextMenu.cell!.x,
                                value: contextMenu.cell!.x,
                                cell: contextMenu.cell,
                                visible: true,
                            });
                            setContextMenu(null);
                        }}
                    >
                        X축 수정
                    </button>
                    <button
                        style={{ display: 'block', width: '100%', padding: 8, border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer' }}
                        onClick={() => {
                            setDialog({
                                type: 'y',
                                label: contextMenu.cell!.y,
                                value: contextMenu.cell!.y,
                                cell: contextMenu.cell,
                                visible: true,
                            });
                            setContextMenu(null);
                        }}
                    >
                        Y축 수정
                    </button>
                    <button
                        style={{ display: 'block', width: '100%', padding: 8, border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', color: '#2980b9' }}
                        onClick={() => {
                            // 기존 X축 라벨을 줄바꿈 문자열로
                            const xLabels = Array.from(new Set(matrixData.map(d => d.x))).join('\n');
                            setDialog({
                                type: 'all-x',
                                label: '',
                                value: xLabels,
                                cell: null,
                                visible: true,
                            });
                            setContextMenu(null);
                        }}
                    >
                        전체 X축 데이터 수정
                    </button>
                    <button
                        style={{ display: 'block', width: '100%', padding: 8, border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', color: '#27ae60' }}
                        onClick={() => {
                            // 기존 Y축 라벨을 줄바꿈 문자열로
                            const yLabels = Array.from(new Set(matrixData.map(d => d.y))).join('\n');
                            setDialog({
                                type: 'all-y',
                                label: '',
                                value: yLabels,
                                cell: null,
                                visible: true,
                            });
                            setContextMenu(null);
                        }}
                    >
                        전체 Y축 데이터 수정
                    </button>
                </div>
            )}
            {dialog.visible && (
                <div
                    style={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: 'white',
                        border: '1px solid #888',
                        borderRadius: 8,
                        zIndex: 200,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                        padding: 24,
                        minWidth: 320,
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    <h3 style={{ marginBottom: 16 }}>
                        {dialog.type === 'x' && 'X축 라벨 수정'}
                        {dialog.type === 'y' && 'Y축 라벨 수정'}
                        {dialog.type === 'all-x' && '전체 X축 데이터 수정 (한 줄에 하나씩)'}
                        {dialog.type === 'all-y' && '전체 Y축 데이터 수정 (한 줄에 하나씩)'}
                    </h3>
                    {(dialog.type === 'all-x' || dialog.type === 'all-y') ? (
                        <textarea
                            value={dialog.value}
                            autoFocus
                            rows={8}
                            style={{
                                width: '100%',
                                fontSize: 16,
                                padding: 8,
                                marginBottom: 16,
                                border: '1px solid #ccc',
                                borderRadius: 4,
                                resize: 'vertical',
                            }}
                            onChange={e => setDialog(d => ({ ...d, value: e.target.value }))}
                            placeholder="한 줄에 하나씩 입력하세요"
                        />
                    ) : (
                        <input
                            type="text"
                            value={dialog.value}
                            autoFocus
                            style={{
                                width: '100%',
                                fontSize: 16,
                                padding: 8,
                                marginBottom: 16,
                                border: '1px solid #ccc',
                                borderRadius: 4,
                            }}
                            onChange={e => setDialog(d => ({ ...d, value: e.target.value }))}
                        />
                    )}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <button
                            style={{ padding: '8px 16px', borderRadius: 4, border: 'none', background: '#eee' }}
                            onClick={() => setDialog(d => ({ ...d, visible: false }))}
                        >
                            취소
                        </button>
                        <button
                            style={{ padding: '8px 16px', borderRadius: 4, border: 'none', background: '#3498db', color: 'white' }}
                            onClick={() => {
                                if (dialog.type === 'x') {
                                    setMatrixData(prev =>
                                        prev.map(cell =>
                                            cell.x === dialog.label
                                                ? { ...cell, x: dialog.value }
                                                : cell
                                        )
                                    );
                                } else if (dialog.type === 'y') {
                                    setMatrixData(prev =>
                                        prev.map(cell =>
                                            cell.y === dialog.label
                                                ? { ...cell, y: dialog.value }
                                                : cell
                                        )
                                    );
                                } else if (dialog.type === 'all-x') {
                                    // 전체 X축 데이터 수정: 입력값 기준으로 X축 라벨 재구성
                                    const newXLabels = dialog.value.split('\n').map(s => s.trim()).filter(Boolean);
                                    const yLabels = Array.from(new Set(matrixData.map(d => d.y)));
                                    // X, Y 조합으로 모든 셀 생성, 기존 값이 있으면 유지, 없으면 0
                                    setMatrixData(prev => {
                                        const cellMap = new Map(prev.map(cell => [`${cell.x}|||${cell.y}`, cell.value]));
                                        const newMatrix: MatrixData[] = [];
                                        for (const y of yLabels) {
                                            for (const x of newXLabels) {
                                                const key = `${x}|||${y}`;
                                                newMatrix.push({
                                                    x,
                                                    y,
                                                    value: cellMap.has(key) ? cellMap.get(key)! : 0,
                                                });
                                            }
                                        }
                                        return newMatrix;
                                    });
                                } else if (dialog.type === 'all-y') {
                                    // 전체 Y축 데이터 수정: 입력값 기준으로 Y축 라벨 재구성
                                    const newYLabels = dialog.value.split('\n').map(s => s.trim()).filter(Boolean);
                                    const xLabels = Array.from(new Set(matrixData.map(d => d.x)));
                                    setMatrixData(prev => {
                                        const cellMap = new Map(prev.map(cell => [`${cell.x}|||${cell.y}`, cell.value]));
                                        const newMatrix: MatrixData[] = [];
                                        for (const y of newYLabels) {
                                            for (const x of xLabels) {
                                                const key = `${x}|||${y}`;
                                                newMatrix.push({
                                                    x,
                                                    y,
                                                    value: cellMap.has(key) ? cellMap.get(key)! : 0,
                                                });
                                            }
                                        }
                                        return newMatrix;
                                    });
                                }
                                setDialog(d => ({ ...d, visible: false }));
                            }}
                        >
                            수정
                        </button>
                    </div>
                </div>
            )}
            <div ref={tooltipRef} />
        </div>
    );
};

const HeatmapChart: React.FC = () => {
    // D3.js 렌더링을 위한 ref 생성
    const svgRef = useRef<SVGSVGElement | null>(null);

    // 셀 간의 패딩을 조절하여 셀 크기를 조절합니다.
    // 0에 가까울수록 셀이 커지고 밀집도가 높아집니다. (첨부 이미지와 유사하게)
    const cellPadding: number = 0.01;

    // 컴포넌트 마운트 시 및 데이터/크기 변경 시 D3.js 렌더링
    useEffect(() => {
        // SVG 컨테이너 선택
        const svg = d3.select<SVGSVGElement, unknown>(svgRef.current!); // Non-null assertion

        // 기존 차트 제거 (재렌더링 시 중복 방지)
        svg.selectAll("*").remove();

        // 히트맵의 크기와 여백 설정
        const margin = { top: 100, right: 20, bottom: 20, left: 150 }; // 상단 여백을 늘려 X축 레이블 공간 확보
        const baseWidth: number = 800; // 전체 차트의 기본 너비 (첨부 이미지와 유사하게 넓게)
        const baseHeight: number = 800; // 전체 차트의 기본 높이 (첨부 이미지와 유사하게 높게)

        // 컨테이너의 실제 너비를 기준으로 너비와 높이를 동적으로 설정
        const containerWidth: number = svgRef.current!.parentElement!.getBoundingClientRect().width;
        const width: number = containerWidth - margin.left - margin.right;
        const height: number = baseHeight * (width / baseWidth); // 비율 유지

        // SVG 크기 설정
        svg.attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

        // 차트 그룹 생성 (여백 적용)
        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // 행과 열의 레이블 (첨부 이미지와 유사하게 더 많은 레이블 생성)
        const labels1: string[] = Array.from({ length: 30 }, (_, i) => `항목 ${String.fromCharCode(65 + Math.floor(i / 2))}${i % 2 === 0 ? 'X' : 'Y'}${i}`);
        const rowLabels: string[] = labels1;
        const labels2: string[] = Array.from({ length: 10 }, (_, i) => `항목 ${String.fromCharCode(65 + Math.floor(i / 2))}${i % 2 === 0 ? 'X' : 'Y'}${i}`);
        const colLabels: string[] = labels2;

        // 데이터 생성 (예시: 무작위 값)
        const data: HeatmapData[] = [];
        rowLabels.forEach((row: string) => {
            colLabels.forEach((col: string) => {
                data.push({
                    row: row,
                    col: col,
                    value: Math.floor(Math.random() * 100) // 0에서 99 사이의 무작위 값
                });
            });
        });

        // X축 스케일 설정 (시간대)
        const x = d3.scaleBand<string>()
            .range([0, width])
            .domain(colLabels)
            .padding(cellPadding);

        // X축 그리기 (상단으로 이동 및 레이블 회전)
        g.append("g")
            .attr("class", "x-axis") // 클래스 추가
            .attr("transform", `translate(0,0)`) // 상단으로 이동
            .call(d3.axisTop(x)) // axisBottom 대신 axisTop 사용
            .selectAll<SVGTextElement, string>("text") // 텍스트 요소에 대한 타입 지정
            .style("text-anchor", "start") // 텍스트 앵커를 시작으로 변경
            .attr("dx", "0.8em") // 위치 조정
            .attr("dy", "1.25em") // 위치 조정
            .attr("transform", "rotate(-90)")
        //     .attr("transform", "rotate(-45)"); // 45도 회전하여 겹침 방지
        // g.append("g")
        //     .attr("class", "x-axis")
        //     .attr("transform", `translate(0, ${innerHeight})`)
        //     .call(d3.axisBottom(xScale))
        //     .selectAll("text")
        //     .style("text-anchor", "end")
        //     .attr("dx", "-.8em")
        //     .attr("dy", ".15em")
        //     .attr("transform", "rotate(0)") // Slightly less rotation for readability
        //     .style("font-size", "10px"); // Smaller font size for axis labels
        // Y축 스케일 설정 (요일)
        const y = d3.scaleBand<string>()
            .range([height, 0])
            .domain(rowLabels)
            .padding(cellPadding);

        // Y축 그리기
        g.append("g")
            .attr("class", "y-axis") // 클래스 추가
            .call(d3.axisLeft(y))
            .selectAll<SVGTextElement, string>("text") // 텍스트 요소에 대한 타입 지정
            .style("text-anchor", "end")
            .attr("dx", "-0.5em"); // 레이블 위치 조정

        // 색상 스케일 설정 (첨부 이미지와 유사한 녹색 계열)
        const colorScale = d3.scaleSequential<string>()
            .interpolator(d3.interpolateGreens) // interpolateGreens 사용
            .domain([0, 100]); // 예시 데이터의 범위에 맞춤

        // 툴팁 요소 생성 (React 컴포넌트 외부에서 D3로 제어)
        const tooltip = d3.select<HTMLDivElement, unknown>("body")
            .append("div")
            .attr("class", "tooltip fixed bg-black text-white p-2 rounded-md text-sm pointer-events-none opacity-0 transition-opacity duration-200")
            .style("z-index", 1000); // 툴팁이 다른 요소 위에 표시되도록 z-index 설정

        // // 마우스 이벤트 핸들러
        // const mouseover = function(event: MouseEvent, d: HeatmapData) {
        //   tooltip.style("opacity", 1);
        //   d3.select<SVGRectElement, HeatmapData>(this) // `this` 컨텍스트와 데이터 타입 지정
        //     .style("stroke", "#3498db") // 호버 시 테두리 색상 변경
        //     .style("stroke-width", 2);
        // };

        // const mousemove = function(event: MouseEvent, d: HeatmapData) {
        //   tooltip
        //     .html(`행: ${d.row}<br>열: ${d.col}<br>값: <b>${d.value}</b>`)
        //     .style("left", (event.pageX + 10) + "px")
        //     .style("top", (event.pageY - 28) + "px");
        // };

        // const mouseleave = function(event: MouseEvent, d: HeatmapData) {
        //   tooltip.style("opacity", 0);
        //   d3.select<SVGRectElement, HeatmapData>(this) // `this` 컨텍스트와 데이터 타입 지정
        //     .style("stroke", "#fff") // 원래 테두리 색상으로 복원
        //     .style("stroke-width", 1);
        // };

        // 히트맵 셀 (사각형) 추가
        g.selectAll<SVGRectElement, HeatmapData>(".cell") // 셀 요소와 데이터 타입 지정
            .data(data, d => `${d.row}:${d.col}`) // 고유 키로 데이터 바인딩
            .enter()
            .append("rect")
            .attr("class", "cell")
            .attr("x", d => x(d.col)!) // Non-null assertion for scaleBand output
            .attr("y", d => y(d.row)!) // Non-null assertion for scaleBand output
            .attr("width", x.bandwidth())
            .attr("height", y.bandwidth())
            .style("fill", d => colorScale(d.value))
            .style("stroke", "#fff") // 기본 테두리 색상
            .style("stroke-width", 1) // 기본 테두리 두께
        //   .on("mouseover", mouseover)
        //   .on("mousemove", mousemove)
        //   .on("mouseleave", mouseleave);

        // cleanup 함수: 컴포넌트 언마운트 시 툴팁 제거
        return () => {
            tooltip.remove();
        };
    }, []); // 빈 배열은 컴포넌트 마운트 시 한 번만 실행됨을 의미

    return (
        <div className="flex justify-center items-center w-full h-full">
            {/* ref를 SVG 요소에 연결 */}
            <svg ref={svgRef} className="block"></svg>
        </div>
    );
};

// --- Usage Example ---
const Matrix: React.FC = () => {
    const taskEngineerData: MatrixData[] = [
        { x: 'Task A', y: 'Engineer 1', value: 80 },
        { x: 'Task B', y: 'Engineer 1', value: 20 },
        { x: 'Task C', y: 'Engineer 1', value: 90 },
        { x: 'Task A', y: 'Engineer 2', value: 40 },
        { x: 'Task B', y: 'Engineer 2', value: 70 },
        { x: 'Task C', y: 'Engineer 2', value: 10 },
        { x: 'Task A', y: 'Engineer 3', value: 60 },
        { x: 'Task B', y: 'Engineer 3', value: 30 },
        { x: 'Task C', y: 'Engineer 3', value: 50 },
        { x: 'Task D', y: 'Engineer 1', value: 45 },
        { x: 'Task D', y: 'Engineer 2', value: 85 },
        { x: 'Task D', y: 'Engineer 3', value: 25 },
    ];

    const productFeatureData: MatrixData[] = [
        { x: 'Feature A', y: 'Product X', value: 0.9 },
        { x: 'Feature B', y: 'Product X', value: 0.7 },
        { x: 'Feature C', y: 'Product X', value: 0.2 },
        { x: 'Feature A', y: 'Product Y', value: 0.5 },
        { x: 'Feature B', y: 'Product Y', value: 0.8 },
        { x: 'Feature C', y: 'Product Y', value: 0.6 },
        { x: 'Feature A', y: 'Product Z', value: 0.3 },
        { x: 'Feature B', y: 'Product Z', value: 0.95 },
        { x: 'Feature C', y: 'Product Z', value: 0.8 },
    ];

    return (
        <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
            <h1>Task-Engineer Performance Matrix</h1>
            <XYMatrixD3 data={taskEngineerData} width={700} height={450} />

            <div style={{ marginTop: '40px' }}></div> {/* Add some spacing */}

            <h2>Product Feature Matrix</h2>
            <XYMatrixD3
                data={productFeatureData}
                width={200}
                height={200}
                margin={{ top: 50, right: 20, bottom: 50, left: 100 }}
            />

            <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
                <h1 className="text-3xl font-bold text-gray-800 mb-8 rounded-lg p-3 shadow-md bg-white">
                    React D3.js 히트맵 매트릭스 (TSX)
                </h1>
                <div className="w-full max-w-4xl bg-white rounded-lg shadow-xl p-6">
                    <HeatmapChart />
                </div>
            </div>
        </div>
    );
};

export default Matrix;