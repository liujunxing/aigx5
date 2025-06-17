import { useEffect, useRef, memo, useMemo } from "react";
import type { Board } from "jsxgraph";
import { useSketchpadStore } from "@renderer/store/SketchpadProvider";

declare const JXG: any;  // JGX 是全局变量

export function _JXGraph() {
  // console.info(`_JXGraph render() ...`);
  const { setBoard } = useSketchpadStore();
  const refContainer = useRef<HTMLDivElement>(null);   // 容器
  const didRun = useRef(false);
  const refBoard = useRef<Board | null>(null);   // 画板

  useEffect(() => {
    if (!refContainer.current) return;

    // 这里可能被调用两次 (strict-app 模式下)
    if (didRun.current) return;
    didRun.current = true;
    // console.info(`jxg container:`, refContainer.current);
    console.info(`JXGraph create-board effect ...`);   // 理论上只应执行一次.

    const board: Board = JXG.JSXGraph.initBoard('jgx_container', {
      originX: 300, originY: 300, 
      grid: true, 
      unitX: 15, unitY: 15, 
      axis: true,
    });
    refBoard.current = board;   // 画板
    setBoard(board);
    
    (window as any).board = board;   // 方便调试

    // 做一些小小处理, 在此之前 board 会创建一些默认的元素, 我们标记它们是系统创建的.
    board.objectsList.forEach((obj: any) => {
      obj._created_by_system = true;
    });

    var A = board.create('point', [-10, 10], {
      name: 'A', withLabel: true, visible: true,
      // size: 15, 
      // fixed: true,
    });
    var B = board.create('point', [16, 6.5], { name: 'B', withLabel: true, visible: true });
    var C = board.create('point', [-7, -7], { name: 'C', withLabel: true, visible: true });

    // var AB = board.create('segment', [A, B]);
    // var BC = board.create('segment', [B, C]);
    var CA = board.create('segment', [C, A]);
   
  }, [refContainer.current, setBoard]);

  return useMemo(() => (
    <>
      <div ref={refContainer} id="jgx_container" className="w-[600px] h-[600px] overflow-hidden"></div>
    </>
  ), []);
}

const JXGraph = memo(_JXGraph);
export { JXGraph };
