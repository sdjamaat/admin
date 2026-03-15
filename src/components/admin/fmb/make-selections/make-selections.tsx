import React, { useState, useEffect, useContext } from "react"
import {
  Card,
  Select,
  Button,
  Divider,
  Alert,
  Form,
  Row,
  Col,
  Checkbox,
  message,
} from "antd"
import { InfoCircleOutlined } from "@ant-design/icons"
import styled from "styled-components"
import { db } from "../../../../lib/firebase"
import { doc, getDoc, getDocs, setDoc, updateDoc, collection, serverTimestamp, arrayUnion } from "firebase/firestore"
import { DateContext } from "../../../../provider/date-context"
import { AuthContext } from "../../../../provider/auth-context"
import { shortMonthToLongMonth } from "../../../../functions/calendar"
import CustomMessage from "../../../custom-message"
import { getEffectiveMaxSize, getAllowedSizes } from "../../../../utils/thaali-sizes"
import moment from "moment"

const { Option } = Select

const MakeSelections = () => {
  const [form] = Form.useForm()
  const { getHijriDate } = useContext(DateContext)
  const { currUser } = useContext(AuthContext)

  // State management
  const [menus, setMenus] = useState<any[]>([])
  const [families, setFamilies] = useState<any[]>([])
  const [selectedMenu, setSelectedMenu] = useState<any>(null)
  const [selectedFamily, setSelectedFamily] = useState<any>(null)
  const [menuItems, setMenuItems] = useState<any[]>([])
  const [selections, setSelections] = useState<any>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [universalSize, setUniversalSize] = useState<any>(null)
  const [hasExistingSubmission, setHasExistingSubmission] = useState(false)
  const [existingSubmissionData, setExistingSubmissionData] = useState<any>(null)

  // Fetch menus on component mount
  useEffect(() => {
    fetchMenus()
    fetchFamilies()
  }, [])

  const fetchMenus = async () => {
    try {
      const hijriYear = getHijriDate().year
      let allMenus: any[] = []

      // Get current year menus
      const currentYearDoc = await getDoc(
        doc(db, "fmb", hijriYear.toString())
      )

      if (currentYearDoc.exists()) {
        const yearData = currentYearDoc.data()
        const menusSnapshot = await getDocs(
          collection(db, "fmb", hijriYear.toString(), "menus")
        )

        menusSnapshot.forEach((docSnap: any) => {
          const menuData = docSnap.data()
          allMenus.push({
            ...menuData,
            year: hijriYear,
            month: docSnap.id,
            isPrevMoharram: false,
            isActive: yearData.activeMenu === docSnap.id,
            displayName: `${shortMonthToLongMonth(docSnap.id)} ${hijriYear}`,
            key: `${hijriYear}-${docSnap.id}`,
          })
        })

        // Get previous year Moharram if exists
        const prevMoharramDoc = await getDoc(
          doc(db, "fmb", (hijriYear - 1).toString(), "menus", "moharram")
        )

        if (prevMoharramDoc.exists()) {
          allMenus.push({
            ...prevMoharramDoc.data(),
            year: hijriYear,
            month: "moharram",
            isPrevMoharram: true,
            isActive: false,
            displayName: `Moharram ${hijriYear} (Previous Year)`,
            key: `${hijriYear - 1}-moharram`,
          })
        }
      }

      setMenus(allMenus)

      // Auto-select active menu if exists
      const activeMenu = allMenus.find((menu: any) => menu.isActive)
      if (activeMenu) {
        setSelectedMenu(activeMenu)
        setMenuItems(activeMenu.items || [])
      }
    } catch (error) {
      console.error("Error fetching menus:", error)
      CustomMessage("error", "Failed to fetch menus")
    }
  }

  const fetchFamilies = async () => {
    try {
      const familiesSnapshot = await getDocs(collection(db, "families"))

      const familyData: any[] = []
      familiesSnapshot.forEach((docSnap: any) => {
        const family = docSnap.data()
        if (family.fmb && family.fmb.enrolled) {
          familyData.push({
            ...family,
            key: family.familyid,
            displayText: `${family.displayname} (${family.fmb.code})`,
          })
        }
      })

      // Sort families by display name
      familyData.sort((a: any, b: any) => a.displayname.localeCompare(b.displayname))
      setFamilies(familyData)
    } catch (error) {
      console.error("Error fetching families:", error)
      CustomMessage("error", "Failed to fetch families")
    }
  }

  const handleMenuChange = (menuKey: any) => {
    const menu = menus.find((m: any) => m.key === menuKey)
    setSelectedMenu(menu)
    setMenuItems(menu ? menu.items || [] : [])
    setSelections({})
    setSelectedFamily(null)
    setHasExistingSubmission(false)
    setExistingSubmissionData(null)
    form.resetFields()
  }

  const handleFamilyChange = async (familyId: any) => {
    const family = families.find((f: any) => f.familyid === familyId)
    setSelectedFamily(family)
    setSelections({})
    setHasExistingSubmission(false)
    setExistingSubmissionData(null)

    if (!family || !selectedMenu) return

    try {
      // Check for existing submission
      const hijriYear = selectedMenu.isPrevMoharram
        ? getHijriDate().year - 1
        : selectedMenu.year

      const submissionDoc = await getDoc(
        doc(
          db,
          "fmb",
          hijriYear.toString(),
          "menus",
          selectedMenu.month,
          "submissions",
          familyId
        )
      )

      if (submissionDoc.exists()) {
        // Family has existing submission - populate form
        const submissionData = submissionDoc.data()
        setHasExistingSubmission(true)
        setExistingSubmissionData(submissionData)
        setSelections(submissionData.selections || {})

        // Populate form fields
        const fieldUpdates: any = {}
        menuItems.forEach((item: any) => {
          if (!item.nothaali && submissionData.selections?.[item.id]) {
            fieldUpdates[`selection_${item.id}`] =
              submissionData.selections[item.id]
          }
        })
        form.setFieldsValue(fieldUpdates)
      } else {
        // No existing submission - reset form
        const fieldUpdates: any = {}
        menuItems.forEach((item: any) => {
          if (!item.nothaali) {
            fieldUpdates[`selection_${item.id}`] = undefined
          }
        })
        form.setFieldsValue(fieldUpdates)
      }
    } catch (error) {
      console.error("Error checking existing submission:", error)
      // Reset form on error
      const fieldUpdates: any = {}
      menuItems.forEach((item: any) => {
        if (!item.nothaali) {
          fieldUpdates[`selection_${item.id}`] = undefined
        }
      })
      form.setFieldsValue(fieldUpdates)
    }
  }

  const handleSelectionChange = (itemId: any, size: any) => {
    setSelections((prev: any) => ({
      ...prev,
      [itemId]: size,
    }))
  }

  const getItemEffectiveMaxSize = (item: any) => {
    if (!selectedFamily) return "Grand"
    const familyMax = selectedFamily.fmb.thaaliSize
    const itemMax = item.sizeRestrictionEnabled ? item.maxSize : undefined
    return getEffectiveMaxSize(familyMax, itemMax)
  }

  const getItemAllowedSizes = (item: any) => {
    return getAllowedSizes(getItemEffectiveMaxSize(item))
  }

  const handleUniversalChange = (checked: any, size: any) => {
    if (checked && size) {
      setUniversalSize(size)
      const newSelections: any = {}
      const fieldUpdates: any = {}

      menuItems.forEach((item: any) => {
        if (!item.nothaali) {
          const allowed = getItemAllowedSizes(item)
          // Auto-clamp to item's effective max if selected size exceeds it
          const effectiveSize = allowed.includes(size) ? size : allowed[allowed.length - 1]
          newSelections[item.id] = effectiveSize
          fieldUpdates[`selection_${item.id}`] = effectiveSize
        }
      })

      setSelections(newSelections)
      form.setFieldsValue(fieldUpdates)
    } else {
      setUniversalSize(null)
    }
  }

  const handleSubmit = async () => {
    if (!selectedMenu || !selectedFamily) {
      CustomMessage("error", "Please select both a menu and a family")
      return
    }

    // Validate that all menu items have selections
    const itemsNeedingSelections = menuItems.filter((item: any) => !item.nothaali)
    const missingSelections = itemsNeedingSelections.filter(
      (item: any) => !selections[item.id]
    )

    if (missingSelections.length > 0) {
      CustomMessage("error", "Please make selections for all menu items")
      return
    }

    setIsSubmitting(true)

    try {
      const hijriYear = selectedMenu.isPrevMoharram
        ? getHijriDate().year - 1
        : selectedMenu.year
      const submissionData = {
        selections,
        familyDisplayName: selectedFamily.displayname,
        code: selectedFamily.fmb.code,
        submittedBy: {
          firstname: currUser.name,
          lastname: "",
          role: "admin",
        },
        submittedAt: serverTimestamp(),
        submittedByAdmin: true,
        onBehalfOf: selectedFamily.familyid,
      }

      // Save submission
      await setDoc(
        doc(
          db,
          "fmb",
          hijriYear.toString(),
          "menus",
          selectedMenu.month,
          "submissions",
          selectedFamily.familyid
        ),
        submissionData
      )

      // Update submissions array in menu document
      await updateDoc(
        doc(
          db,
          "fmb",
          hijriYear.toString(),
          "menus",
          selectedMenu.month
        ),
        {
          submissions: arrayUnion(
            selectedFamily.displayname
          ),
        }
      )

      CustomMessage(
        "success",
        `Successfully ${
          hasExistingSubmission ? "updated" : "submitted"
        } selections for ${selectedFamily.displayname}`
      )

      // Don't reset family - instead reload their data to show updated selections
      const currentFamilyId = selectedFamily.familyid
      setSelections({})
      setUniversalSize(null)
      setHasExistingSubmission(false)
      setExistingSubmissionData(null)

      // Reload the same family's data to show updated selections
      await handleFamilyChange(currentFamilyId)
    } catch (error) {
      console.error("Error submitting selections:", error)
      CustomMessage("error", "Failed to submit selections")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getThaaliSizeColor = (size: any) => {
    switch (size) {
      case "Grand":
        return "#52c41a"
      case "Full":
        return "#1890ff"
      case "Half":
        return "#faad14"
      case "Quarter":
        return "#f5222d"
      default:
        return "#d9d9d9"
    }
  }

  const thaaliSizes = ["Grand", "Full", "Half", "Quarter"]

  return (
    <MakeSelectionsWrapper>
      <Card
        title="Make Thaali Selections for Families"
        headStyle={{
          fontSize: "1.5rem",
          textAlign: "center",
        }}
        bodyStyle={{ paddingTop: "1rem" }}
      >
        {/* Menu Selection */}
        <Row gutter={16} style={{ marginBottom: "1rem" }}>
          <Col span={24}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "bold",
              }}
            >
              Select Menu:
            </label>
            <Select
              style={{ width: "100%" }}
              placeholder="Choose a menu"
              value={selectedMenu?.key}
              onChange={handleMenuChange}
            >
              {menus.map((menu: any) => (
                <Option key={menu.key} value={menu.key}>
                  {menu.displayName} {menu.isActive && "(Currently Active)"}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>

        {/* Family Selection */}
        {selectedMenu && (
          <Row gutter={16} style={{ marginBottom: "1rem" }}>
            <Col span={24}>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "bold",
                }}
              >
                Select Family:
              </label>
              <Select
                style={{ width: "100%" }}
                placeholder="Choose a family"
                value={selectedFamily?.familyid}
                onChange={handleFamilyChange}
                showSearch
                filterOption={(input: any, option: any) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >=
                  0
                }
              >
                {families.map((family: any) => (
                  <Option key={family.familyid} value={family.familyid}>
                    {family.displayText}
                  </Option>
                ))}
              </Select>
            </Col>
          </Row>
        )}

        {/* Family Info Display */}
        {selectedFamily && (
          <>
            <Alert
              message={
                <span>
                  <InfoCircleOutlined style={{ marginRight: "0.5rem" }} />
                  {selectedFamily.displayname.split(" (")[0]}'s Default Max
                  Thaali Size: <strong>{selectedFamily.fmb.thaaliSize}</strong>{" "}
                  (You can override this by selecting any size below)
                </span>
              }
              type="info"
              style={{ marginBottom: "1rem" }}
            />

            {hasExistingSubmission && (
              <Alert
                message={
                  <span>
                    <InfoCircleOutlined style={{ marginRight: "0.5rem" }} />
                    This family has already submitted for this menu. You can
                    edit their selections below.
                    {existingSubmissionData?.submittedAt && (
                      <div
                        style={{
                          marginTop: "0.25rem",
                          fontSize: "0.9em",
                          opacity: 0.8,
                        }}
                      >
                        Last updated at:{" "}
                        {new Date(
                          existingSubmissionData.submittedAt.toDate()
                        ).toLocaleString()}
                      </div>
                    )}
                  </span>
                }
                type="warning"
                style={{ marginBottom: "1rem" }}
              />
            )}
          </>
        )}

        {/* Universal Size Toggle */}
        {selectedFamily && menuItems.length > 0 && (
          <>
            <div
              style={{
                fontSize: "1.2rem",
                fontWeight: "bold",
                marginTop: "1.5rem",
                marginBottom: "1rem",
                color: "#1890ff",
              }}
            >
              Universal Size Selection
            </div>
            <Row gutter={16} style={{ marginBottom: "1rem" }}>
              <Col span={24}>
                <div style={{ marginBottom: "0.5rem" }}>
                  Set all menu items to a specific size:
                </div>
                {thaaliSizes.map((size: any) => (
                  <Checkbox
                    key={size}
                    checked={universalSize === size}
                    onChange={(e: any) =>
                      handleUniversalChange(e.target.checked, size)
                    }
                    style={{
                      marginRight: "1rem",
                      color: getThaaliSizeColor(size),
                      fontWeight: universalSize === size ? "bold" : "normal",
                    }}
                  >
                    {size}
                  </Checkbox>
                ))}
              </Col>
            </Row>
          </>
        )}

        {/* Menu Items Selection */}
        {selectedFamily && menuItems.length > 0 && (
          <>
            <div
              style={{
                fontSize: "1.2rem",
                fontWeight: "bold",
                marginTop: "1.5rem",
                marginBottom: "1rem",
                color: "#1890ff",
              }}
            >
              Individual Item Selections
            </div>
            <Form form={form} layout="vertical">
              {menuItems.map((item: any, index: any) => {
                if (item.nothaali) return null

                return (
                  <Row
                    key={item.id}
                    gutter={16}
                    style={{ marginBottom: "1rem" }}
                  >
                    <Col xs={24} md={12}>
                      <div style={{ fontSize: "1.1rem", fontWeight: "bold" }}>
                        {item.name}
                        {item.sizeRestrictionEnabled && (
                          <span style={{ fontSize: "0.8rem", color: "#faad14", marginLeft: "0.5rem" }}>
                            (Max: {item.maxSize})
                          </span>
                        )}
                      </div>
                      <div style={{ color: "gray", fontSize: "0.9rem" }}>
                        {moment(item.date, "MM-DD-YYYY").format(
                          "dddd, MMM Do YYYY"
                        )}
                      </div>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name={`selection_${item.id}`}
                        style={{ marginBottom: 0 }}
                      >
                        <Select
                          placeholder="Select thaali size"
                          value={selections[item.id]}
                          onChange={(value: any) =>
                            handleSelectionChange(item.id, value)
                          }
                          style={{ width: "100%" }}
                        >
                          {getItemAllowedSizes(item).map((size: any) => (
                            <Option key={size} value={size}>
                              <span style={{ color: getThaaliSizeColor(size) }}>
                                {size}
                              </span>
                            </Option>
                          ))}
                          <Option value="No Thaali">
                            <span style={{ color: "#8c8c8c" }}>No Thaali</span>
                          </Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                )
              })}
            </Form>
          </>
        )}

        {/* Submit Button */}
        {selectedFamily && menuItems.length > 0 && (
          <Row style={{ marginTop: "2rem" }}>
            <Col span={24} style={{ textAlign: "center" }}>
              <Button
                type="primary"
                size="large"
                loading={isSubmitting}
                onClick={handleSubmit}
                style={{ minWidth: "200px" }}
              >
                {hasExistingSubmission ? "Update" : "Submit"} Selections for{" "}
                {selectedFamily?.displayname}
              </Button>
            </Col>
          </Row>
        )}

        {/* Empty States */}
        {!selectedMenu && (
          <Alert
            message="Please select a menu to get started"
            type="info"
            style={{ textAlign: "center", marginTop: "2rem" }}
          />
        )}

        {selectedMenu && !selectedFamily && (
          <Alert
            message="Please select a family to make selections for"
            type="info"
            style={{ textAlign: "center", marginTop: "2rem" }}
          />
        )}

        {selectedMenu && selectedFamily && menuItems.length === 0 && (
          <Alert
            message="This menu has no items available for selection"
            type="warning"
            style={{ textAlign: "center", marginTop: "2rem" }}
          />
        )}
      </Card>
    </MakeSelectionsWrapper>
  )
}

const MakeSelectionsWrapper = styled.div`
  max-width: 1000px;
  margin: auto;

  .ant-select-selector {
    border-radius: 6px;
  }

  .ant-btn-primary {
    border-radius: 6px;
  }

  .ant-card {
    border-radius: 8px;
  }
`

export default MakeSelections
