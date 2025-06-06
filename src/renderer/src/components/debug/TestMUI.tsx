// @ts-ignore
import React from 'react';
// @ts-ignore
import { Button, Typography } from '@mui/material';
import Split from 'react-split';
import "./split.css";

// 测试所需的 MUI 功能.
export function TestMUI() {
  return (
    <>
      <Splitter />
      <Buttons />
    </>
  )
}


// @ts-ignore "测试 react-split 功能"
function Splitter() {
  return (
    <Split sizes={[55, 45]} minSize={[400, 300]} direction="horizontal" className="split" gutterSize={6}>
      <div className="left-pane">
        Left
      </div>
      <div className="right-pane">
        Right
      </div>
    </Split>
  )
}

// @ts-ignore "测试几种样子的 button"
function Buttons() {
  return (
    <>
      <Button variant="text">text</Button>
      <Button variant="contained">contained</Button>
      <Button variant="outlined">outlined</Button>
    </>
  ); 
}
