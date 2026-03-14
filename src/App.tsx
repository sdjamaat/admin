import React from "react"
import { Routes, Route } from "react-router-dom"
import Login from "./pages/index"
import NotFound from "./pages/404"
import Layout from "./components/layout"
import PrivateRoute from "./components/private-route"
import Admin from "./components/auth-pages/admin"

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        path="/auth/admin"
        element={
          <PrivateRoute>
            <Layout>
              <Admin />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
