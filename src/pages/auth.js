import React from "react"
import { Router } from "@reach/router"
import Layout from "../components/layout"
import PrivateRoute from "../components/private-route"
import Admin from "../components/auth-pages/admin"
import Profile from "../components/auth-pages/profile"

const App = () => (
  <Layout>
    <Router>
      <PrivateRoute path="/auth/admin" component={Admin} />
      <PrivateRoute path="/auth/profile" component={Profile} />
    </Router>
  </Layout>
)

export default App
