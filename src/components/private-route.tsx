import React, { useContext } from "react"
import { useNavigate } from "react-router-dom"
import { AuthContext } from "../provider/auth-context"

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate()
  const { isLoggedIn, signOut, currUser, verifyAuthUser } = useContext(AuthContext)

  if (!isLoggedIn || verifyAuthUser() === null) {
    signOut()
    return null
  } else if (!currUser.admin) {
    navigate("/")
    return null
  }

  return <>{children}</>
}
export default PrivateRoute
