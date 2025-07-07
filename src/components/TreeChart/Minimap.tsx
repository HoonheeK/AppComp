import React from "react";
import * as d3 from "d3";

type TreeNode = {
  id: string;
  name: string;
  children: TreeNode[];
};

type D3Node = d3.HierarchyPointNode<TreeNode>;

interface MinimapProps {
  treeData: TreeNode | null;
  dimensions: { width: number; height: number };
  selectedNodeIds: string[];
  minimapWidth: number;
  minimapHeight: number;
  minimapViewport: { x: number; y: number };
  showMinimap: boolean;
  handleMinimapDrag: (e: React.MouseEvent<SVGRectElement, MouseEvent>) => void;
  nodeSpaceMode: "auto" | "custom";
  customNodeHeight: number;
  customNodeWidth: number;
  treeArea: { minX: number; minY: number; maxX: number; maxY: number };
  viewBox: { x: number; y: number; width: number; height: number };
}

const Minimap: React.FC<MinimapProps> = ({
  treeData,
  dimensions,
  selectedNodeIds,
  minimapWidth,
  minimapHeight,
  minimapViewport,
  showMinimap,
  handleMinimapDrag,
  nodeSpaceMode,
  customNodeHeight,
  customNodeWidth,
  treeArea,
  viewBox,
}) => {
  if (!treeData || !dimensions.width || !dimensions.height) return null;

  // 트리 구조 계산 (minimap용)
  let treemap: d3.TreeLayout<TreeNode>;
  if (nodeSpaceMode === "custom") {
    treemap = d3.tree<TreeNode>().nodeSize([customNodeHeight, customNodeWidth]);
  } else {
    treemap = d3.tree<TreeNode>().size([minimapHeight - 20, minimapWidth - 20]);
  }
  const root = d3.hierarchy(treeData);
  const treeNodes = treemap(root);

  // 노드와 링크 데이터
  const nodes = treeNodes.descendants().filter(d => d.data.id !== "virtual-root-container");
  const links = treeNodes.links().filter(d => d.source.data.id !== "virtual-root-container");

  // 트리 전체 영역
  const { minX, minY, maxX, maxY } = treeArea;
  const treeW = maxY - minY || 1;
  const treeH = maxX - minX || 1;

  // 미니맵 내 트리 배율
  const scaleX = (minimapHeight - 20) / treeH;
  const scaleY = (minimapWidth - 20) / treeW;

  // 트리 좌표를 미니맵 좌표로 변환
  const getMiniX = (x: number) => (x - minX) * scaleX + 10;
  const getMiniY = (y: number) => (y - minY) * scaleY + 10;

  // 미니맵 뷰포트(빨간 사각형) 계산: Tree Chart에서 보여지는 영역을 미니맵에 맞게 변환
  const viewportW = (viewBox.width / treeW) * (minimapWidth - 20);
  const viewportH = (viewBox.height / treeH) * (minimapHeight - 20);
  const viewportX = ((viewBox.y - minX) / treeH) * (minimapHeight - 20) + 10;
  const viewportY = ((viewBox.x - minY) / treeW) * (minimapWidth - 20) + 10;

  return (
    <svg
      width={minimapWidth}
      height={minimapHeight}
      style={{
        background: "#f8fafc",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
        display: showMinimap ? "block" : "none"
      }}
    >
      {/* 링크(선) */}
      {links.map((d, i) => (
        <path
          key={i}
          d={d3.linkHorizontal()
            .x((n: any) => getMiniY(n.y))
            .y((n: any) => getMiniX(n.x))(d as any) as string}
          fill="none"
          stroke="#bbb"
          strokeWidth={1.5}
          markerEnd="url(#minimap-arrowhead)"
        />
      ))}
      {/* 노드(원) */}
      {nodes.map((d, i) => (
        <circle
          key={d.data.id}
          cx={getMiniY(d.y)}
          cy={getMiniX(d.x)}
          r={5}
          fill={selectedNodeIds.includes(d.data.id) ? "#ffe066" : "#fff"}
          stroke="#6366f1"
          strokeWidth={1.5}
        />
      ))}
      {/* 빨간 사각형(뷰포트) - Tree Chart에서 보여지는 영역 */}
      <rect
        x={viewportY}
        y={viewportX}
        width={viewportW}
        height={viewportH}
        fill="red"
        fillOpacity={0.5}
        stroke="red"
        strokeWidth={2}
        style={{ cursor: "move" }}
        onMouseDown={handleMinimapDrag}
      />
      {/* 화살표 마커 정의 */}
      <defs>
        <marker
          id="minimap-arrowhead"
          viewBox="0 -5 10 10"
          refX="10"
          refY="0"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M0,-5L10,0L0,5" fill="#bbb" />
        </marker>
      </defs>
    </svg>
  );
};

export default Minimap;