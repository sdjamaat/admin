import React, { useState, useEffect } from "react"
import {
  Card,
  Collapse,
  Tag,
  Modal,
  Form,
  DatePicker,
  Input,
  Checkbox,
} from "antd"
import { Row, Col, Button } from "react-bootstrap"
import styled from "styled-components"
import { shortMonthToLongMonth } from "../../../../functions/calendar"
import { onFinishFailed } from "../../../../functions/forms"
const moment = require("moment")
const { Panel } = Collapse

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 },
}

const SingleMenu = ({
  menu,
  tagColor,
  tagName,
  showConfirmationModal,
  editMenuItemModal,
}) => {
  const [editMenuItemForm] = Form.useForm()

  const [showEditMenuItemModal, setShowEditMenuItemModal] = useState(false)
  const [showDeleteMenuItemModal, setShowDeleteMenuItemModal] = useState(false)
  const [
    currentlyEditingMenuItemDetails,
    setCurrentlyEditingMenuItemDetails,
  ] = useState({
    monthName: null,
    itemID: null,
    year: null,
    isPrevMoharram: null,
    isNewItem: null,
    isDeleting: null,
  })
  const [nameFieldDisabled, setNameFieldDisabled] = useState(false)
  const [isUpdatingItem, setIsUpdatingItem] = useState(false)

  const getActionButtons = status => {
    let buttons = null
    if (status === "Active") {
      buttons = (
        <>
          <Col xs={12}>
            <Button
              variant="outline-danger"
              onClick={() =>
                showConfirmationModal(
                  "deactivate",
                  menu.month,
                  menu.year,
                  true,
                  false,
                  menu.isPrevMoharram
                )
              }
            >
              Close Submissions & Archive
            </Button>
          </Col>
        </>
      )
    } else if (status === "Queued") {
      buttons = (
        <>
          <Col xs={6}>
            <Button
              variant="outline-secondary"
              onClick={() =>
                showConfirmationModal(
                  "archive",
                  menu.month,
                  menu.year,
                  false,
                  false,
                  menu.isPrevMoharram
                )
              }
            >
              Archive
            </Button>
          </Col>
          <Col xs={6}>
            <Button
              variant="outline-success"
              onClick={() =>
                showConfirmationModal(
                  "activate",
                  menu.month,
                  menu.year,
                  false,
                  false,
                  menu.isPrevMoharram
                )
              }
            >
              Activate
            </Button>
          </Col>
        </>
      )
    } else {
      buttons = (
        <>
          <Col xs={6}>
            <Button
              variant="outline-danger"
              onClick={() =>
                showConfirmationModal(
                  "delete",
                  menu.month,
                  menu.year,
                  false,
                  true,
                  menu.isPrevMoharram
                )
              }
            >
              Delete
            </Button>
          </Col>
          <Col xs={6}>
            <Button
              variant="outline-warning"
              onClick={() =>
                showConfirmationModal(
                  "queue",
                  menu.month,
                  menu.year,
                  false,
                  false,
                  menu.isPrevMoharram
                )
              }
            >
              Queue
            </Button>
          </Col>
        </>
      )
    }
    return buttons
  }

  return (
    <SingleMenuWrapper>
      <Card bodyStyle={{ padding: "1rem" }}>
        <div style={{ paddingBottom: "1rem" }}>
          <Row style={{ paddingBottom: 0 }}>
            <Col xs={9} md={11}>
              <div style={{ fontSize: "1.2rem" }}>
                {shortMonthToLongMonth(menu.month)}{" "}
              </div>
            </Col>
            <Col xs={3} md={1}>
              <Tag
                style={{ fontSize: ".9rem" }}
                className="float-right mt-1"
                color={tagColor}
              >
                {tagName}
              </Tag>
            </Col>
          </Row>
          <span style={{ color: "gray" }}>{menu.year}</span>
        </div>
        <Collapse style={{ padding: "-10px" }}>
          <Panel header="Items" key="1">
            {menu.items.map((item, index) => {
              return (
                <div key={index}>
                  <Row style={{ marginBottom: "1.2rem" }}>
                    <Col xs={12} sm={8}>
                      <div>Item #{index + 1}</div>
                      <ul
                        style={{ paddingLeft: "1.6rem", marginBottom: ".5rem" }}
                      >
                        <li>
                          {item.nothaali ? "No Thaali" : `Name: ${item.name}`}
                        </li>
                        {item.nothaali && (
                          <li>
                            Reason:{" "}
                            {item.reasonNoThaali
                              ? item.reasonNoThaali
                              : "None provided"}
                          </li>
                        )}
                        <li>Date: {item.date}</li>
                      </ul>
                    </Col>

                    {tagName !== "Active" && (
                      <Col className="my-auto" xs={12} sm={4}>
                        <div
                          style={{
                            margin: "-.2rem .3rem 0rem .3rem",
                          }}
                        >
                          <Row>
                            <Col>
                              <Button
                                className="align-middle"
                                variant="outline-warning"
                                onClick={() => {
                                  setNameFieldDisabled(item.nothaali)
                                  editMenuItemForm.setFieldsValue({
                                    name: item.name,
                                    date: moment(item.date, "MM-DD-YYYY"),
                                    nothaali: item.nothaali,
                                    reasonNoThaali: item.reasonNoThaali,
                                  })
                                  setCurrentlyEditingMenuItemDetails({
                                    monthName: menu.month,
                                    itemID: item.id,
                                    year: menu.year,
                                    isPrevMoharram: menu.isPrevMoharram,
                                    isNewItem: false,
                                  })
                                  setShowEditMenuItemModal(true)
                                }}
                              >
                                Edit
                              </Button>
                            </Col>

                            <Col>
                              <Button
                                className="align-middle"
                                variant="outline-danger"
                                onClick={() => {
                                  setNameFieldDisabled(item.nothaali)
                                  editMenuItemForm.setFieldsValue({
                                    name: item.name,
                                    date: moment(item.date, "MM-DD-YYYY"),
                                    nothaali: item.nothaali,
                                    reasonNoThaali: item.reasonNoThaali,
                                  })
                                  setCurrentlyEditingMenuItemDetails({
                                    monthName: menu.month,
                                    itemID: item.id,
                                    year: menu.year,
                                    isPrevMoharram: menu.isPrevMoharram,
                                    isNewItem: false,
                                    isDeleting: true,
                                  })
                                  setShowDeleteMenuItemModal(true)
                                }}
                              >
                                Delete
                              </Button>
                            </Col>
                          </Row>
                        </div>
                      </Col>
                    )}
                  </Row>
                </div>
              )
            })}

            {tagName !== "Active" && (
              <Button
                onClick={() => {
                  setNameFieldDisabled(false)
                  editMenuItemForm.setFieldsValue({
                    name: null,
                    date: null,
                    nothaali: null,
                    reasonNoThaali: null,
                  })
                  setCurrentlyEditingMenuItemDetails({
                    monthName: menu.month,
                    itemID: Array(15)
                      .fill(0)
                      .map(x => Math.random().toString(36).charAt(2))
                      .join(""),
                    year: menu.year,
                    isPrevMoharram: menu.isPrevMoharram,
                    isNewItem: true,
                    isDeleting: false,
                  })
                  setShowEditMenuItemModal(true)
                }}
                variant="outline-secondary"
              >
                Add New Item
              </Button>
            )}
          </Panel>
        </Collapse>
        <Row style={{ marginTop: "1rem" }}>{getActionButtons(tagName)}</Row>
      </Card>
      <Modal
        title="Edit Item"
        visible={showEditMenuItemModal}
        okText={
          currentlyEditingMenuItemDetails.isNewItem ? "Add Item" : "Update Item"
        }
        confirmLoading={isUpdatingItem}
        onOk={async () => {
          setIsUpdatingItem(true)
          try {
            await editMenuItemForm.validateFields(["name", "date"])
            await editMenuItemModal(
              currentlyEditingMenuItemDetails.monthName,
              currentlyEditingMenuItemDetails.itemID,
              currentlyEditingMenuItemDetails.year,
              editMenuItemForm.getFieldsValue(),
              currentlyEditingMenuItemDetails.isPrevMoharram,
              currentlyEditingMenuItemDetails.isNewItem,
              currentlyEditingMenuItemDetails.isDeleting
            )
            setIsUpdatingItem(false)
            setShowEditMenuItemModal(false)
          } catch (err) {
            setIsUpdatingItem(false)
            console.log(err)
          }
        }}
        onCancel={() => setShowEditMenuItemModal(false)}
      >
        <Form
          {...layout}
          form={editMenuItemForm}
          onFinishFailed={() => onFinishFailed(editMenuItemForm)}
          onFinish={values => console.log(values)}
        >
          <Form.Item
            name="name"
            rules={[
              {
                required: true,
                whitespace: true,
                message: "Please input menu item name",
              },
            ]}
            style={{ marginBottom: ".5rem" }}
          >
            <Input disabled={nameFieldDisabled} placeholder="Enter name" />
          </Form.Item>

          <Form.Item
            name="date"
            rules={[
              {
                required: true,
                message: "Please input menu item date",
              },
            ]}
            style={{ marginBottom: ".5rem" }}
          >
            <DatePicker
              format="MM-DD-YYYY"
              style={{ width: "100%", paddingBottom: ".4rem" }}
            />
          </Form.Item>
          {nameFieldDisabled && (
            <Form.Item
              name="reasonNoThaali"
              rules={[
                {
                  whitespace: true,
                  message: "Please input reason for no thaali",
                },
              ]}
              style={{ marginBottom: ".5rem" }}
            >
              <Input placeholder="Reason for no thaali (optional)" />
            </Form.Item>
          )}
          <Form.Item
            name="nothaali"
            valuePropName="checked"
            style={{ marginBottom: "0rem" }}
          >
            <Checkbox
              onChange={event => {
                const isNameFieldDisabled = event.target.checked
                if (isNameFieldDisabled) {
                  editMenuItemForm.setFieldsValue({ name: "None" })
                }
                setNameFieldDisabled(isNameFieldDisabled)
              }}
            >
              No Thaali
            </Checkbox>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="Are you sure you want to delete this item?"
        visible={showDeleteMenuItemModal}
        okText="Delete Item"
        confirmLoading={isUpdatingItem}
        okType="danger"
        onOk={async () => {
          setIsUpdatingItem(true)
          try {
            await editMenuItemModal(
              currentlyEditingMenuItemDetails.monthName,
              currentlyEditingMenuItemDetails.itemID,
              currentlyEditingMenuItemDetails.year,
              editMenuItemForm.getFieldsValue(),
              currentlyEditingMenuItemDetails.isPrevMoharram,
              currentlyEditingMenuItemDetails.isNewItem,
              currentlyEditingMenuItemDetails.isDeleting
            )
            setIsUpdatingItem(false)
            setShowDeleteMenuItemModal(false)
          } catch (err) {
            setIsUpdatingItem(false)
            console.log(err)
          }
        }}
        onCancel={() => setShowDeleteMenuItemModal(false)}
      >
        {showDeleteMenuItemModal && (
          <div>
            <ul>
              {editMenuItemForm.getFieldValue("nothaali") ? (
                <li>No Thaali</li>
              ) : (
                <li>Name: {editMenuItemForm.getFieldValue("name")}</li>
              )}

              {editMenuItemForm.getFieldValue("nothaali") && (
                <li>
                  Reason:{" "}
                  {editMenuItemForm.getFieldValue("reasonNoThaali") ||
                    "None provided"}
                </li>
              )}

              <li>
                Date:{" "}
                {editMenuItemForm.getFieldValue("date").format("MM-DD-YYYY")}
              </li>
            </ul>
          </div>
        )}
      </Modal>
    </SingleMenuWrapper>
  )
}

const SingleMenuWrapper = styled.div`
  .ant-collapse > .ant-collapse-item > .ant-collapse-header {
    padding-top: 0.3rem;
    padding-bottom: 0.3rem;
  }
  padding-bottom: 1rem;

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

export default SingleMenu
