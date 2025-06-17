import type { Board, Point, Segment } from "jsxgraph";

declare module "jsxgraph" {
  interface GeometryElement {
    _org_type: number;
    _created_by_system?: boolean;
  }
}

const OBJECT_TYPE_POINT = 12;

export class BoardHelper {
  /** 用于给圆起名字 */
  private _cir_id = 1;

  public constructor(
    public readonly board: Board
  ) { }

  /** 辅助函数, 得到所有点 */
  private _get_all_points(): JXG.Point[] {
    return this.board.objectsList.filter((obj: JXG.GeometryElement) => {
      return obj._org_type === OBJECT_TYPE_POINT && !obj._created_by_system;
    }) as JXG.Point[];
  }

  /** 辅助函数, 查找所有线段 */
  private _get_all_segments(): JXG.Segment[] {
    return this.board.objectsList.filter((obj: JXG.GeometryElement) => {
      return obj.elType === 'segment' && !obj._created_by_system;
    }) as JXG.Segment[];
  }



  // 获得点的数量:
  public get_point_number(): number {
    const my_points = this._get_all_points();
    return my_points.length;
  }

  // 在指定位置创建自由点:
  public create_free_point(x: number, y: number, opt?: any): JXG.Point {
    const point = this.board.create('point', [x, y], opt || { }) as JXG.Point;
    return point;
  }

  // 创建线段:
  public create_segment(A: string, B: string): JXG.Segment {
    const seg = this.board.create('segment', [A, B], {});
    return seg;
  }

  // 创建直线:
  public create_line(A: string, B: string, opt: any = {}) {
    const ln = this.board.create('line', [A, B], opt); 
    return ln;
  }

  // 创建射线:
  public create_ray(A: string, B: string, opt: any = {}) {
    const nopt = {
      ...opt,
      straightLast: true,
      straightFirst: false,
    }

    // 也许我们应提供 'ray' 类型...
    const ray = this.board.create('line', [A, B], nopt);
    return ray;
  }

  // 线上的点:
  public create_glider(lname: string, x: number = 0, y: number = 0, opt: any = {}) {
    const lns = this._query_line_1_2(lname);
    if (!lns || lns.length === 0) {
      return { result: false, code: 400, data: null, desc: `线 ${lname} 不存在` };
    }

    const ln = lns[0];
    const pt = this.board.create('glider', [x, y, ln], opt);
    return { result: true, code: 0, data: pt, desc: 'OK' };
  }

  // 切分两个点的名字:
  public split_point2(names: string): [JXG.Point, JXG.Point] | null {
    // 1. 查询出所有点:
    const points = this._get_all_points();

    // 2. 遍历所有点, 如果点的名字包含在 name 中, 进入内循环查询:
    for (const p1 of points) {
      const name1 = p1.name;
      if (names.includes(name1)) {
        // 3. 遍历所有点(且不同于 p1), 如果点1,点2 的名字组合起来是 name, 则返回这两个点:
        for (const p2 of points) {
          if (p1 === p2) continue; // 跳过同一个点
          const name2 = p2.name;

          if (name1 + name2 === names) {
            return [p1, p2];
          }
        }
      }
    }

    // 4. 如果没有找到, 返回空
    return null;
  }

  // 切分三个点的名字:
  public split_point3(names: string) {
    // 1. 查询出所有点, 稍微做一点过滤, 使得点的名字至少出现在 names 中.
    const points = this._get_all_points().filter(_ => names.includes(_.name));
    if (points.length < 3) return null;    // 不足三个点, 则不能组合为我们所需的三个点.

    // 遍历所有点 p1,p2,p3 看 p1.name+p2.name+p3.name === names
    for (const p1 of points) {
      const name1 = p1.name;
      if (!names.startsWith(name1)) continue;

      // 第二个点
      for (const p2 of points) {
        if (p1 === p2) continue; // 跳过同一个点
        const name2 = p2.name;
        if (!names.startsWith(name1 + name2)) continue;

        for (const p3 of points) {
          if (p1 === p3 || p2 === p3) continue; // 跳过同一个点
          const name3 = p3.name;

          if (name1 + name2 + name3 === names) {
            return [p1, p2, p3];
          }
        }
      }
    }

    return null;
  }

  // 创建平行线(v2, 高级版)
  public create_parallel_ex(P: string, lref: string, opt: any = {}) {
    // 1. 查询是否 P 存在.
    const pP = this._query_point(P);
    if (!pP) {
      return { result: false, code: 400, data: null, desc: `点 ${P} 不存在.` };
    }

    // 2. 查询 rl 代表的直线.
    const ls = this._query_line_1_2(lref);
    if (ls.length === 0) {
      return { result: false, code: 401, data: null, desc: `线 ${lref} 不存在.` };
    }
    const l = ls[0];

    // 3. 创建平行线.
    const pn = this.board.create('parallel', [pP, l], opt) as JXG.Parallel;
    return { result: true, code: 0, data: pn, desc: 'OK' };
  }

  private _query_line_1_2(name: string): JXG.Line[] {
    const l1 = this._query_line1(name);
    if (l1) return [l1];

    const l2s = this._query_line2(name);
    return l2s;
  }

  // 查询指定的名字是否是一条线(含直线, 射线, 线段).
  private _query_line1(name: string): JXG.Line | null {
    const obj = this.board.elementsByName[name];
    if (obj && obj.type === 11) {   // 已知 OBJECT_TYPE_LINE=11 是线
      return obj as JXG.Line;
    }
    return null;
  }

  // 查询指定的名字是否是其两个端点构成的名字, 如 'AB'
  private _query_line2(name: string): JXG.Line[] {
    const lines = this.board.objectsList.filter((_obj: any) => {
      const obj = _obj as JXG.GeometryElement;
      if (obj.type === 11) {
        const line = obj as JXG.Line;
        const n1 = line.point1.name, n2 = line.point2.name;
        return (n1 + n2 === name || n2 + n1 === name);
      }
      return false;
    }) as JXG.Line[];
    return lines;
  }

  // 查询指定的名字是否是一个点, 如果是则返回该点, 否则返回 null.
  private _query_point(name: string): JXG.Point | null {
    const obj = this.board.elementsByName[name];
    if (obj && obj.type === OBJECT_TYPE_POINT) {   // 已知 OBJECT_TYPE_POINT=12 是点
      return obj as JXG.Point;
    }
    return null;
  }

  // 创建平行线:
  public create_parallel(P: string, l: string, opt: any = {}) {
    const lns = this._query_line_1_2(l);
    if (!lns || lns.length !== 1) return null;

    const l1 = lns[0];
    const pn = this.board.create('parallel', [P, l1], opt);
    return pn;
  }

  // 创建垂线:
  public create_perpendicular(P: string, l: string, opt: any = {}) {
    const lns = this._query_line_1_2(l);
    if (!lns || lns.length !== 1) return null;

    const l1 = lns[0];
    const tn = this.board.create('perpendicular', [P, l1], opt);
    return tn;
  }

  // 角平分线 
  public create_bisector(O: string, A: string, B: string, opt: any = {}) {
    const nopt = { ...opt };
    const bn = this.board.create('bisector', [A, O, B], nopt);
    return bn;
  }
  
  // 创建中点:
  public create_midpoint(A: string, B: string, opt: any = {}) {
    const nopt = { color: 'cyan', ...opt };
    const md = this.board.create('midpoint', [A, B], nopt);
    return md;
  }

  
  // 查询是否有过 A,B 的线段. (初级版本)
  public query_segment(A: string, B: string, _opt?: any): JXG.Segment | null {
    // 查询出所有线段:
    const segments = this._get_all_segments();

    return segments.find(_ => {
      const name1 = _.point1.name;
      const name2 = _.point2.name;
      return (name1 === A && name2 === B) || (name1 === B && name2 === A);
    }) ?? null;
  }

  // 查询是否有名为 s, 或 s 是两个点的名字的线段.
  public query_segment2(s: string, create: boolean = false) {
    // 1. 当作线段名:
    const sg1 = this.board.elementsByName[s];
    if (sg1 && sg1.name === s && sg1.elType === 'segment')
      return sg1 as JXG.Segment;

    // 2. 当作线段的两个端点:
    const sg2 = this.query_segment_by_point_names(s);
    if (sg2) return sg2;

    // 3. 没有则创建该线段:
    if (create) {
      const tmp = this.split_point2(s);
      if (!tmp || !tmp.length) return null;

      return this.board.create('segment', [tmp[0], tmp[1]], {});
    }

    return null;
  }

  // 通过两个点的名字查询线段:
  public query_segment_by_point_names(names: string) {
    const tmp = this.split_point2(names);
    if (!tmp || !tmp.length) return null;

    const p1 = tmp[0], p2 = tmp[1];

    const sg2 = this.board.objectsList.find((obj: JXG.GeometryElement) => {
      if (obj.elType === 'segment') {
        const sg = obj as JXG.Segment;
        return ((sg.point1 === p1 && sg.point2 === p2)
          || (sg.point1 === p2 && sg.point2 === p1));
      }
      return false;
    }) as JXG.Segment;
    return sg2 ?? null;
  }

  // 使用圆心和圆上一点创建圆:
  public create_circle1(O: string, A: string, opt: any = {}) {
    const nopt = this._apply_circle_name(opt);
    const cir = this.board.create('circle', [O, A], nopt);
    return cir;
  }

  public create_circle2(O: string, r: number, opt: any = {}) {
    const nopt = this._apply_circle_name(opt);
    const cir = this.board.create('circle', [O, r], nopt);
    return cir;
  }

  public create_circle3(O: string, s: string, opt: any = {}) {
    const nopt = this._apply_circle_name(opt);
    const seg = this.query_segment2(s, true);
    if (!seg) {
      throw new Error(`无法找到线段 ${s}.`)
    }
    const cir = this.board.create('circle', [O, seg], nopt);
    return cir;
  }

  public create_circle4(A: string, B: string, C: string, opt: any = {}) { 
    const nopt = this._apply_circle_name(opt);
    const cir = this.board.create('circle', [A, B, C], nopt);
    return cir;
  }


  // 线与线的交点:
  public create_intersection1(l1: string, l2: string, opt: any = {}) {
    const nopt = { ...opt };
    
    const ln1s = this._query_line_1_2(l1);
    if (!ln1s || !ln1s.length) return null;

    const ln2s = this._query_line_1_2(l2);
    if (!ln2s || !ln2s.length) return null;

    const xpt = this.board.create('intersection', [ln1s[0], ln2s[0]], opt);
    return xpt;
  }

  // todo: 线与圆的交点:

  // 圆与圆的交点:


  // ---- 删除 ----

  /** 删除线段, 线段可使用名字/两个点来指代. */
  public delete_segment(name: string) {
    if (!name) return null;
    
    const sg = this.query_segment2(name, false);
    if (!sg) return null;

    this.board.removeObject(sg);
    return sg;
  }

  /** 删除点, 点可以直接用名字获取到. */
  public delete_point(name: string) {
    if (!name) return null;

    const pt = this.board.elementsByName[name];
    if (!pt) return null;
    if (pt.type !== OBJECT_TYPE_POINT && pt._org_type !== OBJECT_TYPE_POINT) return null;     // 不是点?
    if (pt.name !== name) return null;   // 按理不会发生~

    this.board.removeObject(pt);
    return pt as JXG.Point;
  }

  // todo: 删除圆, 这要求支持几种指代圆的方式: 名字, 圆心+圆上1~N个点, 圆心(不冲突的情况下), 圆上N个点(至少2个)
  public delete_circle(_name: string): BoardHelper.DeleteResult<JXG.Circle> {
    // 1. 情况一: name 是圆的名字, 如 'c1' 等.


    throw new Error(`unimplemented`)
  }


  /** 为圆起一个名字, jsx 缺省给的名字不易使用, 我们使用 c1, c2 等简单名字 */
  public new_circle_name() {
    while (true) {
      const id = this._cir_id;
      const cname = `c${id}`;
      if (!this.board.elementsByName[cname])
        return cname;

      this._cir_id++;
    }
  }

  private _apply_circle_name(opt: any = {}) {
    const nopt = { ...opt };
    const name: string | undefined = nopt.name;
    if (name == undefined) {
      nopt.name = this.new_circle_name();
    }
    return nopt;
  }

  /** 尝试分解 names 为多个点, 如 'ABC' 分解为 [A, B, C]. 如果不能分解则返回 null. */
  public try_parse_points(names: string) {
    // 现在先使用简单算法, 最左匹配吧.

    // 1. 先拿到所有点 (稍微过滤掉):
    const points = this.board.objectsList.filter((_: JXG.GeometryElement) => {
      return _._org_type === OBJECT_TYPE_POINT && _.name && names.includes(_.name);
    }) as JXG.Point[];

    // 


  }


  public query_point(name: string): JXG.Point { 
    const pt = this.board.elementsByName[name];
    if (!pt) return null;

    if (pt._org_type !== OBJECT_TYPE_POINT) return null;
    return pt as JXG.Point;
  }
  
  public _create_isotri_apex(B: Point, C: Point, BC: Segment, p1: string, hr: number) {
    // 求 BC 的中点 'M', 得到其位置.
    const M = this.board.create('midpoint', [B, C], { name: '', visible: false });
    const Mc = [M.coords.usrCoords[1], M.coords.usrCoords[2]];

    // 过 'M' 作 BC 的垂线.
    const tn = this.board.create('perpendicular', [M, BC], { name: '', visible: false });

    // 计算一个合适的顶点位置:
    const Bc = [B.coords.usrCoords[1], B.coords.usrCoords[2]];
    const Cc = [C.coords.usrCoords[1], C.coords.usrCoords[2]];
    const v = [Bc[0] - Cc[0], Bc[1] - Cc[1]];
    const vlen = Math.sqrt(v[0] * v[0] + v[1] * v[1]);
    v[0] /= vlen; v[1] /= vlen;   // 底边的单位向量

    const Pc = [Mc[0] + v[1] * hr*vlen, Mc[1] - v[0] * hr*vlen];
    const A = this.board.create('glider', [Pc[0], Pc[1], tn], { name: p1 });

    return { A, M, tn };
  }

  public _create_eqltri_apex(B: Point, C: Point, p1: string) {
    // 以 B 为圆心, BC 为半径作圆
    const c1 = this.board.create('circle', [B, C], { name: '', visible: false });
    // 以 C 为圆心, BC 为半径作圆
    const c2 = this.board.create('circle', [C, B], { name: '', visible: false });

    // 创建 c1,c2 的交点, 选择子=1
    const A = this.board.create('intersection', [c1, c2, 1], { name: p1, visible: true });

    return { A, c1, c2 };
  }

}

export namespace BoardHelper { 
  export type DeleteResult<T = any> = {
    result: boolean;    // true: 正确, false: 失败.
    code: number;       // 错误编码, 正确时该值为 0.
    message: string;    // 错误描述, 正确时为 'OK'
    data: T;            // 当正确时, 可能返回的数据.
  }
}
