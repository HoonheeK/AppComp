import { saveAs } from 'file-saver';
import { useState, useEffect, useRef } from 'react';
import type { ChangeEvent } from 'react';

// JSON 노드 구조를 위한 인터페이스 정의
interface Node {
  id: string;
  name: string;
  children: Node[];
}

// 메인 App 컴포넌트
const JsonToText = () => {
  // JSON 입력 텍스트 상태
  const [jsonInput, setJsonInput] = useState<string>('');
  // 이름 값만 추출된 텍스트 상태
  const [nameOutput, setNameOutput] = useState<string>('');
  // 에러 메시지 상태
  const [error, setError] = useState<string>('');
  const [exportFileName, setExportFileName] = useState('export.json');

  // JSON 파일 출력 함수
  const handleExportJson = () => {
    try {
      const jsonStr = JSON.stringify(JSON.parse(jsonInput), null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      saveAs(blob, exportFileName || 'export.json');
    } catch (e) {
      setError('유효한 JSON만 파일로 저장할 수 있습니다.');
    }
  };

  // JSON -> 이름 텍스트 변환 함수
  const convertJsonToNames = (): void => {
    setError(''); // 에러 초기화
    if (!jsonInput.trim()) {
      setNameOutput('');
      return;
    }
    try {
      // JSON.parse의 결과가 Node 타입임을 명시
      const parsedJson: Node = JSON.parse(jsonInput) as Node;
      const names: string[] = [];

      // 재귀 함수를 사용하여 모든 'name' 값을 추출
      // level 매개변수를 추가하여 들여쓰기 수준을 추적합니다.
      const extractNames = (node: Node, level: number = 0): void => {
        if (node.name) {
          // 현재 레벨에 따라 탭 문자를 추가하여 들여쓰기
          names.push('\t'.repeat(level) + node.name);
        }
        if (node.children && Array.isArray(node.children)) {
          // 자식 노드를 재귀적으로 호출할 때 레벨을 1 증가시킵니다.
          node.children.forEach((child: Node) => extractNames(child, level + 1));
        }
      };

      extractNames(parsedJson);
      setNameOutput(names.join('\n')); // 각 이름을 새 줄로 구분하여 표시
    } catch (e: any) { // 에러 객체 타입 명시
      setError('유효하지 않은 JSON 형식입니다.');
      setNameOutput('');
      console.error("JSON 파싱 에러:", e);
    }
  };

  // 이름 텍스트 -> JSON 변환 함수
  // 이 변환은 원본 JSON의 'id'와 'children' 구조를 알 수 없으므로,
  // 'name' 값만을 기반으로 새로운 계층 구조를 추정하여 생성합니다.
  // 이 예시에서는 간단하게 각 줄을 최상위 노드의 'name'으로 가정하여 JSON을 생성합니다.
  // 실제 복잡한 계층 구조를 텍스트에서 JSON으로 정확히 복원하려면 추가적인 규칙이나 정보가 필요합니다.
  const convertNamesToJson = (): void => {
    setError(''); // 에러 초기화
    if (!nameOutput.trim()) {
      setJsonInput('');
      return;
    }
    try {
      const lines: string[] = nameOutput.split('\n').filter((line: string) => line.trim() !== '');
      if (lines.length === 0) {
        setJsonInput('');
        return;
      }

      let reconstructedJson: Node;
      const rootName: string = lines[0].trim(); // 첫 번째 줄을 Root 노드로 가정

      reconstructedJson = {
        id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: rootName,
        children: []
      };

      // 스택을 사용하여 계층 구조를 재구성합니다.
      // 각 요소는 { node: 현재 노드 객체, level: 현재 노드의 들여쓰기 레벨 } 형태입니다.
      const stack: { node: Node; level: number }[] = [{ node: reconstructedJson, level: 0 }];

      for (let i: number = 1; i < lines.length; i++) {
        const line: string = lines[i];
        const currentLevel: number = line.match(/^\t*/)?.[0].length || 0; // 탭 개수로 들여쓰기 레벨 파악
        const name: string = line.trim();

        const newNode: Node = {
          id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          name: name,
          children: []
        };

        // 현재 레벨에 맞춰 스택에서 부모 노드를 찾습니다.
        while (stack.length > 1 && currentLevel <= stack[stack.length - 1].level) {
          stack.pop(); // 현재 레벨보다 같거나 높은 레벨의 노드는 스택에서 제거
        }

        if (stack.length > 0) {
          stack[stack.length - 1].node.children.push(newNode);
        } else {
          // 스택이 비어있다면, 이는 새로운 최상위 노드입니다.
          // 이 예시에서는 단일 루트를 가정하므로, 이 경우는 발생하지 않아야 합니다.
          // 복잡한 다중 루트 시나리오를 처리하려면 이 로직을 확장해야 합니다.
          console.warn("Unexpected: Stack is empty, creating a new root. This might not reflect the intended structure.");
          reconstructedJson = newNode; // 새로운 루트로 설정 (이 경우 기존 reconstructedJson은 버려짐)
          stack.push({ node: reconstructedJson, level: currentLevel });
        }
        stack.push({ node: newNode, level: currentLevel }); // 새 노드를 스택에 추가
      }

      setJsonInput(JSON.stringify(reconstructedJson, null, 2)); // 보기 좋게 포맷팅
    } catch (e: any) { // 에러 객체 타입 명시
      setError('이름 텍스트를 JSON으로 변환하는 데 실패했습니다.');
      setJsonInput('');
      console.error("이름 텍스트 -> JSON 변환 에러:", e);
    }
  };

  // 초기 JSON 데이터 설정
  useEffect(() => {
    const initialJson: Node = {
      "id": "node-1751765359360-b9oxquce3",
      "name": "Root",
      "children": [
        {
          "id": "node-1751765359360-f1z35izr1",
          "name": "Child 1",
          "children": [
            {
              "id": "node-1751765359360-u026cacsk",
              "name": "Grandchild 1",
              "children": []
            },
            {
              "id": "node-1751765359360-fbhs3k7io",
              "name": "Grandchild 2",
              "children": []
            }
          ]
        },
        {
          "id": "node-1751765359360-s0m1m6kzb",
          "name": "Child 2",
          "children": []
        }
      ]
    };
    setJsonInput(JSON.stringify(initialJson, null, 2));
  }, []);

  return (
    <div className="flex-1 min-h-screen bg-gray-100 flex items-top justify-center p-4 font-inter w-[80vw]">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full ">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">JSON Name Extractor</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">에러: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <div className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6">
          {/* JSON 입력 섹션 */}
          <div className="flex flex-col w-[40vw]">
            <div className="flex flex-row items-center mt-2 gap-2">
              <label htmlFor="json-input" className="block text-gray-700 text-sm font-bold mb-2">
                JSON 입력:
              </label>
              <input
                type="text"
                className="border rounded px-2 py-1 text-sm w-48 "
                value={exportFileName}
                onChange={e => setExportFileName(e.target.value)}
                placeholder="파일명을 입력하세요 (예: export.json)"
              />
              <button
                onClick={handleExportJson}
                className="flex bg-indigo-500 hover:bg-indigo-700 text-gray-700 font-bold py-1 px-4 rounded transition"
                title="JSON 파일로 저장"
              >
                JSON 파일 출력
              </button>
            </div>
            <textarea
              id="json-input"
              className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 h-64 md:h-96 resize-y"
              placeholder="여기에 JSON을 입력하세요..."
              value={jsonInput}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setJsonInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Tab') {
                  e.preventDefault();
                  const { selectionStart, selectionEnd } = e.currentTarget;
                  setJsonInput(
                    jsonInput.substring(0, selectionStart) + '\t' + jsonInput.substring(selectionEnd)
                  );
                  // 커서 위치 조정은 필요시 useRef로 처리
                  setTimeout(() => {
                    const textarea = e.currentTarget;
                    textarea.selectionStart = textarea.selectionEnd = selectionStart + 1;
                  }, 0);
                }
              }}
            ></textarea>
          </div>

          {/* 변환 버튼 섹션 */}
          <div className="flex flex-col items-center justify-center space-y-4 md:space-y-5 md:space-x-4">
            <button
              onClick={convertJsonToNames}
              className=" bg-blue-500 hover:bg-blue-700 text-green-500 font-bold py-3 px-6 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 w-16"
            >
              &rarr;
            </button>
            <button
              onClick={convertNamesToJson}
              className="bg-green-500 hover:bg-green-700 text-red-500 font-bold py-3 px-6 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 w-16"
            >
              &larr;
            </button>
          </div>

          {/* 이름 출력 섹션 */}
          <div className="flex w-[40vw] flex-col">
            <label htmlFor="name-output" className="block text-gray-700 text-sm font-bold mb-2">
              Name 값만 추출:
            </label>
            <textarea
              id="name-output"
              className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500 h-64 md:h-96 resize-y"
              placeholder="추출된 name 값들이 여기에 표시됩니다..."
              value={nameOutput}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNameOutput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Tab') {
                  e.preventDefault();
                  const { selectionStart, selectionEnd } = e.currentTarget;
                  setNameOutput(
                    nameOutput.substring(0, selectionStart) + '\t' + nameOutput.substring(selectionEnd)
                  );
                  // 커서 위치 조정은 필요시 useRef로 처리
                  setTimeout(() => {
                    const textarea = e.currentTarget;
                    textarea.selectionStart = textarea.selectionEnd = selectionStart + 1;
                  }, 0);
                }
              }}
            ></textarea>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JsonToText;
