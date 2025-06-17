import { useRef, useMemo } from "react";
import OpenAI from "openai";
import { Button, Input, Typography } from "@mui/material";
import { useSetAtom } from "jotai";
import { useSketchpadStore } from "@renderer/store/SketchpadProvider";
import { BoardHelper } from "@renderer/utils/BoardHelper";
import { DesktopPlatform } from "@renderer/utils/platform";
import { configOpenedAtom } from "@renderer/store/app-atoms";
import "./GraphDebugger.css";

// import { _test_tool0 } from "../../_tmp/isotri5";
function _test_tool0() { }

export function GraphDebugger() {
  const setConfigAtom = useSetAtom(configOpenedAtom);

  const inputRef1 = useRef<HTMLInputElement>(null);
  const inputRef2 = useRef<HTMLInputElement>(null);
  const inputRef3 = useRef<HTMLInputElement>(null);

  const board = useSketchpadStore().board;
  const helper = useMemo(() => new BoardHelper(board!), [board]);

  if (!board) {
    return null;
  }
  

  // 创建点 (在 10*10 的随机位置):
  // @ts-ignore
  const create_point = () => {
    const x = Math.random() * 20 - 10;
    const y = Math.random() * 20 - 10;
    const point = helper.create_free_point(x, y, { name: 'X', color: '#ff0000', size: 5 });
    console.info(`create_point(): `, { x, y, point });
  };

  // 统计点的数量:
  // @ts-ignore
  const get_point_number = () => {
    const count = helper.get_point_number();
    console.info(`get_point_number(): `, { count });
  };

  // 获取点的位置
  // @ts-ignore
  const get_point_pos = () => {
    console.info(`get_point_pos: `, { board });

    const my_points = board.objectsList.filter((_obj: any) => {
      const obj = _obj as (JXG.GeometryElement & { _created_by_system?: boolean });
      return obj.elType === 'point' && !obj._created_by_system;
    }) as unknown[] as JXG.Point[];

    const poss = my_points.map(point => {
      const coords = point.coords.usrCoords;
      const x = coords[1];
      const y = coords[2];
      return ({ name: point.name, x, y });
    });

    console.info(`pos:`, JSON.stringify(poss));
    console.info(`point poss: `, { poss });
  };

  // 创建线段:
  // @ts-ignore
  const create_segment = () => {
    const A = inputRef1.current?.value ?? "";
    const B = inputRef2.current?.value ?? "";

    const seg = helper.create_segment(A, B);
    console.info(`create_segment(): `, { A, B, seg });
  };

  // 创建直线:
  // @ts-ignore
  const create_line = () => {
    const A = inputRef1.current?.value ?? "";
    const B = inputRef2.current?.value ?? "";

    const ln = helper.create_line(A, B);
    console.info(`create_line(): `, { A, B, ln });
  };

  // 创建射线:
  // @ts-ignore
  const create_ray = () => {
    const A = inputRef1.current?.value ?? "";
    const B = inputRef2.current?.value ?? "";

    const ray = helper.create_ray(A, B);
    console.info(`create_ray(): `, { A, B, ray });
  };


  // 创建平行线:
  // @ts-ignore
  const create_parallel = () => {
    const A = inputRef1.current?.value ?? "";
    const l = inputRef2.current?.value ?? "";
    const pn = helper.create_parallel(A, l, {});
    console.info(`create_parallel: `, { A, l, pn });
  };

  // 创建垂线:
  // @ts-ignore
  const create_perpendicular = () => {
    const A = inputRef1.current?.value ?? "";
    const l = inputRef2.current?.value ?? "";
    const tn = helper.create_perpendicular(A, l, {});
    console.info(`create_perpendicular: `, { A, l, tn });
  };

  // 创建中点:
  // @ts-ignore 
  const create_midpoint = () => {
    const A = inputRef1.current?.value ?? "";
    const B = inputRef2.current?.value ?? "";

    const md = helper.create_midpoint(A, B, {});
    console.info(`create_midpoint: `, { A, B, md });
  };

  // 根据参数 A,B 查询线段:
  // @ts-ignore
  const query_segment = () => {
    const A = inputRef1.current?.value ?? "";
    const B = inputRef2.current?.value ?? "";

    const seg = helper.query_segment(A, B);
    console.info(`query_segment: `, { A, B, seg });
  };


  // @ts-ignore
  const create_glider = () => {
    const lname = inputRef1.current?.value ?? "";
    const glider = helper.create_glider(lname);
    console.info(`create_glider: `, { lname, glider });
  };


  // 查询 arg1 给出的两个点名字
  // @ts-ignore 
  const query_point2 = () => {
    const arg1 = inputRef1.current?.value ?? "";

    const res = helper.split_point2(arg1);
    console.info(`query_point2: `, { res, arg1 });
  };

  // 查询 arg1 是否可分解为3个点(3个点一般可表示/指代 角/弧/圆/三角形等等)
  // @ts-ignore
  const query_point3 = () => {
    const names = inputRef1.current?.value ?? "";

    const res = helper.split_point3(names);
    console.info(`query_point3: `, { res, names });
  };

  // @ts-ignore 
  const create_circle1 = () => {
    const O = inputRef1.current?.value ?? "";
    const A = inputRef2.current?.value ?? "";
    const circle = helper.create_circle1(O, A, { withLabel: {} });

    console.info(`create_circle1: `, { O, A, circle });
  };

  // @ts-ignore 
  const create_circle2 = () => {
    const O = inputRef1.current?.value ?? "";
    const r = parseFloat(inputRef2.current?.value ?? "3");

    const circle = helper.create_circle2(O, r, {});
    console.info(`create_circle2: `, { circle, O, r });
  };

  // todo: create_circle3(O, AB)  圆心+线段作半径

  // 过三个点的圆.
  const create_circle4 = () => {
    const A = inputRef1.current?.value ?? "";
    const B = inputRef2.current?.value ?? "";
    const C = inputRef3.current?.value ?? "";

    const circle = helper.create_circle4(A, B, C, { });
    console.info(`create_circle4: `, { circle, A, B, C });
  };

  // 删除线段:
  const delete_segment = () => {
    const name = inputRef1.current?.value ?? "";
    
    const sg = helper.delete_segment(name);
    console.info(`delete_segment: `, { name, sg });
  };

  // 删除点:
  const delete_point = () => {
    const name = inputRef1.current?.value ?? "";

    const pt = helper.delete_point(name);
    console.info(`delete_point: `, { name, pt });
  };

  // 清空画板:
  const clear_canvas = () => {
    const cloned = [...board.objectsList];
    cloned.reverse();

    cloned.forEach((_obj: any) => {
      const obj = _obj as JXG.GeometryElement & { _created_by_system?: boolean };
      // 假设你在创建对象时添加了自定义属性，例如 `_createdByUser = true`
      if (!obj._created_by_system) {
        board.removeObject(obj);
      }
    });
  };

  const new_circle_name = () => {
    const name = helper.new_circle_name();
    console.info(`new_circle_name: `, { name });
  };

  const parse_points = () => {
    const names = (inputRef1.current?.value ?? "").trim();
    if (!names) return;

  };

  const open_configs = async () => {
    setConfigAtom(true);
    // const dp = new DesktopPlatform();
    // const configs = await dp.getConfigs();
    // console.info(`configs: `, configs);
  };

  const test_tool = async () => {
    _test_tool0();    
  };
  

  return (
    <>
      <Typography variant="h5">Graph Function Debug</Typography>
      <div className="my_debug_buttons">
        <Button variant="contained" onClick={test_tool}>测试工具</Button>
        {/* <Button variant="outlined" onClick={open_configs}>配置</Button> */}
        <Button variant="outlined" onClick={clear_canvas}>清空画板</Button>
        {/* <Button variant="outlined" onClick={test_qwen}>Qwen</Button> */}
        {/* <Button variant="outlined" onClick={create_point}>create point</Button> */}
        {/* <Button variant="outlined" onClick={create_midpoint}>create midpoint (A,B)</Button> */}
        {/* <Button variant="outlined" onClick={get_point_number}>get point number</Button>  */}
        {/* <Button variant="outlined" onClick={get_point_pos}>get point pos</Button> */}
        {/* <Button variant="outlined" onClick={create_segment}>create segment</Button> */}
        {/* <Button variant="outlined" onClick={create_line}>create line</Button> */}
        {/* <Button variant="outlined" onClick={create_ray}>create ray</Button> */}
        {/* <Button variant="outlined" onClick={create_glider}>create glider</Button> */}
        {/* <Button variant="outlined" onClick={create_parallel}>create parallel</Button> */}
        {/* <Button variant="outlined" onClick={create_perpendicular}>create perpendicular</Button> */}

        {/* <Button variant="outlined" onClick={query_point2}>query_point2</Button> */}
        {/* <Button variant="outlined" onClick={query_point3}>query_point3</Button> */}
        {/* <Button variant="outlined" onClick={query_segment}>query segment</Button> */}
        {/* <Button variant="outlined" onClick={create_circle1}>create circle1(O, A)</Button> */}
        {/* <Button variant="outlined" onClick={create_circle2}>create circle2(O, r)</Button> */}
        {/* <Button variant="outlined" onClick={create_circle4}>create circle4(A,B,C)</Button> */}

        {/* <Button variant="outlined" onClick={delete_segment}>delete segment(name)</Button> */}
        {/* <Button variant="outlined" onClick={delete_point}>delete point(name)</Button> */}

        {/* <Button variant="outlined" onClick={new_circle_name}>new circle name</Button> */}
        {/* <Button variant="outlined" onClick={parse_points}>parse points</Button> */}
      </div>
      <div>
        arg1: <Input type="text" placeholder="arg1" inputProps={{ ref: inputRef1 }} /> <br/>
        arg2: <Input type="text" placeholder="arg2" inputProps={{ ref: inputRef2 }} /> <br/>
        arg3: <Input type="text" placeholder="arg3" inputProps={{ ref: inputRef3 }} /> <br/>
      </div>
    </>
  );
}
