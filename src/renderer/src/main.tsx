import './assets/main.css';
import "./assets/jsxgraph.css";
import "jsxgraph";


import { createRoot } from 'react-dom/client'
// @ts-ignore
import { StrictMode } from 'react'
import { App } from './App'



createRoot(document.getElementById('root')!).render(
  // <StrictMode>
    <App />
  // </StrictMode>
)
