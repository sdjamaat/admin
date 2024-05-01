import React, { useEffect, useState, useContext } from "react"
import { Card, Tabs, Select, Modal, Divider, Collapse, Form, Input } from "antd"
import { Row, Col, Button } from "react-bootstrap"
import styled from "styled-components"
import firebase from "gatsby-plugin-firebase"
import { onFinishFailed } from "../../../../functions/forms"
import CustomMessage from "../../../custom-message"
const { TabPane } = Tabs

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 },
}

const ManageEnrollments = () => {
  const [editFamilyDetailsForm] = Form.useForm()
  const [families, setFamilies] = useState(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [isUpdatingFamily, setIsUpdatingFamily] = useState(false)
  const [currentlyEditingFamily, setCurrentlyEditingFamily] = useState({
    id: null,
    displayName: null,
  })

  const [codeAndThaaliSizeDisabled, setCodeAndThaaliSizeDisabled] = useState(
    false
  )

  useEffect(() => {
    firebase
      .firestore()
      .collection("families")
      .onSnapshot(docs => {
        let allFamilies = []
        docs.forEach(family => {
          const familyData = family.data()
          allFamilies.push(familyData)
        })
        setFamilies(allFamilies)
      })
  }, [])

  const updateFMBFamilyDetails = async (familyid, values) => {
    try {
      await firebase
        .firestore()
        .collection("families")
        .doc(familyid)
        .update({
          fmb: {
            ...values,
          },
        })
    } catch (error) {
      CustomMessage("error", "Could not update family details")
    }
  }

  const handleEnrolledToggle = enrolledVal => {
    if (enrolledVal) {
      setCodeAndThaaliSizeDisabled(false)
    } else {
      setCodeAndThaaliSizeDisabled(true)
    }
  }

  return (
    <ManageEnrollmentsWrapper>
      <Card
        title="Manage Family Enrollments"
        headStyle={{ fontSize: "1.5rem", textAlign: "center" }}
      >
        {families !== null && (
          <Tabs defaultActiveKey="1">
            <TabPane tab="Enrolled" key="1">
              {families.map((family, index) => {
                if (family.fmb.enrolled) {
                  return (
                    <Card
                      key={index}
                      bodyStyle={{ padding: "1rem" }}
                      style={{ marginBottom: ".7rem" }}
                    >
                      <Row>
                        <Col sm={12} md={8}>
                          <div style={{ fontSize: "1.2rem" }}>
                            {family.displayname}
                          </div>
                          <div style={{ fontSize: "1.05rem", color: "gray" }}>
                            <div>Thaali Size: {family.fmb.thaaliSize}</div>
                            <div>Code: {family.fmb.code}</div>
                          </div>
                        </Col>
                        <Col className="my-auto" sm={12} md={4}>
                          <Button
                            className="align-middle mt-1"
                            variant="outline-warning"
                            onClick={() => {
                              setCodeAndThaaliSizeDisabled(!family.fmb.enrolled)
                              setCurrentlyEditingFamily({
                                id: family.familyid,
                                displayName: family.displayname,
                              })
                              editFamilyDetailsForm.setFieldsValue({
                                enrolled: family.fmb.enrolled,
                                code: family.fmb.code,
                                thaaliSize: family.fmb.thaaliSize,
                              })
                              setEditModalOpen(true)
                            }}
                          >
                            Edit
                          </Button>
                        </Col>
                      </Row>
                    </Card>
                  )
                } else {
                  return null
                }
              })}
            </TabPane>
            <TabPane tab="Not Enrolled" key="2">
              {families.map((family, index) => {
                if (!family.fmb.enrolled) {
                  return (
                    <Card
                      key={index}
                      bodyStyle={{ padding: "1rem" }}
                      style={{ marginBottom: ".7rem" }}
                    >
                      <Row>
                        <Col sm={12} md={8}>
                          <div style={{ fontSize: "1.2rem" }}>
                            {family.displayname}
                          </div>
                          <div style={{ fontSize: "1.05rem", color: "gray" }}>
                            Not Enrolled
                          </div>
                        </Col>
                        <Col className="my-auto" sm={12} md={4}>
                          <Button
                            className="align-middle mt-1"
                            variant="outline-warning"
                            onClick={() => {
                              setCodeAndThaaliSizeDisabled(!family.fmb.enrolled)
                              setCurrentlyEditingFamily({
                                id: family.familyid,
                                displayName: family.displayname,
                              })
                              editFamilyDetailsForm.setFieldsValue({
                                enrolled: family.fmb.enrolled,
                                code: null,
                                thaaliSize: null,
                              })
                              setEditModalOpen(true)
                            }}
                          >
                            Edit
                          </Button>
                        </Col>
                      </Row>
                    </Card>
                  )
                } else {
                  return null
                }
              })}
            </TabPane>
          </Tabs>
        )}
      </Card>

      <Modal
        title="Edit Family Details"
        visible={editModalOpen}
        okText="Save"
        confirmLoading={isUpdatingFamily}
        onOk={async () => {
          setIsUpdatingFamily(true)
          try {
            await editFamilyDetailsForm.validateFields([
              "enrolled",
              "thaaliSize",
              "code",
            ])
            await updateFMBFamilyDetails(
              currentlyEditingFamily.id,
              editFamilyDetailsForm.getFieldsValue()
            )
            setIsUpdatingFamily(false)
            setEditModalOpen(false)
          } catch (err) {
            onFinishFailed(editFamilyDetailsForm)
            setIsUpdatingFamily(false)
            console.log(err)
          }
        }}
        onCancel={() => setEditModalOpen(false)}
      >
        <h5 style={{ paddingBottom: ".8rem" }}>
          {currentlyEditingFamily.displayName}
        </h5>
        <Form {...layout} form={editFamilyDetailsForm} hideRequiredMark={true}>
          <Form.Item
            label="Enrolled?"
            name="enrolled"
            rules={[
              {
                required: true,
                message: "Please input enrollment status",
              },
            ]}
            style={{ marginBottom: ".5rem" }}
          >
            <Select onChange={e => handleEnrolledToggle(e)}>
              <Select.Option value={true}>Yes</Select.Option>
              <Select.Option value={false}>No</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Thaali size"
            name="thaaliSize"
            rules={[
              {
                required: true,
                message: "Please input menu item date",
              },
            ]}
            style={{ marginBottom: ".5rem" }}
          >
            <Select
              placeholder="Enter Thaali Size"
              disabled={codeAndThaaliSizeDisabled}
            >
              <Select.Option value="Grand">Grand</Select.Option>
              <Select.Option value="Full">Full</Select.Option>
              <Select.Option value="Half">Half</Select.Option>
              <Select.Option value="Quarter">Quarter</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="Family code"
            name="code"
            rules={[
              {
                required: true,
                whitespace: true,
                message: "Please input family code",
              },
            ]}
            style={{ marginBottom: ".5rem" }}
          >
            <Input
              placeholder="Enter Code"
              disabled={codeAndThaaliSizeDisabled}
            />
          </Form.Item>
        </Form>
      </Modal>
    </ManageEnrollmentsWrapper>
  )
}

const ManageEnrollmentsWrapper = styled.div`
  max-width: 1000px;
  margin: auto;

  .ant-tabs-tab {
    outline: none;
  }

  .btn {
    font-size: 1.1rem;
    width: 100%;
    padding-bottom: 0.2rem;
    padding-top: 0.2rem;
  }

  .btn-outline-warning:hover {
    background-color: inherit !important;
    color: #ffc107 !important;
  }
`

export default ManageEnrollments
