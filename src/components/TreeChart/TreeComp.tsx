import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { saveAs } from 'file-saver';
import { useTreeCommands } from './useTreeCommands';

// 타입 정의
type TreeNode = {
  id: string;
  name: string;
  children: TreeNode[];
};

type TreeData = TreeNode | null;

type D3Node = d3.HierarchyPointNode<TreeNode>;

// Utility function to generate unique IDs
const generateId = () => `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Initial tree data: A virtual root container holding actual roots as children
const initialTreeData: TreeNode = {
  id: "virtual-root-container",
  name: "",
  children: [
    {
      id: generateId(),
      name: 'Root',
      children: [
        {
          id: generateId(),
          name: 'Child 1',
          children: [
            { id: generateId(), name: 'Grandchild 1', children: [] },
            { id: generateId(), name: 'Grandchild 2', children: [] },
          ],
        },
        { id: generateId(), name: 'Child 2', children: [] },
      ],
    },
  ],
};

function TreeComp() {
  const [treeData, setTreeData] = useState<TreeData>(initialTreeData);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);

  // State for inline editing
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingNodeName, setEditingNodeName] = useState<string>('');
  const editingInputRef = useRef<HTMLInputElement>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // State for context menu
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [contextMenuType, setContextMenuType] = useState(''); // 'node' or 'background'

  // State for custom confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  // State for custom tooltip
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipContent, setTooltipContent] = useState('');
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // History states for Undo/Redo
  const [history, setHistory] = useState<TreeData[]>([initialTreeData]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const MAX_HISTORY_SIZE = 20;

  // State to store the calculated minimum Y offset for tree translation
  const [minYOffset, setMinYOffset] = useState(0);

  // Store D3 hierarchy for navigation and inline editing position
  const d3TreeNodesRef = useRef<D3Node[] | null>(null);
  const margin = { top: 40, right: 90, bottom: 50, left: 90 };

  // Helper to focus and select text in the inline input
  const focusAndSelectInput = useCallback(() => {
    setTimeout(() => {
      if (editingInputRef.current) {
        editingInputRef.current.focus();
        editingInputRef.current.select();
      }
    }, 0);
  }, []);

  // Function to save current tree state to history
  const saveStateToHistory = useCallback((newTreeState: TreeData) => {
    setHistory(prevHistory => {
      const newHistory = prevHistory.slice(0, historyIndex + 1);
      newHistory.push(newTreeState);
      if (newHistory.length > MAX_HISTORY_SIZE) {
        newHistory.shift();
      }
      return newHistory;
    });
    setHistoryIndex(prevIndex => {
      const newCalculatedIndex = prevIndex + 1;
      return Math.min(newCalculatedIndex, MAX_HISTORY_SIZE - 1);
    });
    setTreeData(newTreeState);
  }, [historyIndex]);

  // State for selected link (edge)
  const [selectedLink, setSelectedLink] = useState<{ sourceId: string; targetId: string } | null>(null);


  // Update dimensions on window resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Function to find a node by ID in the tree
  const findNodeById = useCallback((node: TreeNode | null, id: string | null): TreeNode | null => {
    if (!node || !id) return null;
    if (node.id === id) {
      return node;
    }
    if (node.children) {
      for (let i = 0; i < node.children.length; i++) {
        const found = findNodeById(node.children[i], id);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }, []);

  // Function to find a node and its parent by ID
  const findNodeAndParentById = useCallback((node: TreeNode | null, id: string | null, parent: TreeNode | null = null): { node: TreeNode | null, parent: TreeNode | null } => {
    if (!node || !id) return { node: null, parent: null };
    if (node.id === id) {
      return { node, parent };
    }
    if (node.children) {
      for (let i = 0; i < node.children.length; i++) {
        const found = findNodeAndParentById(node.children[i], id, node);
        if (found.node) {
          return found;
        }
      }
    }
    return { node: null, parent: null };
  }, []);

  // D3 Tree rendering logic
  useEffect(() => {
    if (!dimensions.width || !dimensions.height || !treeData) {
      d3.select(svgRef.current).selectAll("*").remove();
      d3TreeNodesRef.current = null;
      return;
    }

    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr("width", dimensions.width)
      .attr("height", height + margin.top + margin.bottom);

    svg.selectAll("*").remove();

    const treemap = d3.tree<TreeNode>().size([height, width]);
    const root = d3.hierarchy(treeData);
    const treeNodes = treemap(root);

    d3TreeNodesRef.current = treeNodes.descendants();

    const visibleNodes = treeNodes.descendants().filter(d => d.data.id !== "virtual-root-container");
    const newMinYOffset = visibleNodes.length > 0 ? d3.min(visibleNodes, d => d.y) ?? 0 : 0;
    setMinYOffset(newMinYOffset);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left - newMinYOffset},${margin.top})`);

    g.selectAll(".link")
      .data(treeNodes.links().filter(d => d.source.data.id !== "virtual-root-container"))
      .enter().append("path")
      .attr("class", d => {
        const isSelected =
          selectedLink &&
          selectedLink.sourceId === d.source.data.id &&
          selectedLink.targetId === d.target.data.id;
        return "link" + (isSelected ? " link--selected" : "");
      })
      .attr("d", d3.linkHorizontal<d3.HierarchyPointLink<TreeNode>, d3.HierarchyPointNode<TreeNode>>()
        .x(d => d.y)
        .y(d => d.x))
      .attr("fill", "none")
      .attr("stroke", d =>
        selectedLink &&
          selectedLink.sourceId === d.source.data.id &&
          selectedLink.targetId === d.target.data.id
          ? "#f59e42"
          : "#ccc"
      )
      .attr("stroke-width", d =>
        selectedLink &&
          selectedLink.sourceId === d.source.data.id &&
          selectedLink.targetId === d.target.data.id
          ? 6 // 더 굵게
          : 3 // 더 굵게
      )
      .attr("marker-end", "url(#arrowhead)") // 화살표 마커
      .style("cursor", "pointer")
      .on("click", function (event, d) {
        event.stopPropagation();
        setSelectedLink({
          sourceId: d.source.data.id,
          targetId: d.target.data.id,
        });
        setSelectedNodeIds([]); // 노드 선택 해제
        setEditingNodeId(null);
        setShowContextMenu(false);
      })
      .on("contextmenu", function (event, d) {
        event.preventDefault();
        setSelectedLink({
          sourceId: d.source.data.id,
          targetId: d.target.data.id,
        });
        setSelectedNodeIds([]);
        setEditingNodeId(null);
        setContextMenuType('link');
        setContextMenuPosition({ x: event.pageX, y: event.pageY });
        setShowContextMenu(true);
      });

    // SVG에 화살표 마커(defs) 추가
    svg.select("defs").remove(); // 중복 방지
    const defs = svg.append("defs");
    defs.append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -8 20 16") // 더 큰 viewBox
      .attr("refX", 18) // 선 끝에 맞추기 (더 크게)
      .attr("refY", 0)
      .attr("markerWidth", 6) // 더 크게
      .attr("markerHeight", 6) // 더 크게
      .attr("orient", "auto")
      .attr("markerUnits", "strokeWidth")
      .append("path")
      .attr("d", "M0,-8L20,0L0,8") // 더 큰 삼각형
      .attr("fill", "#ccc");

    // 선택된 링크는 화살표 색상도 강조
    if (selectedLink) {
      defs.append("marker")
        .attr("id", "arrowhead-selected")
        .attr("viewBox", "0 -8 20 16")
        .attr("refX", 18)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .attr("markerUnits", "strokeWidth")
        .append("path")
        .attr("d", "M0,-8L20,0L0,8")
        .attr("fill", "#f59e42");
      g.selectAll(".link--selected").attr("marker-end", "url(#arrowhead-selected)");
    }

    const node = g.selectAll<SVGGElement, D3Node>(".node")
      .data(treeNodes.descendants().filter(d => d.data.id !== "virtual-root-container"))
      .enter().append("g")
      .attr("class", d => `node ${d.children ? "node--internal" : "node--leaf"}`)
      .attr("transform", d => `translate(${d.y},${d.x})`)
      .on("click", (_: any, d: D3Node) => {
        setSelectedNodeIds([d.data.id]);
        setEditingNodeId(null);
        setShowContextMenu(false);
      })
      .on("contextmenu", (event, d: D3Node) => {
        event.preventDefault();
        setSelectedNodeIds([d.data.id]);
        setEditingNodeId(null);
        setContextMenuType('node');
        setContextMenuPosition({ x: event.pageX, y: event.pageY });
        setShowContextMenu(true);
      })
      .on("mouseover", (event, d: D3Node) => {
        setShowTooltip(true);
        setTooltipContent(d.data.name);

        // SVG 좌표를 브라우저 좌표로 변환
        const svg = svgRef.current;
        if (svg) {
          const pt = svg.createSVGPoint();
          pt.x = d.y;
          pt.y = d.x;
          const screenCTM = svg.getScreenCTM();
          if (screenCTM) {
            const transformed = pt.matrixTransform(screenCTM);
            const containerRect = containerRef.current!.getBoundingClientRect();
            setTooltipPosition({
              x: transformed.x - containerRect.left + 16, // 약간 오른쪽
              y: transformed.y - containerRect.top - 8    // 약간 위쪽
            });
            return;
          }
        }
        // fallback: 마우스 위치 기준
        const containerRect = containerRef.current!.getBoundingClientRect();
        setTooltipPosition({
          x: event.pageX - containerRect.left + 10,
          y: event.pageY - containerRect.top + 10
        });
      })
      .on("mouseout", () => {
        setShowTooltip(false);
        setTooltipContent('');
      });

    node.append("circle")
      .attr("fill", d =>
        selectedNodeIds.includes(d.data.id)
          ? "#ffe066"
          : "#fff"
      )
      .attr("r", 10)
      .attr("stroke", "#6366f1")
      .attr("stroke-width", 2);

    node.append("text")
      .attr("dy", ".35em")
      .attr("x", 13)
      .attr("text-anchor", "start")
      .text((d: D3Node) => {
        const name = d.data.name;
        const maxLength = 20;
        return name.length > maxLength ? name.substring(0, maxLength) + '...' : name;
      })
      .attr("font-size", "12px")
      .attr("fill", "#333");

  }, [treeData, selectedNodeIds, selectedLink, dimensions, editingNodeId]);

  // Handle right-click on SVG background
  const handleSvgContextMenu = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    event.preventDefault(); // Prevent default browser context menu
    setSelectedNodeIds([]); // Deselect any node
    setEditingNodeId(null); // Exit inline editing mode
    setContextMenuType('background');
    // Context menu position should be relative to the viewport
    setContextMenuPosition({ x: event.pageX, y: event.pageY });
    setShowContextMenu(true);
    setShowTooltip(false); // Hide tooltip when context menu appears
  }, []);

  // SVG 배경 클릭 시 선택 해제
  const handleSvgBackgroundClick = (event: React.MouseEvent<SVGSVGElement>) => {
    // 노드/링크가 아닌 SVG 배경 클릭 시
    if (event.target === svgRef.current) {
      setSelectedNodeIds([]);
      setSelectedLink(null);
      setEditingNodeId(null);
      setShowContextMenu(false);
    }
  };

  // Handlers for node operations
  const handleAddNode = useCallback((type: string) => {
    setShowContextMenu(false);
    setShowTooltip(false);

    const newNode = { id: generateId(), name: 'Node', children: [] };

    let finalTreeData: TreeData = null;

    setTreeData(prevTreeData => {
      let newTreeData = JSON.parse(JSON.stringify(prevTreeData)); // Deep copy

      if (type === 'child') {
        if (!selectedNodeIds[0] || !newTreeData) return prevTreeData;
        const selectedNode = findNodeById(newTreeData, selectedNodeIds[0]);
        if (selectedNode) {
          selectedNode.children = selectedNode.children || [];
          selectedNode.children.push(newNode);
        }
      } else if (type === 'sibling') {
        if (!selectedNodeIds[0] || !newTreeData) return prevTreeData;
        const { node, parent } = findNodeAndParentById(newTreeData, selectedNodeIds[0]);
        if (parent) {
          parent.children.push(newNode);
        } else if (node && node.id === newTreeData.id) {
          // If selected is a direct child of the virtual root, treat adding sibling as adding another root
          if (newTreeData.id === "virtual-root-container" && newTreeData.children.some((child: TreeNode) => child.id === selectedNodeIds[0])) {
            newTreeData.children.push(newNode);
          } else {
            // This case should ideally not happen if initialTreeData is always the container.
            // If it's a single root that's not the virtual container, we can't add a sibling.
            return prevTreeData;
          }
        }
      } else if (type === 'parent') {
        if (!newTreeData) return prevTreeData;
        // If selected node is a direct child of the virtual root, its parent is the virtual root.
        // If it's not a direct child, we need to wrap it.
        const { node, parent } = findNodeAndParentById(newTreeData, selectedNodeIds[0]);

        if (node && parent && parent.id === "virtual-root-container") {
          // If the selected node is a direct "root" (child of virtual-root-container)
          // Create a new node that becomes the parent of the selected node
          const newParentNode = {
            id: generateId(),
            name: 'Node',
            children: [node]
          };
          // Replace the old node with the new parent node in the virtual root's children
          parent.children = parent.children.map((child: TreeNode) =>
            child.id === node.id ? newParentNode : child
          );
          newTreeData = parent; // Update newTreeData to the modified parent
        } else if (node && parent) {
          // If it's a regular node within a subtree, make it a child of the new parent
          const newParentNode = {
            id: generateId(),
            name: 'Node',
            children: [node]
          };
          // Replace the old node with the new parent node in its original parent's children
          parent.children = parent.children.map((child: TreeNode) =>
            child.id === node.id ? newParentNode : child
          );
          newTreeData = newTreeData; // No change to the top-level treeData reference
        } else if (!selectedNodeIds[0] && newTreeData.id !== "virtual-root-container") {
          // If no node selected, but there's a single root, make new node its parent
          const newRoot = {
            id: generateId(),
            name: 'Node',
            children: [newTreeData]
          };
          newTreeData = newRoot;
        } else {
          // This case might occur if selectedNodeId is null and treeData is the virtual container
          // or if selectedNode is the virtual container itself (which shouldn't be selectable)
          return prevTreeData;
        }

      } else if (type === 'root') { // This case is for adding the very first root node OR adding another root
        if (newTreeData.id === "virtual-root-container") {
          // Already under a virtual root, just add the new node as its child
          newTreeData.children.push(newNode);
        } else {
          // This should not happen if initialTreeData is always the virtual container.
          // Fallback: If for some reason treeData is a single root, wrap it and the new node.
          const implicitSuperRoot = {
            id: "virtual-root-container",
            name: "",
            children: [newTreeData, newNode]
          };
          newTreeData = implicitSuperRoot;
        }
      }
      finalTreeData = newTreeData; // Capture the final tree data for history
      return newTreeData;
    });

    // Save the new state to history after setTreeData has potentially batched
    // Use a setTimeout to ensure setTreeData has initiated its update
    setTimeout(() => {
      if (finalTreeData) {
        saveStateToHistory(finalTreeData);
        // Set the newly created node as selected and enter editing mode
        setSelectedNodeIds([newNode.id]);
        setEditingNodeId(newNode.id);
        setEditingNodeName(newNode.name);
        focusAndSelectInput();
      }
    }, 0);


  }, [selectedNodeIds, treeData, findNodeById, findNodeAndParentById, focusAndSelectInput, saveStateToHistory]);

  const handleEditNode = useCallback(() => {
    if (!selectedNodeIds[0]) {
      setShowContextMenu(false);
      return;
    }
    const nodeToEdit = findNodeById(treeData, selectedNodeIds[0]);
    if (nodeToEdit) {
      setEditingNodeId(selectedNodeIds[0]);
      setEditingNodeName(nodeToEdit.name);
      focusAndSelectInput();
    }
    setShowContextMenu(false);
    setShowTooltip(false); // Hide tooltip when editing
  }, [selectedNodeIds, treeData, findNodeById, focusAndSelectInput]);

  const handleFinishEditing = useCallback(() => {
    if (!editingNodeId || !editingNodeName.trim()) {
      // If empty, revert to original name or handle error
      const originalNode = findNodeById(treeData, editingNodeId);
      if (originalNode) {
        setEditingNodeName(originalNode.name); // Revert to original name if empty
      }
      setEditingNodeId(null);
      return;
    }

    setTreeData(prevTreeData => {
      const newTreeData = JSON.parse(JSON.stringify(prevTreeData)); // Deep copy
      const nodeToEdit = findNodeById(newTreeData, editingNodeId);
      if (nodeToEdit) {
        nodeToEdit.name = editingNodeName.trim();
      }
      saveStateToHistory(newTreeData); // Save this state to history
      return newTreeData;
    });
    setEditingNodeId(null);
    setEditingNodeName('');
  }, [editingNodeId, editingNodeName, treeData, findNodeById, saveStateToHistory]);


  const handleDeleteNode = useCallback(() => {
    if (!selectedNodeIds[0]) {
      setShowContextMenu(false);
      return;
    }

    // Handle deletion of a direct "root" node (child of virtual-root-container)
    if (treeData && treeData.id === "virtual-root-container" && treeData.children.some(child => child.id === selectedNodeIds[0])) {
      if (treeData.children.length === 1) { // If it's the last visible root
        setConfirmMessage("마지막 루트 노드를 삭제하시겠습니까? 모든 트리가 비워집니다.");
        setConfirmAction(() => () => {
          setTreeData(null); // Clear the entire tree
          setSelectedNodeIds([]);
          setShowConfirmModal(false);
          saveStateToHistory(null);
        });
        setShowConfirmModal(true);
      } else {
        setTreeData(prevTreeData => {
          const newTreeData = JSON.parse(JSON.stringify(prevTreeData));
          const virtualRoot = newTreeData; // Should be the virtual-root-container
          virtualRoot.children = virtualRoot.children.filter((child: TreeNode) => child.id !== selectedNodeIds[0]);
          setSelectedNodeIds([]);
          saveStateToHistory(newTreeData);
          return newTreeData;
        });
      }
    } else if (treeData && selectedNodeIds[0] === treeData.id && treeData) { // If it's the very first root (not under virtual container)
      setConfirmMessage("루트 노드를 삭제하시겠습니까? 모든 하위 노드가 삭제됩니다.");
      setConfirmAction(() => () => {
        setTreeData(null); // Clear the entire tree
        setSelectedNodeIds([]);
        setShowConfirmModal(false);
        saveStateToHistory(null);
      });
      setShowConfirmModal(true);
    }
    else { // Regular node deletion
      setTreeData(prevTreeData => {
        const newTreeData = JSON.parse(JSON.stringify(prevTreeData)); // Deep copy
        const { node, parent } = findNodeAndParentById(newTreeData, selectedNodeIds[0]);

        if (parent && node) {
          parent.children = parent.children.filter(child => child.id !== selectedNodeIds[0]);
          setSelectedNodeIds([]); // Deselect the deleted node
        }
        saveStateToHistory(newTreeData); // Save this state to history
        return newTreeData;
      });
    }
    setShowContextMenu(false);
    setShowTooltip(false); // Hide tooltip when deleting
  }, [selectedNodeIds, treeData, findNodeAndParentById, saveStateToHistory]);

  // Undo/Redo functions
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setTreeData(history[newIndex]);
      setHistoryIndex(newIndex);
      setSelectedNodeIds([]); // Clear selection on undo/redo
      setEditingNodeId(null); // Exit editing mode on undo/redo
      setShowContextMenu(false);
      setShowTooltip(false);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setTreeData(history[newIndex]);
      setHistoryIndex(newIndex);
      setSelectedNodeIds([]); // Clear selection on undo/redo
      setEditingNodeId(null); // Exit editing mode on undo/redo
      setShowContextMenu(false);
      setShowTooltip(false);
    }
  }, [history, historyIndex]);

  const clipboardRef = useRef<TreeNode[] | null>(null);
  const pasteLock = useRef(false);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showContextMenu) {
        setShowContextMenu(false);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [showContextMenu]);

  // Find the D3 node data for the currently editing node to position the input
  // currentEditingD3Node will now be a raw D3 node object
  const currentEditingD3Node = editingNodeId ? d3TreeNodesRef.current?.find(d => d && d.data && d.data.id === editingNodeId) : null;

  // Export Dialog 상태
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFileName, setExportFileName] = useState('tree-export.json');

  // Import Dialog 상태
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importedJson, setImportedJson] = useState<any>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export 버튼 클릭 핸들러
  const handleExportClick = () => {
    setShowExportDialog(true);
  };

  // Import 버튼 클릭 핸들러
  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // 실제 Export 실행
  const handleExportConfirm = () => {
    if (!treeData) return;

    // virtual root container를 제외한 실제 트리만 내보내기
    let exportData: TreeNode | TreeNode[] | null = treeData;
    if (treeData.id === "virtual-root-container") {
      // children이 1개면 단일 객체, 2개 이상이면 배열로 내보냄
      if (treeData.children.length === 1) {
        exportData = treeData.children[0];
      } else {
        exportData = treeData.children;
      }
    }

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    saveAs(blob, exportFileName || 'tree-export.json');
    setShowExportDialog(false);
  };

  // 파일 선택 시 처리
  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const parsed = JSON.parse(json);
        setImportedJson(parsed);
        setShowImportDialog(true); // 파일 선택 후 다이얼로그 열기
      } catch (err) {
        setImportError("JSON 파싱 오류: " + (err as Error).message);
        setImportedJson(null);
        setShowImportDialog(true); // 오류가 있어도 다이얼로그 열기
      }
    };
    reader.readAsText(file);
  };

  // 실제 Import 실행
  const handleImportConfirm = () => {
    if (!importedJson) {
      setImportError("파일을 선택하고 올바른 JSON을 업로드하세요.");
      return;
    }
    // 임포트 파일에는 virtual root가 없다고 가정
    let newTree: TreeNode;
    if (Array.isArray(importedJson)) {
      newTree = {
        id: "virtual-root-container",
        name: "",
        children: importedJson,
      };
    } else if (
      importedJson &&
      typeof importedJson === "object" &&
      importedJson.id &&
      importedJson.name &&
      Array.isArray(importedJson.children)
    ) {
      newTree = {
        id: "virtual-root-container",
        name: "",
        children: [importedJson],
      };
    } else {
      setImportError("올바른 트리 JSON 형식이 아닙니다.");
      return;
    }

    setTreeData(newTree);
    setHistory([newTree]);
    setHistoryIndex(0);
    setSelectedNodeIds([]);
    setShowImportDialog(false);
    setImportedJson(null);
    setImportError(null);
  };

  // 노드 클릭 시
  const handleNodeClick = (nodeId: string, event?: React.MouseEvent | KeyboardEvent) => {
    setSelectedNodeIds([nodeId]);
  };

  // 선택된 노드만 구조 유지 복사
  function filterSelectedSubtree(node: TreeNode, selectedIds: string[]): TreeNode | null {
    if (!selectedIds.includes(node.id)) return null;
    return {
      ...node,
      children: node.children
        .map(child => filterSelectedSubtree(child, selectedIds))
        .filter(Boolean) as TreeNode[],
    };
  }

  useTreeCommands({
    showConfirmModal,
    editingInputRef,
    editingNodeId,
    handleFinishEditing,
    setEditingNodeId,
    setEditingNodeName,
    handleUndo,
    handleRedo,
    selectedNodeIds,
    treeData,
    clipboardRef,
    filterSelectedSubtree,
    findNodeById,
    setTreeData,
    saveStateToHistory,
    pasteLock,
    d3TreeNodesRef,
    handleAddNode,
    handleEditNode,
    handleDeleteNode,
    setSelectedNodeIds,
  });

  // ESC 키로 선택 해제
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedNodeIds([]);
        setSelectedLink(null);
        setEditingNodeId(null);
        setShowContextMenu(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col h-screen w-[80vw] font-inter bg-gray-100 p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-center text-indigo-700">인터랙티브 트리 컴포넌트</h1>
        <div className="flex gap-2">
          {/* 숨겨진 파일 input (항상 1개만, 다이얼로그 밖에 둡니다) */}
          <input
            type="file"
            accept="application/json"
            ref={fileInputRef}
            onChange={handleImportFileChange}
            style={{ display: 'none' }}
          />

          <button
            className="px-4 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
            onClick={handleImportClick}
            type="button"
          >
            Import
          </button>
          <button
            className="px-4 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
            onClick={handleExportClick}
            type="button"
          >
            Export
          </button>
        </div>
      </div>

      {/* Selected Node Display */}
      {selectedNodeIds.length > 0 && (
        <div className="text-center mb-4 text-gray-700">
          선택된 노드 ID: <span className="font-semibold text-indigo-600">{selectedNodeIds.join(', ')}</span>
          <br />
          선택된 노드 이름: <span className="font-semibold text-indigo-600">{selectedNodeIds.map(id => findNodeById(treeData, id)?.name).join(', ') || 'N/A'}</span>
        </div>
      )}
      {selectedNodeIds.length === 0 && treeData && (
        <div className="text-center mb-4 text-gray-500">
          노드를 선택해주세요. (마우스 오른쪽 클릭으로 메뉴를 열 수 있습니다)
        </div>
      )}
      {!treeData || (treeData.id === "virtual-root-container" && (!treeData.children || treeData.children.length === 0)) ? (
        <div className="text-center mb-4 text-gray-500">
          트리 데이터가 없습니다. 마우스 오른쪽 클릭으로 루트 노드를 추가해주세요.
        </div>
      ) : null}

      {/* Tree Visualization Area */}
      <div ref={containerRef} className="flex-grow bg-white rounded-lg shadow-lg overflow-auto border border-gray-200 relative">
        <svg
          ref={svgRef}
          className="block w-full h-full"
          onContextMenu={handleSvgContextMenu}
          onClick={handleSvgBackgroundClick} // 추가
        ></svg>

        {/* Inline Edit Input Field */}
        {editingNodeId && currentEditingD3Node && (
          <input
            ref={editingInputRef}
            type="text"
            value={editingNodeName}
            onChange={(e) => setEditingNodeName(e.target.value)}
            onBlur={handleFinishEditing}
            onKeyDown={(e) => { // <-- 여기만 변경!
              if (e.key === 'Enter') {
                handleFinishEditing();
              }
            }}
            className="absolute p-1 border border-indigo-400 rounded-md bg-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-md"
            style={{
              left: currentEditingD3Node.y + margin.left - minYOffset + 13,
              top: currentEditingD3Node.x + margin.top - 10,
              width: 'auto',
              minWidth: '80px',
              maxWidth: '200px'
            }}
            autoFocus
          />
        )}
      </div>

      {/* Custom Tooltip */}
      {showTooltip && (
        <div
          className="absolute bg-gray-800 text-white text-xs px-2 py-1 rounded-md shadow-lg pointer-events-none z-50"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            whiteSpace: 'nowrap' // Prevent text wrapping
          }}
        >
          {tooltipContent}
        </div>
      )}

      {/* Context Menu */}
      {showContextMenu && (
        <div
          className="absolute bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50"
          style={{ top: contextMenuPosition.y, left: contextMenuPosition.x }}
          onClick={() => setShowContextMenu(false)}
        >
          {contextMenuType === 'node' && selectedNodeIds.length > 0 && (<>
            <button
              className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-indigo-100"
              onClick={() => handleAddNode('child')}
            >
              자식 노드 추가 (Insert)
            </button>
            {treeData && treeData.id === "virtual-root-container" && treeData.children.some(child => child.id === selectedNodeIds[0]) ? (
              // If selected node is a direct "root" (child of virtual-root-container)
              <button
                className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-indigo-100"
                onClick={() => handleAddNode('root')} // Add another root
              >
                루트 노드 추가 (Shift + Insert)
              </button>
            ) : (
              // If selected node is a regular node (not a direct "root")
              <button
                className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-indigo-100"
                onClick={() => handleAddNode('sibling')}
              >
                형제 노드 추가 (Ctrl+Enter)
              </button>
            )}
            <button
              className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-indigo-100"
              onClick={() => handleAddNode('parent')}
            >
              부모 노드 추가 (Shift + Insert)
            </button>
            <button
              className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-indigo-100"
              onClick={handleEditNode}
            >
              노드 수정 (F2)
            </button>
            <button
              className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-indigo-100"
              onClick={handleDeleteNode}
            >
              노드 삭제 (Delete)
            </button>
          </>
          )}
          {contextMenuType === 'link' && selectedLink && (
            <div className="px-4 py-2 text-gray-700">
              <div>선택된 선</div>
              <div className="text-xs text-gray-500">
                {selectedLink.sourceId} → {selectedLink.targetId}
              </div>
            </div>
          )}
          {contextMenuType === 'background' && ( // Always show "루트 노드 추가" on background click
            <button
              className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-indigo-100"
              onClick={() => handleAddNode('root')} // Call handleAddNode with 'root' type
            >
              루트 노드 추가 (Shift + Insert)
            </button>
          )}
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <h2 className="text-xl font-bold mb-4 text-indigo-700">확인</h2>
            <p className="mb-4 text-gray-700">{confirmMessage}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition duration-150 ease-in-out"
              >
                취소
              </button>
              <button
                onClick={() => {
                  if (confirmAction) confirmAction();
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-150 ease-in-out"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Dialog */}
      {showExportDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <h2 className="text-xl font-bold mb-4 text-indigo-700">Export Tree JSON</h2>
            <label className="block mb-2 text-gray-700">
              파일 이름:
              <input
                type="text"
                value={exportFileName}
                onChange={e => setExportFileName(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded px-2 py-1"
                placeholder="tree-export.json"
              />
            </label>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowExportDialog(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition"
              >
                취소
              </button>
              <button
                onClick={handleExportConfirm}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
              >
                내보내기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <h2 className="text-xl font-bold mb-4 text-indigo-700">Import Tree JSON</h2>
            {/* 파일 input은 여기서 삭제 */}
            {importError && (
              <div className="text-red-600 text-sm mb-2">{importError}</div>
            )}
            {importedJson && (
              <div className="bg-gray-100 border rounded p-2 text-xs max-h-32 overflow-auto mb-2">
                <pre>{JSON.stringify(importedJson, null, 2)}</pre>
              </div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowImportDialog(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition"
              >
                취소
              </button>
              <button
                onClick={handleImportConfirm}
                disabled={!importedJson}
                className={`px-4 py-2 rounded-md transition text-gray-500 ${importedJson ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-400 cursor-not-allowed'}`}
              >
                Tree에 반영하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TreeComp;
