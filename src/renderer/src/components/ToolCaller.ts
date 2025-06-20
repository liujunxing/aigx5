// @ts-nocheck
import type { Board, Point, Segment } from "jsxgraph";
import { MessageWarehouse } from "@renderer/store/MessageWarehouse";
import { BoardHelper } from "@renderer/utils/BoardHelper";
import { get_isotri_prompt } from "@renderer/prompts/isotri-prompt";
import { get_eqltri_prompt } from "@renderer/prompts/eqltri-prompt";
import { get_parallel_quadrangle_prompt } from "@renderer/prompts/parallel-quadrangle-prompt";
import { get_rtri_prompt } from "@renderer/prompts/rtri-prompt";


/**
 * 辅助实现 function-tool 的调用.
 */
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
      case 'query_point_info': {
        return this._query_point_info(args);
      }
      case 'create_point': { 
        return this._create_point(args);
      }
      case 'create_midpoint': {
        return this._create_midpoint(args); 
      }
      case 'create_segment': {
        return this._create_segment(args);
      }
      case 'create_line': { 
        return this._create_line(args);
      }
      case 'create_ray': {
        return this._create_ray(args);
      }
      case 'create_parallel': {
        return this._create_parallel(args);
      }
      case 'create_perpendicular': {
        return this._create_perpendicular(args);
      }
      case 'create_bisector': {
        return this._create_bisector(args);
      }  
      case 'create_glider': {
        return this._create_glider(args);
      }
      case 'split_point2': {
        return this._split_point2(args);
      }
      case 'split_point3': {
        return this._split_point3(args);
      }
      case 'create_circle': {
        return this._create_circle(args);
      }
      case 'create_intersection': {
        return this._create_intersection(args);
      }
      case 'delete_segment': { 
        return this._delete_segment(args);
      }
      case 'delete_point': {
        return this._delete_point(args);
      }
      case 'shape_prompt': {
        return this._shape_prompt(args);
      }
      // 暂取消
      // case 'create_special_triangle': {
      //   return this._create_special_triangle(args);
      // }
      case 'create_isotri_apex': {
        return this._create_isotri_apex(args);
      }
      case 'create_eqltri_apex': {
        return this._create_eqltri_apex(args);
      }
      case 'create_rtri_apex': {
        return this._create_rtri_apex(args);
      }
      case 'create_parallelogram': {
        return this._create_parallelogram(args);
      }
      
      case 'specify_style_adjustee': {
        return this._specify_style_adjustee(args);
      }
      case 'set_object_style': {
        return this._set_object_style(args);
      }
      default:
        throw new Error(`试图调用未知函数: '${name}'.`)
    }
  }

  private _query_point_info(_args: any) {
    const name = _args.name as string ?? '';
    const p = this.helper.query_point(name);
    if (!p) {
      return `未找到名为 '${name}' 的点.`;
    }
    return `点 '${name}' 的坐标为 (${p.X()}, ${p.Y()}).`;
  }

  private _create_point(args: any) {
    const { name = '', x, y, opt = {} } = args as { name?: string, x: number, y: number, opt?: any };
    const pt = this.helper.create_free_point(x, y, { ...opt, name });
    const resp = {
      result: 'OK',
      description: `点创建成功, 名字为 '${pt.name}'.`
    };
    return JSON.stringify(resp);
  }

  private _create_midpoint(args: any) {
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

  private _create_segment(args: any) {
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
  
  private _create_line(args: any) {
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

  private _create_ray(args: any) {
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

  private _create_parallel(args: any) {
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

  private _create_perpendicular(args: any) { 
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

  private _create_bisector(args: any) {
    const { O, A, B } = args as { O: string, A: string, B: string };
    const bn = this.helper.create_bisector(O, A, B, {});
    const resp = {
      result: 'OK',
      description: `角 '${A}${O}${B}' 的角平分线 '${bn.name}' 创建成功.`,
      name: bn.name,
    };
    return JSON.stringify(resp);
  }

  private _create_glider(args: any) {
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
     
  private _split_point2(args: any) {
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
  
  private _split_point3(args: any) {
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
  
  private _create_circle(args: any) {
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

  private _create_intersection(args: any) {
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


  private _delete_segment(args: any) {
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

  private _delete_point(args: any) { 
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

  // 现在暂时不使用 shape 参数
  private _shape_prompt(_args: any) {
    const pts = tri_points.map(pp => {
      const pn = (i: number) => +((pp[i] + rnd3(-0.1, 0.1)).toFixed(3));
      return `* (${pn(0)}, ${pn(1)}), (${pn(2)}, ${pn(3)}), (${pn(4)}, ${pn(5)}) .`;
    }).join('\n');

    // 普通三角形
    const prompt1 = `
## 创建普通三角形 
建议使用以下推荐的坐标点来创建三角形, 可随机选择其中的一组:
  ${pts}

`;
    
    // 等腰三角形
    const prompt2 = get_isotri_prompt();
    // 等边三角形
    const prompt2a = get_eqltri_prompt();
    // 直角三角形
    const prompt2b = get_rtri_prompt();
    const tri_prompts = prompt2 + prompt2a + prompt2b;
    
    // 平行四边形:
    const prompt3 = get_parallel_quadrangle_prompt();

    return prompt1 + tri_prompts + prompt3;
  }
  
  private _create_special_triangle(_args: any) {
    console.info(`create_special_triangle: `, _args);
    throw new Error('Not implemented.');
  }

  private _create_isotri_apex(_args: any) {
    console.info(`create_isotri_apex: `, _args);
    const p1 = _args.p1 as string,
      p2 = _args.p2 as string,
      p3 = _args.p3 as string,
      hr = _args.hr as number;
    
    // 找到底边两点 B=p2, C=p3
    const B = this.helper.query_point(p2),
      C = this.helper.query_point(p3);
    
    // 找到底边:
    const BC = this.helper.query_segment(B.name, C.name);

    // 创建顶点
    const _ = this.helper._create_isotri_apex(B, C, BC, p1, hr);

    return `创建顶点成功: ${p1}`;
  }

  private _create_eqltri_apex(_args: any) {
    console.info('create_eqltri_apex: ', _args);
    const p1 = _args.p1 as string,
      p2 = _args.p2 as string,
      p3 = _args.p3 as string;
    
    const B = this.helper.query_point(p2),
      C = this.helper.query_point(p3);
    
    const _ = this.helper._create_eqltri_apex(B, C, p1);
    return `创建成功`;
  }

  private _create_rtri_apex(_args: any) {
    console.info('create_rtri_apex: ', _args);
    const p1 = _args.p1 as string,  // @n A
      p2 = _args.p2 as string,      // B
      p3 = _args.p3 as string,      // C
      b = _args.b as number ?? '52';    // ∠B 的大小
    
    const B = this.helper.query_point(p2),
      C = this.helper.query_point(p3);
    
    const _ = this.helper._create_rtri_apex(B, C, p1, b);
    return `创建成功`;
  }

  private _create_parallelogram(_args: any) {
    console.info(`create_parallelogram: `, _args);
    const p1 = _args.p1 as string,
      p2 = _args.p2 as string,
      p3 = _args.p3 as string,
      p4 = _args.p4 as string;

    // 先找到 p1=A,p2=B,p3=C
    const A = this.helper.query_point(p1),
      B = this.helper.query_point(p2),
      C = this.helper.query_point(p3);
    
    // 创建点 D
    const D = this.helper.board.create('parallelpoint', [A, B, C], { name: p4 });
    

    return `创建点成功: ${p4}`;
  }

  private _specify_style_adjustee(_args: any) { 
    const type = _args.type as string ?? '',
      name = _args.name as string ?? '';

    if (!type || !name) {
      return `没有给出对象的名字或对象类型.`;
    }

    switch (type) {
      case 'point':
        current_adjustee = this.helper.query_point(name);
        break;
      case 'segment':
        current_adjustee = this.helper.query_segment2(name, false);
        break;
      case 'circle':
        current_adjustee = this.helper.query_circle(name);
        break;
      default:
        return `不认识的对象类型 ${type}.`;
    }

    return `OK, 已设置当前待修改的对象为 ${current_adjustee.name}`;
  }

  private _set_object_style(_args: any) {
    console.info(`set_object_style: `, _args);

    const obj = current_adjustee;
    if (!obj) {
      return `没有设置当前待修改的对象, 一般您需要先指明想修改的对象类型和名字,引用.`;
    }
    
    obj.setAttribute(_args);

    return `OK`;
  }
}

// 问题: 这个 tool-caller 每次都创建新的, 所以不能保存这个信息... 我们先放到全局吧...
let current_adjustee: any = null;


const tri_points = [
  // [0, 0, 10, 0, 4, 7],
  [-4.51, 9.20, -8.53, -6.41, 16.04, -6.43],  // 三角形三个顶点的坐标.
  [4.77, 8.72, -5.87, -3.37, 11.77, -3.64],
];

// 生成一个指定范围内的随机数, 只保留3位有效数字. 
function rnd3(min: number, max: number) {
  const num = Math.random() * (max - min) + min;
  return Math.round(num * 1000) / 1000; // 保留3位有效数字
}
