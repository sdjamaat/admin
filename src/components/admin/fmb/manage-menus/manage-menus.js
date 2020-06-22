import React, { useState, useEffect } from "react"
import { Alert, message, Card, Divider, Modal } from "antd"
import styled from "styled-components"
import SingleMenu from "./single-menu"
import { cloneDeep } from "lodash"
import firebase from "gatsby-plugin-firebase"
import CustomMessage from "../../../custom-message"
const momentHijri = require("moment-hijri")
const { confirm } = Modal

const DisplaySortedMenus = ({ menus, showConfirmationModal }) => {
  const getActiveMenus = menus.filter(x => x.status === "active")
  const getQueuedMenus = menus.filter(x => x.status === "queued")
  const getArchivedMenus = menus.filter(x => x.status === "archived")
  return (
    <>
      <Divider style={{ marginTop: 0 }} orientation="left">
        Accepting Submissions
      </Divider>
      {getActiveMenus.length > 0 ? (
        getActiveMenus.map((menu, index) => {
          if (menu.status === "active") {
            return (
              <SingleMenu
                menu={menu}
                tagColor="green"
                tagName="Active"
                key={index}
                showConfirmationModal={showConfirmationModal}
              />
            )
          } else {
            return null
          }
        })
      ) : (
        <Alert
          message="No active menus"
          type="info"
          style={{ textAlign: "center", marginBottom: "1rem" }}
        />
      )}
      <Divider style={{ marginTop: 0 }} orientation="left">
        Queued
      </Divider>

      {getQueuedMenus.length > 0 ? (
        getQueuedMenus.map((menu, index) => {
          if (menu.status === "queued") {
            return (
              <SingleMenu
                menu={menu}
                tagColor="gold"
                tagName="Queued"
                key={index}
                showConfirmationModal={showConfirmationModal}
              />
            )
          } else {
            return null
          }
        })
      ) : (
        <Alert
          message="No queued menus"
          type="info"
          style={{ textAlign: "center", marginBottom: "1rem" }}
        />
      )}
      <Divider style={{ marginTop: 0 }} orientation="left">
        Archived
      </Divider>
      {getArchivedMenus.length > 0 ? (
        getArchivedMenus.map((menu, index) => {
          if (menu.status === "archived") {
            return (
              <SingleMenu
                menu={menu}
                tagColor="default"
                tagName="Archived"
                key={index}
                showConfirmationModal={showConfirmationModal}
              />
            )
          } else {
            return null
          }
        })
      ) : (
        <Alert
          message="No archived menus"
          type="info"
          style={{ textAlign: "center" }}
        />
      )}
    </>
  )
}

const ManageMenus = ({ getMenus, setMenusInAdminComp }) => {
  const [menusFromAdminComp, setMenusFromAdminComp] = useState(null)

  const showConfirmationModal = (
    text,
    month,
    isDeactivating = false,
    isDeleting = false
  ) => {
    confirm({
      title: `Are you sure you want to ${text} this menu? ${
        isDeactivating
          ? " Users will no longer be able to submit their thaali preferences for this month."
          : ""
      }`,
      onOk: async () => {
        try {
          let newStatus = null
          if (text === "activate") {
            // check if an active menu already exists
            const doesActiveMenuAlreadyExist = menusFromAdminComp.filter(
              x => x.status === "active"
            )
            if (doesActiveMenuAlreadyExist.length > 0) {
              CustomMessage(
                "error",
                "An active menu already exists. Cannot have multiple active menus"
              )
              return
            }

            newStatus = "active"
          } else if (text === "archive" || text === "deactivate") {
            newStatus = "archived"
          } else {
            newStatus = "queued"
          }

          let newMenu = cloneDeep(menusFromAdminComp)

          if (!isDeleting) {
            await firebase
              .firestore()
              .collection("fmb")
              .doc(momentHijri().iYear().toString())
              .collection("menus")
              .doc(month)
              .update({
                status: newStatus,
              })
            if (newStatus === "active" || isDeactivating) {
              await firebase
                .firestore()
                .collection("fmb")
                .doc(momentHijri().iYear().toString())
                .update({
                  activeMenu: isDeactivating ? null : month,
                })
            }

            for (let menu of newMenu) {
              if (menu.month === month) {
                menu.status = newStatus
              }
            }
          } else {
            await firebase
              .firestore()
              .collection("fmb")
              .doc(momentHijri().iYear().toString())
              .update({
                finished: firebase.firestore.FieldValue.arrayRemove(month),
              })

            await firebase
              .firestore()
              .collection("fmb")
              .doc(momentHijri().iYear().toString())
              .collection("menus")
              .doc(month)
              .delete()

            newMenu = newMenu.filter(x => x.month !== month)
          }

          // set updated state in admin component
          // we don't need to retrieve new state from firebase this way
          setMenusInAdminComp(newMenu)

          // set state in this component
          setMenusFromAdminComp(newMenu)
        } catch (error) {
          console.log(error)
        }
      },
      onCancel() {
        console.log("cancel")
      },
    })
  }

  const initializeViewMenusComp = async () => {
    const fetchedMenus = await getMenus()
    setMenusFromAdminComp(fetchedMenus)
  }

  useEffect(() => {
    initializeViewMenusComp()
  }, [])

  const displayMenus = menus => {
    if (menus === null) {
      return <div>Loading...</div>
    } else if (menus.length === 0) {
      return (
        <Alert message="No menus to display for current year" type="warning" />
      )
    } else {
      return (
        <DisplaySortedMenus
          menus={menus}
          showConfirmationModal={showConfirmationModal}
        />
      )
    }
  }

  return (
    <>
      <ManageMenusWrapper>
        <Card
          title="Manage Menus"
          headStyle={{ fontSize: "1.5rem", textAlign: "center" }}
        >
          {displayMenus(menusFromAdminComp)}
        </Card>
      </ManageMenusWrapper>
    </>
  )
}

const ManageMenusWrapper = styled.div`
  max-width: 1000px;
  margin: auto;

  .ant-divider-horizontal.ant-divider-with-text-left::before {
    width: 0%;
  }

  .ant-divider-horizontal.ant-divider-with-text-left::after {
    width: 100%;
  }

  .ant-divider-inner-text {
    padding-left: 0;
  }
`

export default ManageMenus
