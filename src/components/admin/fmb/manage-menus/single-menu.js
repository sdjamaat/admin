import React, { useState } from "react"
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
  const [
    currentlyEditingMenuItemDetails,
    setCurrentlyEditingMenuItemDetails,
  ] = useState({
    monthName: null,
    itemID: null,
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
                showConfirmationModal("deactivate", menu.month, true)
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
              onClick={() => showConfirmationModal("archive", menu.month)}
            >
              Archive
            </Button>
          </Col>
          <Col xs={6}>
            <Button
              variant="outline-success"
              onClick={() => showConfirmationModal("activate", menu.month)}
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
                showConfirmationModal("delete", menu.month, false, true)
              }
            >
              Delete
            </Button>
          </Col>
          <Col xs={6}>
            <Button
              variant="outline-warning"
              onClick={() => showConfirmationModal("queue", menu.month)}
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
                        <li>Date: {item.date}</li>
                      </ul>
                    </Col>

                    <Col className="my-auto" xs={12} sm={4}>
                      <div
                        style={{
                          margin: "-.2rem .3rem 0rem .3rem",
                        }}
                      >
                        <Button
                          className="align-middle"
                          variant="outline-warning"
                          onClick={() => {
                            setNameFieldDisabled(item.nothaali)
                            editMenuItemForm.setFieldsValue({
                              name: item.name,
                              date: moment(item.date, "MM-DD-YYYY"),
                              nothaali: item.nothaali,
                            })
                            setCurrentlyEditingMenuItemDetails({
                              monthName: menu.month,
                              itemID: item.id,
                            })
                            setShowEditMenuItemModal(true)
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </div>
              )
            })}
          </Panel>
        </Collapse>
        <Row style={{ marginTop: "1rem" }}>{getActionButtons(tagName)}</Row>
      </Card>
      <Modal
        title="Edit Item"
        visible={showEditMenuItemModal}
        okText="Update"
        confirmLoading={isUpdatingItem}
        onOk={async () => {
          setIsUpdatingItem(true)
          try {
            await editMenuItemForm.validateFields(["name", "date"])
            await editMenuItemModal(
              currentlyEditingMenuItemDetails.monthName,
              currentlyEditingMenuItemDetails.itemID,
              editMenuItemForm.getFieldsValue()
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
