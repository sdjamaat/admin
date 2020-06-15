import React, { useState, useEffect, useContext } from "react"
import { Tabs, Card, Table, Modal, Form, Input, InputNumber } from "antd"
import { AuthContext } from "../../../../provider/auth-context"
import firebase from "gatsby-plugin-firebase"
import SingleAccountCard from "./single-account-card"
import SingleAdminAccountCard from "./single-admin-acct-card"
import styled from "styled-components"
const { TabPane } = Tabs

const ManageAccounts = () => {
  const { currUser } = useContext(AuthContext)

  const [users, setUsers] = useState([])
  const [admins, setAdmins] = useState([])

  const sortUsers = (a, b) => {
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
    let updatedUsers = []
    let updatedAdmins = []
    if (currUser.permissions.users.manage_accounts) {
      firebase
        .firestore()
        .collection("users")
        .onSnapshot(userQuerySnapshot => {
          updatedUsers = []
          userQuerySnapshot.forEach(doc => {
            updatedUsers.push(doc.data())
          })
          setUsers(updatedUsers.sort(sortUsers))
        })
    }
    if (currUser.permissions.users.manage_admins) {
      firebase
        .firestore()
        .collection("admins")
        .onSnapshot(userQuerySnapshot => {
          updatedAdmins = []
          userQuerySnapshot.forEach(doc => {
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
        <Tabs>
          <TabPane tab="Users" key="1">
            {users.map((user, index) => {
              return <SingleAccountCard user={user} key={index} />
            })}
          </TabPane>
          {currUser.permissions.users.manage_admins && (
            <TabPane tab="Admins" key="2">
              {admins.map((admin, index) => {
                return <SingleAdminAccountCard key={index} admin={admin} />
              })}
            </TabPane>
          )}
        </Tabs>
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
