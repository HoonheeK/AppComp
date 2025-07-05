import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { RefObject } from 'react';
import * as d3 from 'd3';
import {useImmer} from 'use-immer';

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
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

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
      .attr("class", "link")
      .attr("d", d3.linkHorizontal<d3.HierarchyPointLink<TreeNode>, d3.HierarchyPointNode<TreeNode>>()
        .x(d => d.y)
        .y(d => d.x))
      .attr("fill", "none")
      .attr("stroke", "#ccc")
      .attr("stroke-width", 1.5);

    const node = g.selectAll<SVGGElement, D3Node>(".node")
      .data(treeNodes.descendants().filter(d => d.data.id !== "virtual-root-container"))
      .enter().append("g")
      .attr("class", d => `node ${d.children ? "node--internal" : "node--leaf"}`)
      .attr("transform", d => `translate(${d.y},${d.x})`)
      .on("click", (event, d: D3Node) => {
        setSelectedNodeId(d.data.id);
        setEditingNodeId(null);
        setShowContextMenu(false);
      })
      .on("contextmenu", (event, d: D3Node) => {
        event.preventDefault();
        setSelectedNodeId(d.data.id);
        setEditingNodeId(null);
        setContextMenuType('node');
        setContextMenuPosition({ x: event.pageX, y: event.pageY });
        setShowContextMenu(true);
      })
      .on("mouseover", (event, d: D3Node) => {
        setShowTooltip(true);
        setTooltipContent(d.data.name);
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
      .attr("r", 10)
      .attr("fill", d => d.data.id === selectedNodeId ? "#6366f1" : "#fff")
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

  }, [treeData, selectedNodeId, dimensions, editingNodeId]);

  // Handle right-click on SVG background
  const handleSvgContextMenu = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    event.preventDefault(); // Prevent default browser context menu
    setSelectedNodeId(null); // Deselect any node
    setEditingNodeId(null); // Exit inline editing mode
    setContextMenuType('background');
    // Context menu position should be relative to the viewport
    setContextMenuPosition({ x: event.pageX, y: event.pageY });
    setShowContextMenu(true);
    setShowTooltip(false); // Hide tooltip when context menu appears
  }, []);

  // Handlers for node operations
  const handleAddNode = useCallback((type: string) => {
    setShowContextMenu(false);
    setShowTooltip(false);

    const newNode = { id: generateId(), name: 'Node', children: [] };

    let finalTreeData: TreeData = null;

    setTreeData(prevTreeData => {
      let newTreeData = JSON.parse(JSON.stringify(prevTreeData)); // Deep copy

      if (type === 'child') {
        if (!selectedNodeId || !newTreeData) return prevTreeData;
        const selectedNode = findNodeById(newTreeData, selectedNodeId);
        if (selectedNode) {
          selectedNode.children = selectedNode.children || [];
          selectedNode.children.push(newNode);
        }
      } else if (type === 'sibling') {
        if (!selectedNodeId || !newTreeData) return prevTreeData;
        const { node, parent } = findNodeAndParentById(newTreeData, selectedNodeId);
        if (parent) {
          parent.children.push(newNode);
        } else if (node && node.id === newTreeData.id) {
          // If selected is a direct child of the virtual root, treat adding sibling as adding another root
          if (newTreeData.id === "virtual-root-container" && newTreeData.children.some((child: TreeNode) => child.id === selectedNodeId)) {
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
          const { node, parent } = findNodeAndParentById(newTreeData, selectedNodeId);

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
          } else if (!selectedNodeId && newTreeData.id !== "virtual-root-container") {
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
            setSelectedNodeId(newNode.id);
            setEditingNodeId(newNode.id);
            setEditingNodeName(newNode.name);
            focusAndSelectInput();
        }
    }, 0);


  }, [selectedNodeId, treeData, findNodeById, findNodeAndParentById, focusAndSelectInput, saveStateToHistory]);

  const handleEditNode = useCallback(() => {
    if (!selectedNodeId) {
      setShowContextMenu(false);
      return;
    }
    const nodeToEdit = findNodeById(treeData, selectedNodeId);
    if (nodeToEdit) {
      setEditingNodeId(selectedNodeId);
      setEditingNodeName(nodeToEdit.name);
      focusAndSelectInput();
    }
    setShowContextMenu(false);
    setShowTooltip(false); // Hide tooltip when editing
  }, [selectedNodeId, treeData, findNodeById, focusAndSelectInput]);

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
    if (!selectedNodeId) {
      setShowContextMenu(false);
      return;
    }

    // Handle deletion of a direct "root" node (child of virtual-root-container)
    if (treeData && treeData.id === "virtual-root-container" && treeData.children.some(child => child.id === selectedNodeId)) {
        if (treeData.children.length === 1) { // If it's the last visible root
            setConfirmMessage("마지막 루트 노드를 삭제하시겠습니까? 모든 트리가 비워집니다.");
            setConfirmAction(() => () => {
                setTreeData(null); // Clear the entire tree
                setSelectedNodeId(null);
                setShowConfirmModal(false);
                saveStateToHistory(null);
            });
            setShowConfirmModal(true);
        } else {
            setTreeData(prevTreeData => {
                const newTreeData = JSON.parse(JSON.stringify(prevTreeData));
                const virtualRoot = newTreeData; // Should be the virtual-root-container
                virtualRoot.children = virtualRoot.children.filter((child: TreeNode) => child.id !== selectedNodeId);
                setSelectedNodeId(null);
                saveStateToHistory(newTreeData);
                return newTreeData;
            });
        }
    } else if (treeData && selectedNodeId === treeData.id && treeData) { // If it's the very first root (not under virtual container)
        setConfirmMessage("루트 노드를 삭제하시겠습니까? 모든 하위 노드가 삭제됩니다.");
        setConfirmAction(() => () => {
            setTreeData(null); // Clear the entire tree
            setSelectedNodeId(null);
            setShowConfirmModal(false);
            saveStateToHistory(null);
        });
        setShowConfirmModal(true);
    }
    else { // Regular node deletion
      setTreeData(prevTreeData => {
        const newTreeData = JSON.parse(JSON.stringify(prevTreeData)); // Deep copy
        const { node, parent } = findNodeAndParentById(newTreeData, selectedNodeId);

        if (parent && node) {
          parent.children = parent.children.filter(child => child.id !== selectedNodeId);
          setSelectedNodeId(null); // Deselect the deleted node
        }
        saveStateToHistory(newTreeData); // Save this state to history
        return newTreeData;
      });
    }
    setShowContextMenu(false);
    setShowTooltip(false); // Hide tooltip when deleting
  }, [selectedNodeId, treeData, findNodeAndParentById, saveStateToHistory]);

  // Undo/Redo functions
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setTreeData(history[newIndex]);
      setHistoryIndex(newIndex);
      setSelectedNodeId(null); // Clear selection on undo/redo
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
      setSelectedNodeId(null); // Clear selection on undo/redo
      setEditingNodeId(null); // Exit editing mode on undo/redo
      setShowContextMenu(false);
      setShowTooltip(false);
    }
  }, [history, historyIndex]);


  // Keyboard Shortcuts and Navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (showConfirmModal) return;

      const isOurInlineInputFocused = editingInputRef.current === document.activeElement;

      // 1. Handle active inline editing (Enter/Escape)
      if (isOurInlineInputFocused) {
        if (event.key === 'Enter') {
          handleFinishEditing();
          event.preventDefault();
          return; // Consume Enter key
        } else if (event.key === 'Escape') {
          setEditingNodeId(null); // Cancel editing
          setEditingNodeName('');
          event.preventDefault();
          return; // Consume Escape key
        }
        // For any other key pressed while inline input is focused,
        // we allow it to propagate (e.g., typing characters), but we don't
        // want it to trigger tree actions like F2 or arrows.
        // So, we return here to prevent those actions while actively typing.
        return;
      }

      // 2. Prevent interference with other input fields
      if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
        return;
      }

      // 3. Handle Undo/Redo
      if (event.ctrlKey && event.key === 'z') {
          event.preventDefault();
          handleUndo();
          return;
      }
      if (event.ctrlKey && event.key === 'y') {
          event.preventDefault();
          handleRedo();
          return;
      }

      // 4. If an edit is pending (editingNodeId is set, but input is NOT focused),
      //    and the pressed key is one of our action keys, finalize the edit first.
      const actionKeys = ['F2', 'Delete', 'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Insert', 'Enter'];
      if (editingNodeId && actionKeys.includes(event.key)) {
          handleFinishEditing(); // Finalize the current edit asynchronously
          // Defer the action until state update is likely processed.
          // This re-dispatches the same key event after a short delay,
          // allowing `editingNodeId` to become `null` in the next render cycle.
          event.preventDefault(); // Prevent default action of this key press
          const newEvent = new KeyboardEvent('keydown', {
              key: event.key,
              code: event.code,
              keyCode: event.keyCode,
              shiftKey: event.shiftKey,
              altKey: event.altKey,
              ctrlKey: event.ctrlKey,
              metaKey: event.metaKey,
              bubbles: true,
              cancelable: true
          });
          setTimeout(() => {
              window.dispatchEvent(newEvent); // Re-dispatch the event
          }, 0);
          return; // Stop current event processing as it's deferred
      }

      // 5. Handle tree navigation and actions (only if no editing is pending or after deferred re-dispatch)
      const d3Nodes = d3TreeNodesRef.current;
      // If tree is empty (only virtual root exists but no children), allow Shift+Insert for first root.
      // Or if treeData is null (completely empty after deleting last root)
      if (
        !treeData ||
        (treeData.id === "virtual-root-container" &&
          (!d3Nodes || d3Nodes.filter(d => d.data.id !== "virtual-root-container").length === 0))
      ) {
        if (event.key === 'Insert' && event.shiftKey) {
          handleAddNode('root');
          event.preventDefault();
        }
        return; // No nodes to navigate if tree is empty
      }

      if (!d3Nodes) return; // <-- null 체크 추가

      const currentD3Node = d3Nodes.find(d => d && d.data && d.data.id === selectedNodeId);

      switch (event.key) {
        case 'Insert': // Add Child or Add Parent
          if (event.shiftKey) { // Shift + Insert for Add Parent
            // If selected, add parent to selected. If no node selected, add root (if tree exists)
            if (selectedNodeId) {
                handleAddNode('parent');
            } else if (treeData) { // If tree exists but no node selected, assume adding another root
                handleAddNode('root');
            }
          } else { // Insert for Add Child
            if (selectedNodeId) {
              handleAddNode('child');
            }
          }
          event.preventDefault();
          break;
        case 'Enter': // Add Sibling or Add another Root
          if (selectedNodeId) {
            // If selected node is a direct child of the virtual root, treat Enter as adding another root
            if (treeData.id === "virtual-root-container" && treeData.children.some(child => child.id === selectedNodeId)) {
              handleAddNode('root'); // Add another root
            } else { // If non-root node is selected
              handleAddNode('sibling'); // Add sibling
            }
          } else if (treeData && treeData.id === "virtual-root-container") {
              // If no node selected but virtual root exists, treat Enter as adding another root
              handleAddNode('root');
          }
          event.preventDefault();
          break;
        case 'F2': // Edit Node
          event.preventDefault(); // Prevent browser default for F2
          if (selectedNodeId) {
            handleEditNode();
          }
          break;
        case 'Delete': // Delete Node
          if (selectedNodeId) {
            handleDeleteNode();
          }
          break;
        case 'ArrowRight': // Move to first child
          if (currentD3Node && currentD3Node.children && currentD3Node.children.length > 0) {
            setSelectedNodeId(currentD3Node.children[0].data.id);
            event.preventDefault(); // Prevent scrolling
          }
          break;
        case 'ArrowLeft': // Move to parent
          if (currentD3Node && currentD3Node.parent && currentD3Node.parent.data.id !== "virtual-root-container") { // Don't select the virtual root
            setSelectedNodeId(currentD3Node.parent.data.id);
            event.preventDefault(); // Prevent scrolling
          }
          break;
        case 'ArrowUp': // Move to previous sibling
          if (currentD3Node && currentD3Node.parent) {
            const siblings = currentD3Node.parent.children;
            if (siblings) { // <-- undefined 체크 추가
              // Filter out the virtual root from siblings if it somehow appears (shouldn't)
              const visibleSiblings = siblings.filter((s: D3Node) => s.data.id !== "virtual-root-container");
              const currentIndex = visibleSiblings.findIndex(s => s.data.id === selectedNodeId);
              if (currentIndex > 0) {
                setSelectedNodeId(visibleSiblings[currentIndex - 1].data.id);
                event.preventDefault(); // Prevent scrolling
              }
            }
          }
          break;
        case 'ArrowDown': // Move to next sibling
          if (currentD3Node && currentD3Node.parent) {
            const siblings = currentD3Node.parent.children;
            if (siblings) { // <-- undefined 체크 추가
              // Filter out the virtual root from siblings if it somehow appears (shouldn't)
              const visibleSiblings = siblings.filter((s: D3Node) => s.data.id !== "virtual-root-container");
              const currentIndex = visibleSiblings.findIndex(s => s.data.id === selectedNodeId);
              if (currentIndex < visibleSiblings.length - 1) {
                setSelectedNodeId(visibleSiblings[currentIndex + 1].data.id);
                event.preventDefault(); // Prevent scrolling
              }
            }
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedNodeId, treeData, handleAddNode, handleEditNode, handleDeleteNode, handleFinishEditing, showConfirmModal, editingNodeId, handleUndo, handleRedo]);


  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showContextMenu) {
        // Check if the click is outside the context menu itself
        // This is a simplified check, a more robust solution might involve ref on context menu
        setShowContextMenu(false);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => {
      window.removeEventListener('click', handleClickOutside);
    };
  }, [showContextMenu]);

  // Find the D3 node data for the currently editing node to position the input
  // currentEditingD3Node will now be a raw D3 node object
  const currentEditingD3Node = editingNodeId ? d3TreeNodesRef.current?.find(d => d && d.data && d.data.id === editingNodeId) : null;

  return (
    <div className="flex flex-col h-screen font-inter bg-gray-100 p-4">
      <h1 className="text-2xl font-bold text-center mb-4 text-indigo-700">인터랙티브 트리 컴포넌트</h1>

      {/* Selected Node Display */}
      {selectedNodeId && (
        <div className="text-center mb-4 text-gray-700">
          선택된 노드 ID: <span className="font-semibold text-indigo-600">{selectedNodeId}</span>
          <br/>
          선택된 노드 이름: <span className="font-semibold text-indigo-600">{findNodeById(treeData, selectedNodeId)?.name || 'N/A'}</span>
        </div>
      )}
      {!selectedNodeId && treeData && (
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
      <div ref={containerRef} className="flex-grow bg-white rounded-lg shadow-lg overflow-auto border border-gray-200 relative"> {/* Added relative for absolute positioning of input */}
        <svg ref={svgRef} className="block w-full h-full" onContextMenu={handleSvgContextMenu}></svg>

        {/* Inline Edit Input Field */}
        {editingNodeId && currentEditingD3Node && (
          <input
            ref={editingInputRef}
            type="text"
            value={editingNodeName}
            onChange={(e) => setEditingNodeName(e.target.value)}
            onBlur={handleFinishEditing}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleFinishEditing();
              }
            }}
            className="absolute p-1 border border-indigo-400 rounded-md bg-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-md"
            style={{
              left: currentEditingD3Node.y + margin.left - minYOffset + 13, // Adjusted with minYOffset
              top: currentEditingD3Node.x + margin.top - 10, // Adjust y to vertically align with text
              width: 'auto',
              minWidth: '80px',
              maxWidth: '200px' // Prevent excessively wide input
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
          onClick={() => setShowContextMenu(false)} // Close menu on item click
        >
          {contextMenuType === 'node' && selectedNodeId && (
            <>
              <button
                className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-indigo-100"
                onClick={() => handleAddNode('child')}
              >
                자식 노드 추가 (Insert)
              </button>
              {treeData &&treeData.id === "virtual-root-container" && treeData.children.some(child => child.id === selectedNodeId) ? (
                // If selected node is a direct "root" (child of virtual-root-container)
                <button
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-indigo-100"
                  onClick={() => handleAddNode('root')} // Add another root
                >
                  루트 노드 추가 (Enter)
                </button>
              ) : (
                // If selected node is a regular node (not a direct "root")
                <button
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-indigo-100"
                  onClick={() => handleAddNode('sibling')}
                >
                  형제 노드 추가 (Enter)
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
    </div>
  );
}

export default TreeComp;
