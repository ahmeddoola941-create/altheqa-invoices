import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// العمل من غير إنترنت (بيشتغل بس على النسخة المنشورة https)
if ('serviceWorker' in navigator && import.meta.env.PROD && import.meta.env.VITE_NO_SW !== '1') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
