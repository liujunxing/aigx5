
// import TestJotai from "./debug/TestJotai";
// import TestAglib from "./debug/TestAglib";
import { DebuggerHeader } from "./debug/DebuggerHeader";
// @ts-ignore
import { TestMUI } from "./debug/TestMUI";
import { TestJXG } from "./debug/TestJGX";



export function Debugger() {

  return (
    <>
      <DebuggerHeader />
      <TestJXG />
      {/* <TestMUI /> */}
    </>
  )
}
