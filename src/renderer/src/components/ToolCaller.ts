import { Board } from "jsxgraph";
import { MessageWarehouse } from "@renderer/store/MessageWarehouse";
import { BoardHelper } from "@renderer/utils/BoardHelper";


export class ToolCaller {
  public readonly helper: BoardHelper;
  public constructor(
    public readonly aiStore: MessageWarehouse,
    public readonly board: Board
  ) {
    this.helper = new BoardHelper(board);
  }

  public async call(name: string, args: string) {
    try {
      return this._call(name, args);
    } catch (e) {
      console.error('exception:', e);
      const resp = {
        result: 'Error',
        description: e?.message ?? "未知错误",
      };
      return JSON.stringify(resp);
    }
  }

  private _call(name: string, _args: string) {
    const args = JSON.parse(_args);
    console.info(`  tool-call: `, { name, args });

    // 先模拟函数的调用:
    switch (name) {
      case 'get_point_number': {
        const point_number = this.helper.get_point_number();
        return JSON.stringify({ point_number });
      }
      case 'create_point': { 
        return this.create_point(args);
      }
      case 'create_midpoint': {
        return this.create_midpoint(args); 
      }
      case 'create_segment': {
        return this.create_segment(args);
      }
      case 'create_line': { 
        return this.create_line(args);
      }
      case 'create_ray': {
        return this.create_ray(args);
      }
      case 'create_parallel': {
        return this.create_parallel(args);
      }
      case 'create_perpendicular': {
        return this.create_perpendicular(args);
      }
      case 'create_bisector': {
        return this.create_bisector(args);
      }  
      case 'create_glider': {
        return this.create_glider(args);
      }
      case 'split_point2': {
        return this.split_point2(args);
      }
      case 'split_point3': {
        return this.split_point3(args);
      }
      case 'create_circle': {
        return this.create_circle(args);
      }
      case 'create_intersection': {
        return this.create_intersection(args);
      }
      case 'delete_segment': { 
        return this.delete_segment(args);
      }
      case 'delete_point': {
        return this.delete_point(args);
      }
      default:
        throw new Error(`试图调用未知函数: '${name}'.`)
    }
  }

  private create_point(args: any) {
    const { name = '', x, y, opt = {} } = args as { name?: string, x: number, y: number, opt?: any };
    const pt = this.helper.create_free_point(x, y, { ...opt, name });
    const resp = {
      result: 'OK',
      description: `点创建成功, 名字为 '${pt.name}'.`
    };
    return JSON.stringify(resp);
  }

  private create_midpoint(args: any) {
    const { name = '', A, B, opt = {} } = args as { name?: string, A: string, B: string, opt?: any };
    const nopt = { ...opt };
    if (name) { nopt.name = name; }

    const pt = this.helper.create_midpoint(A, B, nopt);
    const resp = {
      result: 'OK',
      description: `中点创建成功, 名字为 '${pt.name}'.`
    };
    return JSON.stringify(resp);
  }

  private create_segment(args: any) {
    const { A, B } = args as { A: string, B: string };
    const seg = this.helper.create_segment(A, B);
    const pA = { name: A, x: seg.point1.X(), y: seg.point1.Y() };
    const pB = { name: B, x: seg.point2.X(), y: seg.point2.Y() };
    const resp = {
      result: 'OK',
      description: `线段创建成功, 线段名字为 '${seg.name}', 端点(endpoint)为 ['${A}', '${B}'].`,
      name: seg.name,
      endpoints: [pA, pB],
    };
    return JSON.stringify(resp);
  }
  
  private create_line(args: any) {
    const { A, B } = args as { A: string, B: string };
    const ln = this.helper.create_line(A, B, {});
    const pA = { name: A, x: ln.point1.X(), y: ln.point1.Y() };
    const pB = { name: B, x: ln.point2.X(), y: ln.point2.Y() };
    const resp = {
      result: 'OK',
      description: `直线创建成功, 其名字为 '${ln.name}', 过两个点(point)为 ['${A}', '${B}'].`,
      name: ln.name,
      points: [pA, pB],
    };
    return JSON.stringify(resp);
  }

  private create_ray(args: any) {
    const { A, B } = args as { A: string, B: string };
    const ln = this.helper.create_ray(A, B, {});
    const pA = { name: A, x: ln.point1.X(), y: ln.point1.Y() };
    const pB = { name: B, x: ln.point2.X(), y: ln.point2.Y() };
    const resp = {
      result: 'OK',
      description: `射线创建成功, 其名字为 '${ln.name}', 射线起点为 '${A}', 过点 '${B}.`,
      name: ln.name,
      points: [pA, pB],
    };
    return JSON.stringify(resp);
  }

  private create_parallel(args: any) {
    const { point, line } = args as { point: string, line: string };

    const dat = this.helper.create_parallel_ex(point, line, {});
    if (dat.result) {
      const resp = {
        result: 'OK',
        description: `过点 '${point}' 平行于 '${line}' 的直线 '${dat.data.name}' 成功创建.`,
        name: dat.data.name,
      };
      return JSON.stringify(resp);
    }
    else {
      const resp = {
        result: 'Fail',
        description: `创建失败, 原因是 ${dat.desc}.`,
        name: dat.data.name,
      };
      return JSON.stringify(resp);
    }
  }

  private create_perpendicular(args: any) { 
    const { point, line } = args as { point: string, line: string };

    const tn = this.helper.create_perpendicular(point, line, {});
    if (tn) { 
      const resp = {
        result: 'OK',
        description: `过点 '${point}' 垂直于 '${line}' 的直线 '${tn.name}' 成功创建.`,
        name: tn.name,
      };
      return JSON.stringify(resp);
    } else { 
      const resp = {
        result: 'Error',
        description: `创建失败, 可能是点或线不存在.`,
      };
      return JSON.stringify(resp);
    }
  }

  private create_bisector(args: any) {
    const { O, A, B } = args as { O: string, A: string, B: string };
    const bn = this.helper.create_bisector(O, A, B, {});
    const resp = {
      result: 'OK',
      description: `角 '${A}${O}${B}' 的角平分线 '${bn.name}' 创建成功.`,
      name: bn.name,
    };
    return JSON.stringify(resp);
  }

  private create_glider(args: any) {
    const { ln, x = 0, y = 0, opt = {} } = args as { ln: string, x?: number, y?: number, opt?: any };
    const dat = this.helper.create_glider(ln, x, y, opt);
    if (dat.result) {
      const resp = {
        result: 'OK',
        description: `成功创建线上的点, 名字为 ${dat.data.name}.`,
      };
      return JSON.stringify(resp);
    }
    else {
      const resp = {
        result: 'Error',
        description: `创建线上的点失败.`,
      };
      return JSON.stringify(resp);
    }
  }
     
  private split_point2(args: any) {
    const { name } = args as { name: string };
    const points = this.helper.split_point2(name);
    if (!points) return JSON.stringify({ result: 'Error', description: '未找到可组成名字的点对' });

    const p1 = points[0];
    const p2 = points[1];
    const p1info = { name: p1.name, x: p1.X(), y: p1.Y() };
    const p2info = { name: p2.name, x: p2.X(), y: p2.Y() };
    const resp = {
      result: 'OK',
      description: `根据名字 ${name} 找到的两个点名字分别为 '${p1.name}', '${p2.name}'.`,
      points: [p1info, p2info],
    };
    return JSON.stringify(resp);
  }
  
  private split_point3(args: any) {
    const { name } = args as { name: string };
    const points = this.helper.split_point3(name);
    if (!points || !points.length) return JSON.stringify({ result: 'Error', description: '未找到可组成名字的点对' });

    const resp = {
      result: 'OK',
      description: `找到的点为 ${points.map(_ => `'${_.name}'`).join(', ')}.`,
      points: points.map(_ => ({ name: _.name, x: _.X(), y: _.Y() }))
    };
    return JSON.stringify(resp);
  }
  
  private create_circle(args: any) {
    const { O, A, B, C, r, s } = args as { O?: string, A?: string, B?: string, C?: string, r?: string, s?: string };

    let circle: JXG.Circle | null = null;
    let opt = {};   // todo:
    // 1. 如果给出了 O,A, 则对应 create_circle1(O, A)
    if (O && A) {
      circle = this.helper.create_circle1(O, A, opt);
    }
    // 2. 如果给出了 O,r 则对应 create_circle2(O, r)
    else if (O && typeof r === 'number' && r > 0) {
      circle = this.helper.create_circle2(O, r, opt);
    }
      // 3. 如果给出了 O,s 则对应 
    else if (O && s) {
      circle = this.helper.create_circle3(O, s, opt);
    }  
    // 4. 如果给出了 A,B,C 则对应 create_circle4(A, B, C)
    else if (A && B && C) {
      circle = this.helper.create_circle4(A, B, C, opt);
    }

    const resp = {
      result: 'OK',
      description: `圆创建成功, 圆的名字为 '${circle.name}'.`,
      name: circle.name,
    };
    return JSON.stringify(resp);
  }

  private create_intersection(args: any) {
    const { ln1, ln2 } = args as { ln1: string, ln2: string };
    const xpt = this.helper.create_intersection1(ln1, ln2, {});
    if (!xpt) { throw new Error(`未能创建交点`) }

    const resp = {
      result: 'OK',
      description: `交点创建成功, 名字为 '${xpt.name}'.`,
      name: xpt.name,
    };
    return JSON.stringify(resp);
  }


  private delete_segment(args: any) {
    const { name } = args as { name: string };
    const dat = this.helper.delete_segment(name);

    if (dat) {
      return JSON.stringify({
        result: 'OK',
        description: `线段 '${name}' 删除成功.`,
      });
    }
    else { 
      return JSON.stringify({
        result: 'Error',
        description: `删除线段失败, 可能是线段 '${name}' 不存在.`,
      });
    }
  }

  private delete_point(args: any) { 
    const { name } = args as { name: string };
    const dat = this.helper.delete_point(name);

    if (dat) {
      return JSON.stringify({
        result: 'OK',
        description: `点 '${name}' 删除成功.`,
      });
    }
    else { 
      return JSON.stringify({
        result: 'Error',
        description: `删除点失败, 可能是点 '${name}' 不存在.`,
      });
    }
  }
  
}
