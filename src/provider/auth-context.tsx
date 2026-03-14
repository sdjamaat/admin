import React, { createContext, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { onSnapshot, doc } from "firebase/firestore"
import { signOut as firebaseSignOut } from "firebase/auth"
import { auth, db } from "../lib/firebase"
import SecureLS from "secure-ls"

const localEncryptedStore = new SecureLS({
  encodingType: import.meta.env.VITE_ENCRYPTION_TYPE,
  encryptionSecret: import.meta.env.VITE_ENCRYPTION_SECRET,
})

const defaultState = {
  isLoggedIn: false,
  setIsLoggedIn: (_value: boolean) => {},
  signOut: () => {},
  localEncryptedStore: localEncryptedStore,
  currUser: null as any,
  setCurrUser: (_user: any) => {},
  verifyAuthUser: (): any => {},
}

export const AuthContext = createContext(defaultState)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate()

  const verifyAuthUser = () => {
    try {
      const user = localEncryptedStore.get("authUser")
      if (user.length !== 0) {
        return user
      } else {
        return null
      }
    } catch (error) {
      localStorage.removeItem("authUser")
      localStorage.removeItem("_secure__ls__metadata")
      return null
    }
  }

  const [isLoggedIn, setIsLoggedIn] = useState(verifyAuthUser() !== null)

  const getAuthUser = () => {
    if (isLoggedIn) {
      return verifyAuthUser()
    } else {
      return null
    }
  }

  const [currUser, setCurrUser] = useState(getAuthUser())

  const signOut = () => {
    firebaseSignOut(auth)
      .then(() => setIsLoggedIn(false))
      .then(() => {
        localStorage.removeItem("authUser")
        localStorage.removeItem("_secure__ls__metadata")
      })
      .then(() => {
        navigate("/")
      })
  }

  useEffect(() => {
    if (currUser !== null && isLoggedIn) {
      let unsubscribe: (() => void) | undefined
      try {
        unsubscribe = onSnapshot(doc(db, "admins", currUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            const userInfo = docSnap.data()
            if (userInfo.admin === true) {
              localEncryptedStore.set("authUser", {
                admin: currUser.admin,
                uid: currUser.uid,
                name: userInfo.name,
                email: userInfo.email,
                permissions: userInfo.permissions,
              })
              setCurrUser(localEncryptedStore.get("authUser"))
            } else {
              signOut()
            }
          } else {
            signOut()
          }
        })
      } catch {
        signOut()
      }
      return () => {
        if (unsubscribe) unsubscribe()
      }
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        setIsLoggedIn,
        signOut,
        localEncryptedStore,
        currUser,
        setCurrUser,
        verifyAuthUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
