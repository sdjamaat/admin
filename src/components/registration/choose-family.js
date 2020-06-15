import React, { useState, useEffect } from "react"
import styled from "styled-components"
import { Form, Button, Tag, Select, message, Alert } from "antd"
import { onFinishFailed } from "../../functions/forms"
const { Option } = Select

const ChooseFamily = ({ layout, setStep, values, setValues, families }) => {
  const [form] = Form.useForm()

  const [familyIndex, setFamilyIndex] = useState(values.familyindex)

  useEffect(() => {}, [familyIndex])

  const onFinish = values => {
    if (!values.hasOwnProperty("memberindex")) {
      message.error(
        "Cannot move forward without selecting an eligible family member"
      )
    } else if (
      values.memberindex >= families[values.familyindex].members.length
    ) {
      message.error("Invalid member selection")
    } else {
      setValues({
        ...families[values.familyindex],
        memberindex: values.memberindex,
        familyindex: values.familyindex,
      })
      setStep("review")
    }
  }

  const handleFamilySelection = value => {
    setFamilyIndex(value)
  }

  const shouldShowMemberSelection = () => {
    for (let member of families[familyIndex].members) {
      if (member.uid === null) {
        return true
      }
    }
    return false
  }

  return (
    <ChooseFamilyWrapper>
      <div style={{ textAlign: "center" }}>
        <Tag
          className="float-center"
          color="geekblue"
          style={{ fontSize: "1.1rem", padding: ".3rem", marginBottom: "1rem" }}
        >
          Choose Family
        </Tag>
      </div>

      <Form
        {...layout}
        form={form}
        initialValues={values}
        onFinish={onFinish}
        onFinishFailed={() => onFinishFailed(form)}
        layout="vertical"
      >
        <Form.Item
          label="Family affiliation"
          name="familyindex"
          rules={[
            { required: true, message: "Please input family affiliation" },
          ]}
        >
          <Select onChange={handleFamilySelection}>
            {families.map((family, index) => {
              return (
                <Option key={index} value={index}>
                  {family.displayname}
                </Option>
              )
            })}
          </Select>
        </Form.Item>

        {shouldShowMemberSelection() ? (
          <Form.Item
            label="Member"
            name="memberindex"
            rules={[
              {
                required: true,
                message: "Please input family member selection",
              },
            ]}
          >
            <Select>
              {families[familyIndex].members.map((member, index) => {
                if (member.uid === null) {
                  return (
                    <Option key={index} value={index}>
                      {member.firstname}
                    </Option>
                  )
                } else {
                  return <></>
                }
              })}
            </Select>
          </Form.Item>
        ) : (
          <Alert
            message="All eligible members are already registered for this family"
            type="warning"
          />
        )}

        <Form.Item>
          <Button
            onClick={() => setStep("personal-details")}
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
    </ChooseFamilyWrapper>
  )
}

const ChooseFamilyWrapper = styled.div`
  .next-btn {
    padding-top: 0.2rem;
    padding-bottom: 2.2rem;
    font-size: 1.2rem;
    margin-top: 1rem;
  }
`

export default ChooseFamily
