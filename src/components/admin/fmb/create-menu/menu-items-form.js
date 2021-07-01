import React, { useState } from "react"
import styled from "styled-components"
import { onFinishFailed } from "../../../../functions/forms"
import {
  Form,
  Button,
  Tag,
  message,
  Input,
  DatePicker,
  Space,
  Divider,
  Checkbox,
  Upload,
  Alert,
  Popover,
} from "antd"
import CustomMessage from "../../../custom-message"
import { Row, Col } from "react-bootstrap"
import { UploadOutlined } from "@ant-design/icons"
import * as XLSX from "xlsx"
import moment from "moment"

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 },
}

const importExcel = (file, menuItemForm) => {
  const fileReader = new FileReader()
  fileReader.onload = event => {
    try {
      const { result } = event.target
      const workbook = XLSX.read(result, { type: "binary", cellDates: true })
      for (const Sheet in workbook.Sheets) {
        XLSX.utils.sheet_to_row_object_array(workbook.Sheets["chicken"])
        if (workbook.Sheets.hasOwnProperty(Sheet)) {
          let data = XLSX.utils.sheet_to_row_object_array(
            workbook.Sheets[Sheet]
          )
          let allMenuItems = []
          let isProperlyParsed = true
          data.forEach(x => {
            // first make array of items
            allMenuItems.push({
              name: x.Item ? x.Item : null,
              date: x.Date ? moment(x.Date) : null,
              nothaali: undefined,
            })
          })

          // validate
          allMenuItems.forEach(x => {
            if (x.name === null || x.date === null) {
              isProperlyParsed = false
              return
            }
          })

          if (isProperlyParsed) {
            // push excel sheet parsed items into the menu item form
            let currItems = menuItemForm.getFieldsValue()
            currItems.items = allMenuItems
            menuItemForm.setFieldsValue(currItems)
            file.status = "success"
            CustomMessage("success", "Sucessfully parsed menu")
          } else {
            file.status = "error"
            CustomMessage("error", "Error: Could not parse menu")
          }
        }
      }
    } catch (e) {
      file.status = "error"
      CustomMessage("error", "Error: Could not parse menu")
    }
  }
  fileReader.readAsBinaryString(file)
}

const MenuItemsForm = ({
  setStep,
  values,
  setValues,
  disabledValues,
  setDisabledValues,
}) => {
  const [menuItemsForm] = Form.useForm()

  // this is an array that tracks which 'name' inputs should be disabled
  const [disabledItems, setDisabledItems] = useState(disabledValues)

  /*
    After form is completed, save values, disabled inputs array, and move on to review screen
    The items array can be potentially empty if no items have been added, thus we check if it's length > 0
  */
  const onFinish = values => {
    if (values.items.length > 0) {
      console.log(values)
      setValues(values)
      setDisabledValues(disabledItems)
      setStep("reviewmenu")
    } else {
      CustomMessage("error", "No items added to menu")
    }
  }

  /* 
    Save form values when 'back' button is clicked
  */
  const saveForm = () => {
    setValues(menuItemsForm.getFieldsValue())
    setDisabledValues(disabledItems)
    return
  }

  /*
    Handle action when 'No Thaali' checkbox is clicked
    'key' = index of item in items array
  */
  const handleCheckBox = (event, key) => {
    // get and duplicate the current form values
    let newItemsArr = menuItemsForm.getFieldsValue()

    // if the no thali checkbox is checked, then modify item name at index 'key' to "None"
    // also add the 'key' to the disabled items array so that 'name' field is disabled
    if (event.target.checked) {
      newItemsArr.items[key].name = "None"
      setDisabledItems([...disabledItems, key])
    } else {
      // if the checkbox is not checked, then we want to remove that item from the disabled items array
      // also set the name to undefined, like how it was initially
      let newDisabledItems = [...disabledItems]
      newDisabledItems = newDisabledItems.filter(item => {
        return item !== key
      })
      setDisabledItems([...newDisabledItems])
      newItemsArr.items[key].name = undefined
    }
    // set new field values
    menuItemsForm.setFieldsValue(newItemsArr)
  }

  /*
    After an item is deleted, then reset the disabled items array
    This is done by looking at all the field values after deletion
    If their 'name' field contains None, then add them to the array
    There is probably a better way to do this...
  */
  const resetDisabledItemsArrayAfterItemDelete = async () => {
    let fieldValuesAfterRemoval = menuItemsForm.getFieldsValue().items
    // js is weird, had to put this for loop inside an async function
    // don't want to set the items in state before processing
    const getNewDisabledItemsArr = async () => {
      let newDisabledItems = []
      for (let i = 0; i < fieldValuesAfterRemoval.length; i++) {
        if (fieldValuesAfterRemoval[i].name === "None") {
          newDisabledItems.push(i)
        }
      }
      return newDisabledItems
    }
    const newDisabledItemsArr = await getNewDisabledItemsArr()
    setDisabledItems(newDisabledItemsArr)
  }

  const onImportExcel = file => {
    importExcel(file, menuItemsForm)
  }

  return (
    <MenuItemsWrapper>
      <div style={{ textAlign: "center" }}>
        <Tag
          className="float-center"
          color="geekblue"
          style={{
            fontSize: "1.1rem",
            padding: ".3rem",
            marginBottom: "1.5rem",
          }}
        >
          Enter Items
        </Tag>
      </div>

      <Form
        {...layout}
        initialValues={values}
        form={menuItemsForm}
        onFinishFailed={() => onFinishFailed(menuItemsForm)}
        onFinish={onFinish}
      >
        <Form.Item>
          <Upload
            name="Excel Menu"
            action={onImportExcel}
            accept=".xlsx, .xls"
            showUploadList={false}
          >
            <Popover
              placement="topRight"
              content={
                'Make sure to include columns with the headers: "Item" and "Date" (case-sensitive)'
              }
            >
              <Button>Import Data from Excel Sheet</Button>
            </Popover>
          </Upload>
        </Form.Item>
        <Divider style={{ marginBottom: "1rem" }} />
        <Form.List name="items">
          {(fields, { add, remove }) => {
            return (
              <div>
                {fields.map((field, index) => (
                  <Space key={field.key} direction="vertical">
                    <div>{`Item #${index + 1}`}</div>
                    <Form.Item
                      {...field}
                      name={[field.name, "name"]}
                      fieldKey={[field.fieldKey, "name"]}
                      validateTrigger={["onChange", "onBlur"]}
                      rules={[
                        {
                          required: true,
                          whitespace: true,
                          message: "Please input menu item name",
                        },
                      ]}
                      style={{ marginBottom: ".5rem" }}
                    >
                      <Input
                        disabled={disabledItems.includes(field.name)}
                        placeholder="Enter name"
                      />
                    </Form.Item>

                    <Form.Item
                      {...field}
                      name={[field.name, "date"]}
                      fieldKey={[field.fieldKey, "date"]}
                      rules={[
                        {
                          required: true,

                          message: "Please input menu item date",
                        },
                      ]}
                      style={{ marginBottom: ".5rem" }}
                    >
                      <DatePicker
                        format="dddd, MMM Do YYYY"
                        style={{ width: "100%", paddingBottom: ".4rem" }}
                      />
                    </Form.Item>

                    {disabledItems.includes(field.name) && (
                      <Form.Item
                        {...field}
                        name={[field.name, "reasonNoThaali"]}
                        fieldKey={[field.fieldKey, "reasonNoThaali"]}
                        validateTrigger={["onChange", "onBlur"]}
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
                    <Row>
                      <Col xs={7} sm={8}>
                        <Form.Item
                          name={[field.name, "nothaali"]}
                          fieldKey={[field.fieldKey, "nothaali"]}
                          valuePropName="checked"
                          style={{ marginBottom: "0rem" }}
                        >
                          <Checkbox
                            onChange={event =>
                              handleCheckBox(event, field.name)
                            }
                          >
                            No Thaali
                          </Checkbox>
                        </Form.Item>
                      </Col>
                      <Col xs={5} sm={4}>
                        <Button
                          className="float-right"
                          style={{ width: "100%" }}
                          danger
                          onClick={async () => {
                            // reset disabled items array after removing an item
                            // using the fields value after removal to determine which indexes are still disabled
                            await remove(field.name)

                            //reset the disabled items array
                            await resetDisabledItemsArrayAfterItemDelete()
                          }}
                        >
                          Delete
                        </Button>
                      </Col>
                    </Row>
                    <Divider
                      style={{ marginBottom: ".8rem", marginTop: ".8rem" }}
                    />
                  </Space>
                ))}

                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => {
                      add()
                    }}
                    style={{ width: "100%" }}
                  >
                    Add Item
                  </Button>
                </Form.Item>
              </div>
            )
          }}
        </Form.List>

        <Form.Item>
          <Button
            onClick={async () => {
              await saveForm()
              setStep("hijrimonth")
            }}
            className="float-left next-btn"
          >
            Back
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            className="float-right next-btn"
          >
            Review
          </Button>
        </Form.Item>
      </Form>
    </MenuItemsWrapper>
  )
}

const MenuItemsWrapper = styled.div`
  .next-btn {
    padding-top: 0.2rem;
    padding-bottom: 2.2rem;
    font-size: 1.2rem;
    margin-top: 1rem;
  }

  div > .ant-space {
    width: 100%;
  }
`

export default MenuItemsForm
