import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { ConfigProvider } from "antd"
import App from "./App"
import { DateProvider } from "./provider/date-context"
import { AuthProvider } from "./provider/auth-context"
import "mapbox-gl/dist/mapbox-gl.css"
import "bootstrap/dist/css/bootstrap.css"
import "./index.css"

const antdTheme = {
  token: {
    colorPrimary: "#4169e1",
    fontFamily: "'Cormorant Garamond', sans-serif",
    fontSize: 18,
    borderRadius: 4,
    colorLink: "#1890ff",
    colorSuccess: "#52c41a",
    colorWarning: "#faad14",
    colorError: "#f5222d",
  },
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfigProvider theme={antdTheme}>
        <DateProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </DateProvider>
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>
)
