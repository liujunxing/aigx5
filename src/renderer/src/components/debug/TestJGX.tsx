// import { useAIStore } from "@renderer/store/AIStoreProvider";
import { useEffect, useRef, memo } from "react";

declare const JXG: any;  // JGX 是全局变量

function _TestJXG() {
  // const ctxt = useAIStore();
  // console.info(`ctxt:`, ctxt);

  const refContainer = useRef<HTMLDivElement>(null);   // 容器
  const didRun = useRef(false);
  const refBoard = useRef<any>(null);   // 画板

  useEffect(() => { 
    if (!refContainer.current) return;
    if (didRun.current) return;  // 只运行一次

    // 这里可能被调用两次 (dev 模式下)
    console.info(`jxg container:`, refContainer.current);

    const board = JXG.JSXGraph.initBoard('jgx_container', {
      originX: 300, originY: 300, 
      grid: true, 
      unitX: 15, unitY: 15, 
      axis: true,
    });
    refBoard.current = board;   // 画板
    (window as any).board = board;   // 方便调试

    var A = board.create('point', [-10, 10], {
      name: 'A', withLabel: true, visible: true,
      // size: 15, 
      // fixed: true,
    });
    var B = board.create('point', [16, 6.5], { name: 'B', withLabel: true, visible: true });
    var C = board.create('point', [-7, -7], { name: 'C', withLabel: true, visible: true });

    // @ts-ignore 
    var AB = board.create('segment', [A, B]);
    // @ts-ignore 
    var BC = board.create('segment', [B, C]);
    // @ts-ignore 
    var CA = board.create('segment', [C, A]);
   
    didRun.current = true;   // 只运行一次
  }, [refContainer.current]);

  return (
    <>
      <div ref={refContainer} id="jgx_container" style={{ width: 600, height: 600, overflow: 'hidden'}}></div>
    </>
  )
}

// export { TestJXG };

const TestJXG = memo(_TestJXG);
export { TestJXG };
