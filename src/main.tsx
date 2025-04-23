import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./index.css"
import { initializeAxiosInterceptors } from "./services/api"

// Initialize axios interceptors for handling auth tokens and errors
initializeAxiosInterceptors()

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
