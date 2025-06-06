import { useState, useRef, useEffect, useCallback } from "react";
import { Canvas, PencilBrush, FabricImage } from "fabric";
import { Button, Typography } from '@mui/material';
import { DoubaoAI } from "./ai/doubao_vision";
// @ts-ignore
import prob4 from "./assets/p4_3a.png";


// 参见: https://fabricjs.com/demos/free-drawing/


const SystemPrompt = `
你是一个专业的试卷判题专家.

将发送给你一个图片, 含有试题和学生的手写回答, 试题原文是黑色的, 学生回答的是其它颜色(如红色)的.

给出每个小题/每个空的正确答案, 学生回答, 并判断和解析该小题/空是否回答正确. 
`.trim();

export function FabricApp() {
  const refCanvasEl = useRef<HTMLCanvasElement>(null);
  const refInited = useRef(false);
  const refCanvas = useRef<Canvas>(null);
  const [analyze, setAnalyze] = useState('');

  useEffect(() => { 
    if (refInited.current) return;  // 避免重复初始化
    const canvasEl = refCanvasEl.current;
    if (!canvasEl) return;

    // console.info('try to create fabric canvas ...');
    // creates fabric canvas that is mounted on div.
    const canvas = new Canvas(canvasEl, { 
      width: 600, height: 600, 
      // backgroundColor: '#eef0d0', 
      selection: false, 
      isDrawingMode: true,
    });
    console.info(`fabric canvas: `, canvas);
    (window as any).fabric = canvas;

    refCanvas.current = canvas;

    canvas.freeDrawingBrush = new PencilBrush(canvas);
    canvas.freeDrawingBrush.color = 'red';
    canvas.freeDrawingBrush.width = 5;

    _init_image();

    canvas.renderAll();

    refInited.current = true;
  }, [refCanvasEl.current]);


  const clear = () => {
    if (refCanvas.current) {
      refCanvas.current.clear();
      _init_image();
    }
  };
  const colorRed = () => {
    if (refCanvas.current?.freeDrawingBrush)
      refCanvas.current.freeDrawingBrush.color = 'red';
  };
  const colorBlue = () => { 
    if (refCanvas.current?.freeDrawingBrush)
      refCanvas.current.freeDrawingBrush.color = 'blue';
  };
  const colorGreen = () => { 
    if (refCanvas.current?.freeDrawingBrush)
      refCanvas.current.freeDrawingBrush.color = 'green';
  };

  const _init_image = () => {
    const canvas = refCanvas.current;
    if (canvas) {
      // 这里 prob4 等是一个链接(如 './xxx.png', 'https://xxx.com/yyy.png' )
      FabricImage.fromURL(prob4, { crossOrigin: 'anonymous' }).then((image) => {
        // globalImage = image;
        // image.scaleToWidth(480);
        // image.applyFilters();
        canvas.add(image);
        canvas.setDimensions({ width: image.width, height: image.height });
      });
    }
  };

  // @ts-ignore
  const undo = () => { 
    if (refCanvas.current) {
      // 不易实现... refCanvas.current.undo()
    }
  };

  const callAI = async () => {
    if (!refCanvas.current) return;
    console.info(`callAI() ......`);

    const imageUrl = refCanvas.current.toDataURL({ multiplier: 1, format: 'png' });
    console.info(`imageUrl : `, imageUrl);

    // 1. 组装消息 
    const messages: any[] = [
      { role: 'system', content: SystemPrompt },
      {
        role: 'user',  
        content: [
          { type: 'image_url', image_url: imageUrl }
        ]
      },
    ];
    console.info(`messages: `, messages);

    const ai = new DoubaoAI();
    const response = await ai.create(messages);

    console.info(`response: `, response);
    setAnalyze(response?.choices[0]?.message?.content ?? '');
  };

  const on_image_input_change = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = ((e as any).target as HTMLInputElement).files?.[0];
    if (!file) return;

    console.info(`input.onchange file is: `, file);

    const reader = new FileReader();

    reader.onload = (event) => {
      const imgElement = new Image();
      imgElement.onload = () => { 
        const fabricImage = new FabricImage(imgElement);
        console.info(`imgElement.onload fabricImage is: `, { fabricImage, imgElement, reader, event });
        const canvas = refCanvas.current!;
        canvas.clear();

        canvas.add(fabricImage);
        canvas.setDimensions({ width: fabricImage.width, height: fabricImage.height });
        canvas.renderAll();
      };
      imgElement.src = event.target.result as string;
    };

    reader.readAsDataURL(file);
  }, []);

  const load_image = async () => {
    const canvas = refCanvas.current;
    if (!canvas) return;

    const input = document.getElementById('imageLoader') as HTMLInputElement;
    if (!input) return;

    // console.log('load_image ... ', { input, canvas })
    input.click();
  };

  // 获取 image 的数据, output to console and save to a local file for debugging
  const save_image = async () => {
    if (!refCanvas.current) return;

    const idata = refCanvas.current.toDataURL({ multiplier: 1, format: 'png' });
    console.info(`idata : `, idata);

    // save to file 
    const link = document.createElement('a');
    link.href = idata;
    link.download = 'fabric_canvas.png';
    link.click();
    link.remove();
  };

  const tmp = () => { }; 


  return (
    <div>
      <Typography variant="h4">Fabric Canvas Test</Typography>
      <div id="fabric_container" className="flex flex-row">
        <div style={{ backgroundColor: '#eeffd090' }}>
          <canvas ref={refCanvasEl} width={600} height={600}></canvas>
        </div>
        <div style={{ width: '*' }}>
          <Typography variant="h5">Buttons</Typography>
          <div>
            <Button variant="contained" onClick={load_image}>Load-PNG</Button>
            <Button variant="contained" onClick={save_image}>Save-PNG</Button>
            <Button variant="contained" onClick={clear}>Clear</Button>
            {/* <Button variant="contained" onClick={undo}>Undo</Button> */}
            <Button variant="contained" onClick={callAI}>Call AI</Button>
            <br/>

            <Button variant="contained" onClick={colorRed}>RED</Button>
            <Button variant="contained" onClick={colorBlue}>BLUE</Button>
            <Button variant="contained" onClick={colorGreen}>GREEN</Button>
            <br />
            
          </div>

          <Typography variant="h5">Info</Typography>
          <div>
            <pre>{analyze}</pre>
          </div>
        </div>
      </div>
      { /* a hidden input for loading image */}
      <input onChange={on_image_input_change} type="file" id="imageLoader" accept="image/*" style={{ display: 'none' }} />
    </div>
  )
}
