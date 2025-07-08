import { useEffect } from "react";

export function useTreeCommands({
  showConfirmModal,
  editingInputRef,
  editingNodeId,
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
}: any) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (showConfirmModal) return;

      const isInlineEditing =
        editingInputRef.current === document.activeElement;

      // 인라인 편집 중
      if (isInlineEditing) {
        if (event.key === "Enter") {
          setEditingNodeId(null);
          setEditingNodeName("");
          event.preventDefault();
        } else if (event.key === "Escape") {
          setEditingNodeId(null);
          setEditingNodeName("");
          event.preventDefault();
        }
        return;
      }

      // 다른 input에 포커스가 있으면 무시
      if (
        document.activeElement &&
        ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)
      ) {
        return;
      }

      // Undo/Redo
      if (event.ctrlKey && event.key.toLowerCase() === "z") {
        event.preventDefault();
        handleUndo();
        return;
      }
      if (event.ctrlKey && event.key.toLowerCase() === "y") {
        event.preventDefault();
        handleRedo();
        return;
      }

      // 편집 중이면, 편집 종료 후 키 재전달
      const actionKeys = [
        "F2",
        "Delete",
        "ArrowRight",
        "ArrowLeft",
        "ArrowUp",
        "ArrowDown",
        "Insert",
        "Enter",
      ];
      if (editingNodeId && actionKeys.includes(event.key)) {
        setEditingNodeId(null);
        setEditingNodeName("");
        event.preventDefault();
        const newEvent = new KeyboardEvent("keydown", {
          key: event.key,
          code: event.code,
          keyCode: event.keyCode,
          shiftKey: event.shiftKey,
          altKey: event.altKey,
          ctrlKey: event.ctrlKey,
          metaKey: event.metaKey,
          bubbles: true,
          cancelable: true,
        });
        setTimeout(() => window.dispatchEvent(newEvent), 0);
        return;
      }

      // Ctrl+C: 복사
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "c" &&
        selectedNodeIds.length > 0
      ) {
        event.preventDefault();
        clipboardRef.current = selectedNodeIds
          .map((id: string) => {
            const node = findNodeById(treeData, id);
            return node ? filterSelectedSubtree(node, selectedNodeIds) : null;
          })
          .filter(Boolean);
        return;
      }

      // Ctrl+V: 붙여넣기
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "v" &&
        selectedNodeIds.length === 1
      ) {
        if (pasteLock.current) return;
        pasteLock.current = true;
        setTimeout(() => {
          pasteLock.current = false;
        }, 200);
        event.preventDefault();

        // 1. 트리 노드 붙여넣기
        if (clipboardRef.current && Array.isArray(clipboardRef.current)) {
          let pastedTree: any = null;
          const copiedNodes = clipboardRef.current.map((node: any) =>
            JSON.parse(JSON.stringify(node))
          );
          setTreeData((prevTreeData: any) => {
            if (!prevTreeData) return prevTreeData;
            const newTreeData = JSON.parse(JSON.stringify(prevTreeData));
            const targetNode = findNodeById(newTreeData, selectedNodeIds[0]);
            if (targetNode) {
              const cloneWithNewIds = (node: any): any => ({
                ...node,
                id:
                  "node-" +
                  Date.now() +
                  "-" +
                  Math.random().toString(36).substr(2, 9),
                children: node.children.map(cloneWithNewIds),
              });
              targetNode.children = targetNode.children || [];
              copiedNodes.forEach((copiedNode: any) => {
                targetNode.children.push(cloneWithNewIds(copiedNode));
              });
            }
            pastedTree = newTreeData;
            return newTreeData;
          });
          setTimeout(() => {
            if (pastedTree) saveStateToHistory(pastedTree);
          }, 0);
          return;
        }

        // 2. 텍스트 붙여넣기
        if (navigator.clipboard) {
          navigator.clipboard.readText().then((text) => {
            if (!text.trim()) return;
            const lines = text
              .split(/\r?\n/)
              .filter((line) => line.trim().length > 0);
            const parsedLines = lines.map((rawLine) => {
              const match = rawLine.match(/^(\t*)/);
              const level = match ? match[1].length : 0;
              return {
                level,
                name: rawLine.replace(/^\t+/, "").trim(),
              };
            });

            let pastedTree: any = null;
            setTreeData((prevTreeData: any) => {
              if (!prevTreeData) return prevTreeData;
              const newTreeData = JSON.parse(JSON.stringify(prevTreeData));
              const targetNode = findNodeById(newTreeData, selectedNodeIds[0]);
              if (targetNode) {
                targetNode.children = targetNode.children || [];
                const nodeStack: any[] = [{ node: targetNode, level: -1 }];
                parsedLines.forEach(({ level, name }) => {
                  if (!name) return;
                  if (level > 0 && nodeStack.length === 1) return;
                  while (
                    nodeStack.length > 0 &&
                    nodeStack[nodeStack.length - 1].level >= level
                  ) {
                    nodeStack.pop();
                  }
                  const parent = nodeStack[nodeStack.length - 1].node;
                  const newNode = {
                    id:
                      "node-" +
                      Date.now() +
                      "-" +
                      Math.random().toString(36).substr(2, 9),
                    name,
                    children: [],
                  };
                  parent.children.push(newNode);
                  nodeStack.push({ node: newNode, level });
                });
              }
              pastedTree = newTreeData;
              setTimeout(() => {
                saveStateToHistory(newTreeData);
              }, 0);
              return newTreeData;
            });
            // setTimeout(() => {
            //   if (pastedTree) saveStateToHistory(pastedTree);
            // }, 0);
          });
          return;
        }
      }

      // 트리 네비게이션 및 노드 조작
      const d3Nodes = d3TreeNodesRef.current;
      if (
        !treeData ||
        (treeData.id === "virtual-root-container" &&
          (!d3Nodes ||
            d3Nodes.filter((d: any) => d.data.id !== "virtual-root-container")
              .length === 0))
      ) {
        if (event.key === "Insert" && event.shiftKey) {
          handleAddNode("root");
          event.preventDefault();
        }
        return;
      }
      if (!d3Nodes) return;

      const currentD3Node = d3Nodes.find(
        (d: any) => d && d.data && d.data.id === selectedNodeIds[0]
      );

      switch (event.key) {
        case "Insert":
          if (event.shiftKey) {
            handleAddNode("root");
            event.preventDefault(); // 반드시 추가!
          } else {
            handleAddNode("child");
            event.preventDefault();
          }
          break;
        case "Enter":
          if (event.ctrlKey) {
            if (selectedNodeIds[0]) {
              if (
                treeData.id === "virtual-root-container" &&
                treeData.children.some(
                  (child: any) => child.id === selectedNodeIds[0]
                )
              ) {
                handleAddNode("root");
                event.preventDefault();
              } else {
                handleAddNode("sibling");
                event.preventDefault();
              }
            }
            event.preventDefault();
          }
          break;
        case "F2":
          event.preventDefault();
          if (selectedNodeIds[0]) handleEditNode();
          break;
        case "Delete":
          if (selectedNodeIds[0]) {
            // 삭제 후 선택 이동
            const currentId = selectedNodeIds[0];
            const currentNode = findNodeById(treeData, currentId);
            let nextSelectedId: string | null = null;
            if (currentNode) {
              const findNodeAndParent = (
                node: any,
                id: string,
                parent: any = null
              ): any => {
                if (!node) return null;
                if (node.id === id) return { node, parent };
                if (node.children) {
                  for (const child of node.children) {
                    const found = findNodeAndParent(child, id, node);
                    if (found) return found;
                  }
                }
                return null;
              };
              const result = findNodeAndParent(treeData, currentId);
              if (result && result.parent) {
                const siblings = result.parent.children;
                const idx = siblings.findIndex((n: any) => n.id === currentId);
                if (siblings.length > 1) {
                  if (idx < siblings.length - 1)
                    nextSelectedId = siblings[idx + 1].id;
                  else if (idx > 0) nextSelectedId = siblings[idx - 1].id;
                } else {
                  nextSelectedId =
                    result.parent.id !== "virtual-root-container"
                      ? result.parent.id
                      : null;
                }
              }
            }
            handleDeleteNode();
            setTimeout(() => {
              if (nextSelectedId) setSelectedNodeIds([nextSelectedId]);
              else setSelectedNodeIds([]);
            }, 0);
          }
          break;
        case "ArrowRight":
          if (
            currentD3Node &&
            currentD3Node.children &&
            currentD3Node.children.length > 0
          ) {
            setSelectedNodeIds([currentD3Node.children[0].data.id]);
            event.preventDefault();
          }
          break;
        case "ArrowLeft":
          if (
            currentD3Node &&
            currentD3Node.parent &&
            currentD3Node.parent.data.id !== "virtual-root-container"
          ) {
            setSelectedNodeIds([currentD3Node.parent.data.id]);
            event.preventDefault();
          }
          break;
        case "ArrowUp":
        case "ArrowDown":
          if (currentD3Node) {
            const d3NodesAtSameDepth = d3Nodes.filter(
              (d: any) =>
                d.depth === currentD3Node.depth &&
                d.data.id !== "virtual-root-container"
            );
            d3NodesAtSameDepth.sort((a: any, b: any) => a.x - b.x);
            const currentIndex = d3NodesAtSameDepth.findIndex(
              (d: any) => d.data.id === selectedNodeIds[0]
            );
            let nextId: string | undefined;
            if (event.key === "ArrowUp" && currentIndex > 0) {
              nextId = d3NodesAtSameDepth[currentIndex - 1].data.id;
            } else if (
              event.key === "ArrowDown" &&
              currentIndex < d3NodesAtSameDepth.length - 1
            ) {
              nextId = d3NodesAtSameDepth[currentIndex + 1].data.id;
            }
            if (nextId) {
              setSelectedNodeIds([nextId]);
              event.preventDefault();
            }
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    showConfirmModal,
    editingInputRef,
    editingNodeId,
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
  ]);
}
