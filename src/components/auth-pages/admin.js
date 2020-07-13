import React, { useState, useContext } from "react"
import { Menu, Divider, Select, Form } from "antd"
import { Row, Col } from "react-bootstrap"
import useWindowDimensions from "../../custom-hooks/window-dimentions"
import styled from "styled-components"
import StickyBox from "react-sticky-box"
import CreateMenu from "../admin/fmb/create-menu/create-menu"
import ManageMenus from "../admin/fmb/manage-menus/manage-menus"
import AddAdminUser from "../admin/users/add-admin-user/add-admin-user"
import ManageAccounts from "../admin/users/manage-accounts/manage-accounts"
import ViewSubmissions from "../admin/fmb/view-submissions/view-submissions"
import ManageEnrollments from "../admin/fmb/manage-enrollments/manage-enrollments"
import CustomMessage from "../custom-message"
import { AuthContext } from "../../provider/auth-context"
import firebase from "gatsby-plugin-firebase"
const momentHijri = require("moment-hijri")
const { SubMenu } = Menu
const { Option, OptGroup } = Select

const AdminMenu = ({
  handleChangePageDesktop,
  handleChangePageMobile,
  currMenuItem,
}) => {
  const { width } = useWindowDimensions()
  const { currUser } = useContext(AuthContext)

  const [currMenuKey, setCurrMenuKey] = useState(["users"])

  const handleMenuOpenClose = value => {
    setCurrMenuKey(value)
  }

  const FullMenu = () => {
    return (
      <Menu
        onSelect={handleChangePageDesktop}
        openKeys={currMenuKey}
        onOpenChange={handleMenuOpenClose}
        selectedKeys={[currMenuItem]}
        mode={width > 991 && "inline"}
      >
        {currUser.permissions.manage_user_accounts && (
          <SubMenu key="users" title="Users">
            <Menu.Item key="users-manage-accounts">Manage Accounts</Menu.Item>
            {currUser.permissions.manage_admin_accounts && (
              <Menu.Item key="users-add-admin-user">Add Admin User</Menu.Item>
            )}
          </SubMenu>
        )}

        {currUser.permissions.fmb && (
          <SubMenu key="fmb" title="Faiz-ul-Mawaid">
            <Menu.Item key="fmb-create-menu">Create Menu</Menu.Item>
            <Menu.Item key="fmb-manage-menus">Manage Menus</Menu.Item>
            <Menu.Item key="fmb-view-submissions">View Submissions</Menu.Item>
            <Menu.Item key="fmb-manage-enrollments">
              Manage Enrollments
            </Menu.Item>
          </SubMenu>
        )}
      </Menu>
    )
  }

  const SelectDropdownMenu = () => {
    return (
      <>
        <Row style={{ marginBottom: "2rem" }}>
          <Col xs={2}>
            <div style={{ textAlign: "center", fontSize: "1.2rem" }}>Page:</div>
          </Col>

          <Col xs={10}>
            <Form initialValues={{ mobilemenuitem: currMenuItem }}>
              <Form.Item name="mobilemenuitem">
                <Select
                  style={{ width: "100%" }}
                  onChange={e => handleChangePageMobile(e)}
                >
                  {currUser.permissions.manage_user_accounts && (
                    <OptGroup label="Users">
                      <Option value="users-manage-accounts">
                        Manage Accounts
                      </Option>
                      {currUser.permissions.manage_admin_accounts && (
                        <Option value="users-add-admin-user">
                          Add Admin User
                        </Option>
                      )}
                    </OptGroup>
                  )}

                  {currUser.permissions.fmb && (
                    <OptGroup label="Faiz-ul-Mawaid">
                      <Option value="fmb-create-menu">Create Menu</Option>
                      <Option value="fmb-manage-menus">Manage Menus</Option>
                      <Option value="fmb-view-submissions">
                        View Submissions
                      </Option>
                      <Option value="fmb-manage-enrollments">
                        Manage Enrollments
                      </Option>
                    </OptGroup>
                  )}
                </Select>
              </Form.Item>
            </Form>
          </Col>
        </Row>
      </>
    )
  }

  if (width <= 991) {
    return <SelectDropdownMenu />
  } else {
    return (
      <StickyBox offsetTop={30}>
        <FullMenu />
      </StickyBox>
    )
  }
}

const Admin = () => {
  const [page, setPage] = useState("users-manage-accounts")
  const [menus, setMenus] = useState([])

  const [
    shouldFetchMenusFromFirebase,
    setShouldFetchMenusFromFirebase,
  ] = useState(true)

  const handleChangePageDesktop = event => {
    setPage(event.key)
  }

  const handleChangePageMobile = value => {
    setPage(value)
  }

  const getMenus = async () => {
    if (shouldFetchMenusFromFirebase) {
      let updatedMenus = []
      const currentHijriYear = momentHijri().iYear()
      try {
        const queryForFmbHijriDoc = firebase
          .firestore()
          .collection("fmb")
          .doc(currentHijriYear.toString())

        const yearCollection = await queryForFmbHijriDoc.get()
        if (yearCollection.exists) {
          const menusFromFirebase = await queryForFmbHijriDoc
            .collection("menus")
            .get()

          menusFromFirebase.forEach(doc => {
            let formattedDocData = {
              ...doc.data(),
              year:
                doc.id === "moharram" ? currentHijriYear + 1 : currentHijriYear,
              month: doc.id,
            }
            updatedMenus.push(formattedDocData)
          })
        } else {
          CustomMessage("error", "Could not fetch menus")
        }
      } catch (error) {
        console.log("Error getting documents", error)
      }
      setMenus(updatedMenus)
      setShouldFetchMenusFromFirebase(false)
      return updatedMenus
    } else {
      return menus
    }
  }

  const getPage = page => {
    switch (page) {
      case "fmb-create-menu":
        return (
          <CreateMenu
            setPage={setPage}
            refetchMenus={setShouldFetchMenusFromFirebase}
          />
        )
      case "fmb-manage-menus":
        return (
          <ManageMenus
            getMenus={getMenus}
            refetchMenus={setShouldFetchMenusFromFirebase}
            setMenusInAdminComp={setMenus}
          />
        )
      case "fmb-view-submissions":
        return <ViewSubmissions />
      case "fmb-manage-enrollments":
        return <ManageEnrollments />
      case "users-manage-accounts":
        return <ManageAccounts />
      case "users-add-admin-user":
        return <AddAdminUser setPage={setPage} />

      default:
        return <div>Welcome to the Admin Panel</div>
    }
  }

  return (
    <AdminWrapper>
      <Row>
        <Col style={{ marginBottom: "-1.5rem" }} lg={3}>
          <div className="header" style={{ textAlign: "center" }}>
            <h2>Admin Panel</h2>
          </div>
          <Divider className="divider-header-content" />
          <AdminMenu
            handleChangePageDesktop={handleChangePageDesktop}
            handleChangePageMobile={handleChangePageMobile}
            currMenuItem={page}
          />
        </Col>
        <Col className="page-content" lg={9}>
          {getPage(page)}
        </Col>
      </Row>
    </AdminWrapper>
  )
}

const AdminWrapper = styled.div`
  .divider-header-content {
    margin-top: 1rem;
    margin-bottom: 2rem;
    @media only screen and (min-width: 991px) {
      display: none;
    }
  }
  .header {
    margin: 1rem;
    margin-bottom: 1rem;
    @media only screen and (min-width: 991px) {
      margin: 1.7rem 0rem 1.7rem 0rem;
      h2 {
        font-size: 1.8rem;
      }
    }
  }

  .page-content {
    @media only screen and (min-width: 991px) {
      margin-top: 1.7rem;
    }
  }
`

export default Admin
