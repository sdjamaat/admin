import React, { useState, useContext } from "react"
import {
  Collapse,
  Tabs,
  Card,
  Table,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
} from "antd"
import { Row, Col, Button } from "react-bootstrap"
import styled from "styled-components"
import { AuthContext } from "../../../../provider/auth-context"
import { onFinishFailed } from "../../../../functions/forms"
import firebase from "gatsby-plugin-firebase"

const { Panel } = Collapse
const { Option } = Select
const { confirm } = Modal

const showAdminDeleteModal = (currUserUID, adminAccount) => {
  confirm({
    title: `Are you sure you want to delete this admin account: ${adminAccount.name}?`,
    onOk: async () => {
      try {
        const deleteAdmin = firebase
          .functions()
          .httpsCallable("deleteAdminAccount")
        await deleteAdmin({
          user: {
            uid: adminAccount.uid,
          },
          caller: {
            uid: currUserUID,
          },
        })
      } catch (error) {
        console.log(error)
      }
    },
    onCancel() {
      console.log("cancel")
    },
  })
}

const EditAdminModal = ({ visible, admin, setVisible }) => {
  const [form] = Form.useForm()
  const [confirmLoading, setConfirmLoading] = useState(false)

  const onOk = async () => {
    setConfirmLoading(true)
    form.submit()
  }

  const onFinish = async values => {
    console.log(values)
    await firebase.firestore().collection("admins").doc(admin.uid).update({
      name: values.name,
      permissions: values.permissions,
    })
    setConfirmLoading(false)
    form.resetFields()
    setVisible(false)
  }

  const onCancel = () => {
    form.resetFields()
    setConfirmLoading(false)
    setVisible(false)
  }

  return (
    <Modal
      title={`Edit ${admin.email}`}
      visible={visible}
      onOk={onOk}
      onCancel={onCancel}
      okText="Submit"
      confirmLoading={confirmLoading}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        onFinishFailed={() => {
          onFinishFailed(form)
          setConfirmLoading(false)
        }}
        initialValues={admin}
      >
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: "Please input name" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name={["permissions", "users", "manage_accounts"]}
          label="Manage User Accounts"
          rules={[{ required: true }]}
        >
          <Select style={{ width: "100%" }}>
            <Option value={true}>True</Option>
            <Option value={false}>False</Option>
          </Select>
        </Form.Item>
        <Form.Item
          name={["permissions", "users", "manage_admins"]}
          label="Manage Admin Accounts"
          rules={[{ required: true }]}
        >
          <Select style={{ width: "100%" }}>
            <Option value={true}>True</Option>
            <Option value={false}>False</Option>
          </Select>
        </Form.Item>
        <Form.Item
          name={["permissions", "fmb"]}
          label="Faiz-ul-Mawaid"
          rules={[{ required: true }]}
        >
          <Select style={{ width: "100%" }}>
            <Option value={true}>True</Option>
            <Option value={false}>False</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  )
}

const SingleAdminAccountCard = ({ admin }) => {
  const { currUser } = useContext(AuthContext)

  const [editAdminModalVisible, setEditAdminModalVisible] = useState(false)

  return (
    <SingleAdminAccountCardWrapper>
      <Card
        style={{ marginBottom: "1rem" }}
        bodyStyle={{
          paddingTop: ".5rem",
          paddingTop: "1rem",
          paddingBottom: "1rem",
        }}
      >
        <h5>
          {admin.name}{" "}
          {currUser.email === admin.email ? (
            <span style={{ color: "gray" }}> - Current User</span>
          ) : (
            ""
          )}
        </h5>
        <p>{admin.email}</p>
        <Collapse style={{ padding: "-10px" }}>
          <Panel header="Permissions" key="1">
            <ul style={{ paddingLeft: "1.6rem", marginBottom: ".5rem" }}>
              <li>
                Manage User Accounts:{" "}
                {admin.permissions.users.manage_accounts ? "True" : "False"}
              </li>
              <li>
                Manage Admin Accounts:{" "}
                {admin.permissions.users.manage_admins ? "True" : "False"}
              </li>
              <li>
                Faiz-ul-Mawaid: {admin.permissions.fmb ? "True" : "False"}
              </li>
            </ul>
          </Panel>
        </Collapse>
        {currUser.email !== admin.email && (
          <Row style={{ marginTop: ".7rem" }}>
            <Col xs={6} className="btn-col">
              <Button
                variant="outline-danger"
                onClick={() => showAdminDeleteModal(currUser.uid, admin)}
              >
                Delete
              </Button>
            </Col>
            <Col xs={6}>
              <Button
                variant="outline-warning"
                onClick={() => setEditAdminModalVisible(true)}
              >
                Edit
              </Button>
            </Col>
          </Row>
        )}
      </Card>
      <EditAdminModal
        visible={editAdminModalVisible}
        setVisible={setEditAdminModalVisible}
        admin={admin}
      />
    </SingleAdminAccountCardWrapper>
  )
}

const SingleAdminAccountCardWrapper = styled.div`
  .ant-collapse > .ant-collapse-item > .ant-collapse-header {
    padding-top: 0.3rem;
    padding-bottom: 0.3rem;
  }
  .ant-card {
    h5 {
      margin-bottom: 5px;
    }
    p {
      margin-bottom: 10px;
    }
  }

  .btn {
    font-size: 1.1rem;
    width: 100%;

    padding-bottom: 0.2rem;
    padding-top: 0.2rem;
  }

  .btn-outline-success:hover {
    background-color: inherit !important;
    color: #28a745 !important;
  }

  .btn-outline-warning:hover {
    background-color: inherit !important;
    color: #ffc107 !important;
  }

  .btn-outline-secondary:hover {
    background-color: inherit !important;
    color: #6c757d !important;
  }

  .btn-outline-danger:hover {
    background-color: inherit !important;
    color: #dc3545 !important;
  }
`

export default SingleAdminAccountCard
