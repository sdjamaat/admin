import React, { useState, useEffect, useContext } from "react"
import { Tabs, Card, Table, Modal, Form, Input, InputNumber } from "antd"
import { AuthContext } from "../../../../provider/auth-context"
import { db } from "../../../../lib/firebase"
import { collection, onSnapshot } from "firebase/firestore"
import SingleAccountCard from "./single-account-card"
import SingleAdminAccountCard from "./single-admin-acct-card"
import styled from "styled-components"

const ManageAccounts = () => {
  const { currUser } = useContext(AuthContext)

  const [users, setUsers] = useState([])
  const [admins, setAdmins] = useState([])

  const sortUsers = (a: any, b: any) => {
    const name1 = a.lastname.toUpperCase()
    const name2 = b.lastname.toUpperCase()

    let comparison = 0
    if (name1 > name2) {
      comparison = 1
    } else if (name1 < name2) {
      comparison = -1
    }
    return comparison
  }

  useEffect(() => {
    // get users
    let updatedUsers: any[] = []
    let updatedAdmins: any[] = []
    if (currUser.permissions.manage_user_accounts) {
      onSnapshot(collection(db, "users"), (userQuerySnapshot: any) => {
        updatedUsers = []
        userQuerySnapshot.forEach((doc: any) => {
          updatedUsers.push(doc.data())
        })
        setUsers(updatedUsers.sort(sortUsers))
      })
    }
    if (currUser.permissions.manage_admin_accounts) {
      onSnapshot(collection(db, "admins"), (userQuerySnapshot: any) => {
        updatedAdmins = []
        userQuerySnapshot.forEach((doc: any) => {
          updatedAdmins.push(doc.data())
        })
        setAdmins(updatedAdmins)
      })
    }
  }, [])

  return (
    <ManageAccountsWrapper>
      <Card
        title="Account Management"
        headStyle={{
          fontSize: "1.5rem",
          textAlign: "center",
        }}
        bodyStyle={{ paddingTop: ".5rem" }}
      >
        <Tabs
          items={[
            {
              label: "Users",
              key: "1",
              children: (
                <>
                  {users.map((user: any, index: number) => {
                    return <SingleAccountCard user={user} key={index} />
                  })}
                </>
              ),
            },
            ...(currUser.permissions.manage_admin_accounts
              ? [
                  {
                    label: "Admins",
                    key: "2",
                    children: (
                      <>
                        {admins.map((admin: any, index: number) => {
                          return <SingleAdminAccountCard key={index} admin={admin} />
                        })}
                      </>
                    ),
                  },
                ]
              : []),
          ]}
        />
      </Card>
    </ManageAccountsWrapper>
  )
}

const ManageAccountsWrapper = styled.div`
  max-width: 1000px;
  margin: auto;
  .ant-tabs-tab {
    outline: none;
  }
`

export default ManageAccounts
