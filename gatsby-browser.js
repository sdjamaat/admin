import "./node_modules/mapbox-gl/dist/mapbox-gl.css"
import "./node_modules/bootstrap/dist/css/bootstrap.css"
import "firebase/app"
import "firebase/auth"
import "firebase/firestore"
import "firebase/functions"
import "firebase/storage"
import "firebase/database"

import React from "react"
import { AuthProvider } from "./src/provider/auth-context"

export const wrapRootElement = ({ element }) => (
  <AuthProvider>{element}</AuthProvider>
)
