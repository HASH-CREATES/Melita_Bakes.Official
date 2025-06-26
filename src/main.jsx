import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'  // <-- ADD THIS
import App from './App'
import './App.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>  {/* <-- WRAP APP WITH THIS */}
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
