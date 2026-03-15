import React, { useState, useEffect } from "react"
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
  Select,
  Switch,
} from "antd"
import { ALL_SIZES } from "../../../../utils/thaali-sizes"
import CustomMessage from "../../../custom-message"
import Checklist from "./presubmit-checklist"
import { Row, Col } from "react-bootstrap"
import { UploadOutlined } from "@ant-design/icons"
import * as XLSX from "xlsx"
import moment from "moment"

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 },
}

const isNameValid = (name: any) => {
  if (name !== null) {
    name = name.replace(/\s+/g, "").toLowerCase()
    return name !== "nothaali"
  }
  return false
}

const importExcel = (file: any, menuItemForm: any) => {
  const fileReader = new FileReader()
  fileReader.onload = event => {
    try {
      const { result } = event.target as any
      const workbook = XLSX.read(result, { type: "binary", cellDates: true })
      for (const Sheet in workbook.Sheets) {
        //XLSX.utils.sheet_to_row_object_array(workbook.Sheets["chicken"])
        if (workbook.Sheets.hasOwnProperty(Sheet)) {
          let data = (XLSX.utils as any).sheet_to_row_object_array(
            workbook.Sheets[Sheet]
          )
          let allMenuItems: any[] = []
          let isProperlyParsed = true
          data.forEach((x: any) => {
            // first make array of items
            let nameValid = isNameValid(x.Item)
            if (nameValid) {
              allMenuItems.push({
                name: x.Item ? x.Item : null,
                date: x.Date ? moment(x.Date) : null,
                nothaali: undefined,
              })
            }

            let sepItem = x['Separated Item']

            if(sepItem) {
              allMenuItems.push({
                name: sepItem ? sepItem : null,
                date: x.Date ? moment(x.Date) : null,
                nothaali: undefined,
              })
            }
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

        // just go through the first sheet, maybe change behavior later if sheet name is specified
        break
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
}: any) => {
  const [menuItemsForm] = Form.useForm()

  // this is an array that tracks which 'name' inputs should be disabled
  const [disabledItems, setDisabledItems] = useState(disabledValues)

  // checklist modal
  const [showChecklist, setShowChecklist] = useState(false)

  // is checklist complete
  const [isChecklistComplete, setIsChecklistComplete] = useState(false)

  const [checklistItems, setChecklistItems] = useState([
    {
      name: '"No Thaali" is not an item',
      checked: false,
    },
    {
      name:
        '"No Thaali" checkbox is clicked on Miqaat or no thaali days (with an optional reason)',
      checked: false,
    },
    { name: "All item dates are correct", checked: false },
  ])
  /*
    After form is completed, save values, disabled inputs array, and move on to review screen
    The items array can be potentially empty if no items have been added, thus we check if it's length > 0
  */
  const onFinish = ({ items }: any) => {
    if (items && items.length > 0) {
      setShowChecklist(true)
    } else {
      CustomMessage("error", "No items added to menu")
    }
  }

  const moveOnToNext = () => {
    setValues(menuItemsForm.getFieldsValue())
    setDisabledValues(disabledItems)
    setStep("reviewmenu")
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
  const handleCheckBox = (event: any, key: any) => {
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
      newDisabledItems = newDisabledItems.filter((item: any) => {
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
    There is probably a better way to do this...i cry errytime...
  */
  const resetDisabledItemsArrayAfterItemDelete = async () => {
    let fieldValuesAfterRemoval = menuItemsForm.getFieldsValue().items
    // js is weird, had to put this for loop inside an async function
    // don't want to set the items in state before processing
    const getNewDisabledItemsArr = async () => {
      let newDisabledItems: any[] = []
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

  const onImportExcel = (file: any) => {
    importExcel(file, menuItemsForm)
  }

  return (
    <MenuItemsWrapper>
      {showChecklist && (
        <Checklist
          setShowChecklist={setShowChecklist}
          checklistItems={checklistItems}
          setChecklistItems={setChecklistItems}
          setIsChecklistComplete={setIsChecklistComplete}
          onOkayHandler={moveOnToNext}
        />
      )}
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
            beforeUpload={(file) => { onImportExcel(file); return false; }}
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
                      fieldKey={[field.fieldKey, "name"] as any}
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
                      fieldKey={[field.fieldKey, "date"] as any}
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
                        fieldKey={[field.fieldKey, "reasonNoThaali"] as any}
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
                    <Row style={{ alignItems: "center" }}>
                      <Col xs={4} sm={3}>
                        <Form.Item
                          name={[field.name, "nothaali"]}
                          fieldKey={[field.fieldKey, "nothaali"] as any}
                          valuePropName="checked"
                          style={{ marginBottom: 0 }}
                        >
                          <Checkbox
                            onChange={(event: any) =>
                              handleCheckBox(event, field.name)
                            }
                          >
                            No Thaali
                          </Checkbox>
                        </Form.Item>
                      </Col>
                      <Col xs={4} sm={5}>
                        {!disabledItems.includes(field.name) && (
                          <Form.Item
                            noStyle
                            shouldUpdate={(prev: any, curr: any) =>
                              prev?.items?.[field.name]?.sizeRestrictionEnabled !==
                              curr?.items?.[field.name]?.sizeRestrictionEnabled
                            }
                          >
                            {() => (
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <Form.Item
                                  name={[field.name, "sizeRestrictionEnabled"]}
                                  fieldKey={[field.fieldKey, "sizeRestrictionEnabled"] as any}
                                  valuePropName="checked"
                                  style={{ marginBottom: 0 }}
                                >
                                  <Switch size="small" />
                                </Form.Item>
                                <span style={{ fontSize: ".85rem", color: "#666", whiteSpace: "nowrap" }}>
                                  Limit
                                </span>
                                {menuItemsForm.getFieldValue(["items", field.name, "sizeRestrictionEnabled"]) && (
                                  <Form.Item
                                    name={[field.name, "maxSize"]}
                                    fieldKey={[field.fieldKey, "maxSize"] as any}
                                    rules={[{ required: true, message: "Required" }]}
                                    style={{ marginBottom: 0 }}
                                  >
                                    <Select size="small" style={{ width: 90 }} placeholder="Max">
                                      {ALL_SIZES.map((size) => (
                                        <Select.Option key={size} value={size}>
                                          {size}
                                        </Select.Option>
                                      ))}
                                    </Select>
                                  </Form.Item>
                                )}
                              </div>
                            )}
                          </Form.Item>
                        )}
                      </Col>
                      <Col xs={4} sm={4}>
                        <Button
                          className="float-right"
                          style={{ width: "100%" }}
                          danger
                          onClick={async () => {
                            await remove(field.name)
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
    height: 2.5rem;
    font-size: 1.2rem;
    margin-top: 1rem;
  }

  div > .ant-space {
    width: 100%;
  }
`

export default MenuItemsForm
