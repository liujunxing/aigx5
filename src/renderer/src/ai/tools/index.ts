import OpenAI from "openai";

// (调试用) 获得点的数量: get_point_number()
const get_point_number: OpenAI.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'get_point_number',   // 快速测试用 
    description: '获得当前图中点的数量',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  }
};

// 创建自由点: create_point(x,y,?opt)
const create_point: OpenAI.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'create_point',
    description: '在给定的位置创建一个(自由)点. 如果用户未指定位置, 则在当前坐标系范围内的随机位置创建点.',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: '点的名字'
        },
        x: {
          type: 'number',
          description: '点的 x 坐标'
        },
        y: {
          type: 'number',
          description: '点的 y 坐标'
        },
        opt: {
          type: 'object',
          description: '点的显示属性, 如大小,颜色等',
          properties: {
            size: {
              type: 'number',
              description: '点的大小. 如果未给出, 系统会使用默认值: 3像素.'
            },
            color: {
              type: 'string',
              description: '点的颜色. 如果未给出, 系统会使用默认值.'
            }
          },
          required: [],
        },
      },
      required: ['x', 'y']
    },
  }
};

// 中点: 
const create_midpoint: OpenAI.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'create_midpoint',
    description: '创建两个点的中点.',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: '点的名字. 如果未给出, 则系统会自动生成一个名字.',
        },
        A: {
          type: 'string',
          description: '点A'
        },
        B: {
          type: 'string',
          description: '点B'
        },
        opt: {
          type: 'object',
          description: '点的显示属性, 如大小,颜色等',
          properties: {
            size: {
              type: 'number',
              description: '点的大小. 如果未给出, 系统会使用默认值: 3像素.'
            },
            color: {
              type: 'string',
              description: '点的颜色. 如果未给出, 系统会使用默认值.'
            }
          },
          required: [],
        },
      },
      required: ['A', 'B']
    },
  }
};

// 线上的点:
const create_glider: OpenAI.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'create_glider',
    parameters: {
      type: 'object',
      properties: {
        ln: {
          type: 'string',
          description: '线的名字, 或两个点表示的一条线(线段,射线,直线 等)'
        },
        x: {
          type: 'number',
          default: 0,
          description: '点的x坐标'
        },
        y: {
          type: 'number',
          default: 0,
          description: '点的y坐标'
        },
        opt: {
          type: 'object',
          description: '点的显示属性, 如名字,大小,颜色等.',
          properties: {
            name: {
              type: 'string',
              description: '点的名字. 如果未给出, 则系统自动产生一个.',
            },
            size: {
              type: 'number',
              description: '点的大小. 如果未给出, 系统会使用默认值: 3像素.'
            },
            color: {
              type: 'string',
              description: '点的颜色. 如果未给出, 系统会使用默认值.'
            }
          },
          required: [],
        },
      },
      required: ['lname']
    }
  }
};

// 线段:
const create_segment: OpenAI.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'create_segment',
    description: '使用给定的两个端点创建线段',
    parameters: {
      type: 'object',
      properties: {
        A: {
          type: 'string',
          description: '线段的一个端点'
        },
        B: {
          type: 'string',
          description: '线段的另二个端点'
        }
      },
      required: ['A', 'B']
    }
  }
};

// 直线:
const create_line: OpenAI.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'create_line',
    description: '作过指定两个点的直线. 注意直线 AB 与 BA 是相同的.',
    parameters: {
      type: 'object',
      properties: {
        A: {
          type: 'string',
          description: '直线过的第一个点'
        },
        B: {
          type: 'string',
          description: '直线过的第二个点'
        }
      },
      required: ['A', 'B']
    }
  }
};

// 射线:
const create_ray: OpenAI.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'create_ray',
    description: '作过指定两个点的射线. 注意: 射线 AB 与 BA 是不同的.',
    parameters: {
      type: 'object',
      properties: {
        A: {
          type: 'string',
          description: '射线的起点'
        },
        B: {
          type: 'string',
          description: '射线过此点'
        }
      },
      required: ['A', 'B']
    }
  }
};

// 切分/查询两个点的名字:
const split_point2: OpenAI.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'split_point2',
    description: '分割参数 name 为两个点(的名字), 如果成功则返回这两个点的信息. 在画板中通常用两个点名字连接在一起表示线段,直线 或射线等.',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: '两个点的名字以字符串方式连接在一起的名字, 中间没有空格.'
        }
      },
      required: ['name']
    }
  }
};

// 切分/查询三个点的名字:
const split_point3: OpenAI.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'split_point3',
    description: '分割参数 name 为三个点(的名字), 如果成功则返回这三个点的信息. 在画板中通常用三个点名字连接在一起指代角,弧,圆等.',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: '三个点的名字以字符串方式连接在一起的名字, 中间没有空格.'
        }
      },
      required: ['name']
    }
  }
};

// 平行线:
const create_parallel: OpenAI.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'create_parallel',
    description: '作一条过指定点 *平行于* 指定线的直线',
    parameters: {
      type: 'object',
      properties: {
        point: {
          type: 'string',
          description: '过这个点作平行线'
        },
        line: {
          type: 'string',
          description: '平行于这个名字指代的线'
        }
      },
      required: ['point', 'line']
    },
  },
};

// 垂线:
const create_perpendicular: OpenAI.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'create_perpendicular',
    description: '作过指定点且 *垂直于* 指定线的直线',
    parameters: {
      type: 'object',
      properties: {
        point: {
          type: 'string',
          description: '过这个点作垂线'
        },
        line: {
          type: 'string',
          description: '垂直于这个名字指代的线'
        }
      },
      required: ['point', 'line']
    },
  },
};

// 角平分线:
const create_bisector: OpenAI.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'create_bisector',
    description: '创建角平分线, 角顶点为 O, 角的两条边为 OA, OB. 也即此线平分角 AOB.',
    parameters: {
      type: 'object',
      properties: {
        O: {
          type: 'string',
          description: '角顶点'
        },
        A: {
          type: 'string',
          description: 'OA 构成角的一个边'
        },
        B: {
          type: 'string',
          description: 'OB 构成角的另一个边'
        }
      },
      required: ['O', 'A', 'B']
    }
  },
};

// 圆:
const create_circle: OpenAI.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'create_circle',
    description: [
      `创建圆, 有几种创建方式: `,
      `1. 指定圆心(O)和圆上一点(A)作圆, 此时需要给出参数 O,A.`,
      `2. 指定圆心(O)和给出固定的半径(r)作圆, 此时需要给出参数 O,r.`,
      `3. 指定圆心(O)和一个线段做为半径(如线段 AB, 线段s), 此时需要给出参数 O,s.`,
      `4. 指定三个点(A,B,C)作圆, 此时需要给出参数 A,B,C 作为点的名字.`
    ].join('\n'),
    parameters: {
      type: 'object',
      properties: {
        O: {
          type: 'string',
          description: '圆心'
        },
        A: {
          type: 'string',
          description: '圆上的一点'
        },
        r: {
          type: 'number',
          description: '圆的半径'
        },
        s: {
          type: 'string',
          description: '圆的半径的线段, 可以是线段的名字, 或用两个点指代该线段.'
        }
      },
      required: []
    }
  }
};

// 交点:
const create_intersection: OpenAI.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'create_intersection',
    description: '创建所给的两条线的交点',
    parameters: {
      type: 'object',
      properties: {
        ln1: {
          type: 'string',
          description: '第一个线的名字, 或用两个点指代线的名字'
        },
        ln2: {
          type: 'string',
          description: '第二个线的名字, 或用两个点指代线的名字'
        }
      },
      required: ['ln1', 'ln2']
    }
  }
};


// 删除点:
const delete_point: OpenAI.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'delete_point',
    description: '删除点',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: '点的名字'
        }
      },
      required: ['name']
    }
  }
};

// 删除线段:
const delete_segment: OpenAI.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'delete_segment',
    description: '删除线段',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: '线段的名字, 或使用线段的两个端点指代线段(如 AB).'
        }
      },
      required: ['name']
    }
  }
};


// 获得绘制特定几何图形的更多提示信息.
const shape_prompt: OpenAI.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'shape_prompt',
    description: '当用户想作一个几何图形, 但没有给出具体的点坐标时, 使用此工具获取更详细的提示信息.',
    parameters: {
      type: 'object',
      properties: {
        shape: {
          type: 'string',
          description: `几何图形的名称, 如 "triangle", "平行四边形", "rectangle"  等.`
        }
      },
      required: ['shape']
    }
  }
};

// 创建特殊三角形: 等腰,等边,直角,等腰直角 等.
const create_special_triangle: OpenAI.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'create_special_triangle',
    description: '创建特殊三角形: 等腰,等边,直角,等腰直角 等三角形. 根据 detail_prompts 提供的额外指导信息进行调用.',
    parameters: {
      type: 'object',
      properties: {
        type: { type: 'string', description: '特殊三角形的类型' },
        p1: { type: 'string', description: '三角形的一个顶点' },
        p2: { type: 'string', description: '三角形的另一个顶点' },
        h: { type: 'number', description: '三角形的高度' }
      },
      required: ['type']
    },
  }
};

// 根据底边两个顶点和高度比, 创建等腰三角形的顶点(apex):
const create_isotri_apex: OpenAI.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'create_isotri_apex',
    description: '根据底边两个顶点和高度比, 创建等腰三角形的顶点(apex). 根据 detail_prompts 提供的额外指导信息进行调用.',
    parameters: {
      type: 'object',
      properties: {
        p1: { type: 'string', description: '顶点(apex)的名字' },
        p2: { type: 'string', description: '底边顶点1' },
        p3: { type: 'string', description: '底边顶点2' },
        hr: { type: 'number', description: '高度与底边长度的比, 一般取 1.05~1.2 之间的数' },
      }
    }
  }
};

// 创建平行四边形第4个顶点
const create_parallelogram: OpenAI.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'create_parallelogram',
    description: '创建平行四边形. 根据 detail_prompts 提供的额外指导信息进行调用.',
    parameters: {
      type: 'object',
      properties: {
        p1: { type: 'string', description: '四边形的顶点1' },
        p2: { type: 'string', description: '四边形的顶点2' },
        p3: { type: 'string', description: '四边形的顶点3' },
        p4: { type: 'string', description: '四边形的顶点4 的名字' },
      }
    }
  }
};

/** 导出可用的几何的 function-tool */
export const GeoTools: OpenAI.ChatCompletionTool[] = [
  get_point_number,
  create_point,
  create_midpoint,
  create_glider,

  create_segment,
  create_line,
  create_ray,

  split_point2,
  split_point3,

  create_parallel,
  create_perpendicular,
  create_bisector,

  create_circle,

  create_intersection,

  delete_point,
  delete_segment,

  shape_prompt,
  // create_special_triangle,
  create_isotri_apex,
  create_parallelogram,

];
