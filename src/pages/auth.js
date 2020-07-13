import React from "react"
import { Router } from "@reach/router"
import Layout from "../components/layout"
import PrivateRoute from "../components/private-route"
import Admin from "../components/auth-pages/admin"

const App = () => (
  <Layout>
    <Router>
      <PrivateRoute path="/auth/admin" component={Admin} />
    </Router>
  </Layout>
)

export default App
