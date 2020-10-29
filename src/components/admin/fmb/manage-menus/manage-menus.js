import React, { useState, useEffect, useContext } from "react"
import { Alert, message, Card, Divider, Modal } from "antd"
import styled from "styled-components"
import SingleMenu from "./single-menu"
import { cloneDeep } from "lodash"
import firebase from "gatsby-plugin-firebase"
import CustomMessage from "../../../custom-message"
import { DateContext } from "../../../../provider/date-context"
const moment = require("moment")
const { confirm } = Modal

const DisplaySortedMenus = ({
  menus,
  showConfirmationModal,
  editMenuItemModal,
}) => {
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
                editMenuItemModal={editMenuItemModal}
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
                editMenuItemModal={editMenuItemModal}
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
                editMenuItemModal={editMenuItemModal}
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

  const { getHijriDate } = useContext(DateContext)

  const sortMenuItemsByDate = (a, b) => {
    const item1Date = moment(a.date, "MM-DD-YYYY")
    const item2Date = moment(b.date, "MM-DD-YYYY")

    let comparison = 0
    if (item1Date.isAfter(item2Date)) {
      comparison = 1
    } else if (item1Date.isBefore(item2Date)) {
      comparison = -1
    }
    return comparison
  }

  const editMenuItemModal = async (
    menuMonth,
    itemID,
    year,
    newValues,
    isPrevMoharram = false,
    isNewItem = false,
    isDeleting = false
  ) => {
    for (let i = 0; i < menusFromAdminComp.length; i++) {
      if (
        menuMonth === menusFromAdminComp[i].month &&
        year === menusFromAdminComp[i].year
      ) {
        let newMenuItemsArr = cloneDeep(menusFromAdminComp[i])
        let shouldUpdateInFirebase = false
        if (isNewItem) {
          shouldUpdateInFirebase = true
          newMenuItemsArr.items.push({
            // set new values
            date: newValues.date.format("MM-DD-YYYY"),
            nothaali: newValues.nothaali,
            id: itemID,
            name: newValues.name,
            reasonNoThaali: newValues.reasonNoThaali || null,
          })
        } else {
          let index = 0
          for (let item of newMenuItemsArr.items) {
            if (item.id === itemID) {
              if (isDeleting) {
                newMenuItemsArr.items.splice(index, 1)
                shouldUpdateInFirebase = true
              } else {
                //check if anything has changed
                if (
                  item.date !== newValues.date.format("MM-DD-YYYY") ||
                  item.nothaali !== newValues.nothaali ||
                  item.name !== newValues.name ||
                  item.reasonNoThaali !== newValues.reasonNoThaali
                ) {
                  shouldUpdateInFirebase = true
                  // set new values
                  item.date = newValues.date.format("MM-DD-YYYY")
                  item.nothaali = newValues.nothaali
                  item.name = newValues.name
                  item.reasonNoThaali = newValues.reasonNoThaali || null
                }
              }
              continue
            }
            index = index + 1
          }
        }

        // sort by date
        newMenuItemsArr.items.sort(sortMenuItemsByDate)

        // change the menus array which contains menus from multiple months
        // we're just targeting one month, but must update the entire thing at one time
        let newAllMenusArr = cloneDeep(menusFromAdminComp)
        newAllMenusArr[i].items = newMenuItemsArr.items

        // push updates to items array in firebase
        try {
          await firebase
            .firestore()
            .collection("fmb")
            .doc(
              isPrevMoharram
                ? (getHijriDate().year - 1).toString()
                : getHijriDate().year.toString()
            )
            .collection("menus")
            .doc(menuMonth)
            .update({
              items: newMenuItemsArr.items,
            })

          // set new menus array in our component and it's parent component
          setMenusFromAdminComp(newAllMenusArr)
          setMenusInAdminComp(newAllMenusArr)
          CustomMessage(
            "success",
            isNewItem ? "Successfully added item" : "Successfully updated menu"
          )
        } catch (error) {
          console.log(error)
          CustomMessage("error", "Could not update item")
        }
      }
    }
  }

  const showConfirmationModal = (
    text,
    month,
    year,
    isDeactivating = false,
    isDeleting = false,
    isPrevMoharram = false
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
              .doc(
                isPrevMoharram
                  ? (getHijriDate().year - 1).toString()
                  : getHijriDate().year.toString()
              )
              .collection("menus")
              .doc(month)
              .update({
                status: newStatus,
              })
            if (newStatus === "active" || isDeactivating) {
              await firebase
                .firestore()
                .collection("fmb")
                .doc(
                  isPrevMoharram
                    ? (getHijriDate().year - 1).toString()
                    : getHijriDate().year.toString()
                )
                .update({
                  activeMenu: isDeactivating ? null : month,
                })
            }

            for (let menu of newMenu) {
              if (menu.month === month && menu.year === year) {
                menu.status = newStatus
              }
            }
          } else {
            await firebase
              .firestore()
              .collection("fmb")
              .doc(
                isPrevMoharram
                  ? (getHijriDate().year - 1).toString()
                  : getHijriDate().year.toString()
              )
              .update({
                finished: firebase.firestore.FieldValue.arrayRemove(month),
              })

            await firebase
              .firestore()
              .collection("fmb")
              .doc(
                isPrevMoharram
                  ? (getHijriDate().year - 1).toString()
                  : getHijriDate().year.toString()
              )
              .collection("menus")
              .doc(month)
              .delete()

            let i = 0
            for (let menu of newMenu) {
              if (menu.month === month && menu.year === year) {
                console.log(newMenu.splice(i, 1))
                continue
              }
              i = i + 1
            }
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
        <Alert
          message="No menus to display for current hijri year"
          type="warning"
        />
      )
    } else {
      return (
        <DisplaySortedMenus
          menus={menus}
          showConfirmationModal={showConfirmationModal}
          editMenuItemModal={editMenuItemModal}
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
