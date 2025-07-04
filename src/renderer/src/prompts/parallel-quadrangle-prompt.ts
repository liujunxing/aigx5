const parallel_quadrangle_prompt = `
## 创建平行四边形的步骤

1. 首先用户需要给出平行四边形的四个顶点的名字, 如 'ABCD'. 如果用户没有给出, 则使用 'ABCD' 做为缺省的名字.
2. 根据名字, 分解为四个顶点, 如 'ABCD' 分解为 顶点1='A', 顶点2='B', 顶点3='C', 顶点4='D'.
3. 这四个顶点中, 只有前三个顶点(顶点1, 顶点2, 顶点3)是自由的, 而 顶点4 是根据前三个确定的.
  例如 'ABCD' 中的 'D' 是根据 'A','B','C' 确定位置的.
4. 先使用 create_point() 函数创建前三个自由顶点, 如 'ABCD' 中的 顶点1('A'), 顶点2('B'), 顶点3('C'). 从下面的坐标中选择一组:
  * 顶点1(-12.16, -3.01), 顶点2(9.25, -2.79), 顶点3(-7.77, 8.33)
  * 顶点1(-13.16, -4.01), 顶点2(10.25, -3.79), 顶点3(-8.77, 9.33)
5. 使用 create_parallelogram() 创建第四个顶点, 给出四个顶点的名字做为参数, 创建出顶点4.
6. 使用函数 create_segment() 创建四条边, 分别为 (顶点1,顶点2), (顶点1,顶点3), (顶点2,顶点4), (顶点3,顶点4).
7. 创建平行四边形完成, 告知用户平行四边形 xxxx 创建成功.

`;

export function get_parallel_quadrangle_prompt() {
  return parallel_quadrangle_prompt;
}
