import React, { useContext } from "react"
import { navigate } from "gatsby"
import { AuthContext } from "../provider/auth-context"

const PrivateRoute = ({ component: Component, location, path, ...rest }) => {
  const { isLoggedIn, signOut, currUser, verifyAuthUser } = useContext(
    AuthContext
  )

  if (!isLoggedIn || verifyAuthUser() === null) {
    signOut()
    return null
  } else if (location.pathname === "/auth/admin") {
    if (!currUser.admin) {
      navigate("/")
      return null
    }
  }
  return <Component {...rest} />
}
export default PrivateRoute
