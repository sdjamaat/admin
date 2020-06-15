import React from "react"
import styled from "styled-components"
import { Form, Input, Button, InputNumber, Tag, Select, message } from "antd"
import { onFinishFailed } from "../../functions/forms"
const { Option } = Select

const FamilyDetails = ({ layout, setStep, values, setValues }) => {
  const [form] = Form.useForm()
  const onFinish = values => {
    setValues({ ...values })
    if (values.size <= 0) {
      message.error("Family size cannot be 0 or less")
    } else if (values.size === 1) {
      setStep("review")
    } else {
      setStep("family-member-details")
    }
  }

  return (
    <FamilyDetailsWrapper>
      <div style={{ textAlign: "center" }}>
        <Tag
          className="float-center"
          color="geekblue"
          style={{ fontSize: "1.1rem", padding: ".3rem", marginBottom: "1rem" }}
        >
          Family Details
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
          label="# Family members in household (incl. you)"
          name="size"
          rules={[
            {
              required: true,
              message: "Please input number of family members",
            },
          ]}
        >
          <InputNumber style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          label="Move status"
          name="movestatus"
          rules={[{ required: true }]}
        >
          <Select>
            <Option value="Temporary">Temporary</Option>
            <Option value="Permanent">Permanent</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Address (num & street):"
          name={["address", "street"]}
          rules={[
            { required: true, message: "Please input your address street" },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="City:"
          name={["address", "city"]}
          rules={[
            { required: true, message: "Please input your address city" },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Zip code:"
          name={["address", "zip"]}
          rules={[
            { required: true, message: "Please input your address zip code" },
          ]}
        >
          <InputNumber style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          label="Faiz-ul-Mawaid status"
          name="fmbstatus"
          rules={[{ required: true }]}
        >
          <Select>
            <Option value="Not enrolled">Not enrolled</Option>
            <Option value="Full">Enrolled - Full thaali</Option>
            <Option value="Half">Enrolled - Half thaali</Option>
            <Option value="Barakati">Enrolled - Barakati thaali</Option>
          </Select>
        </Form.Item>
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
            Next
          </Button>
        </Form.Item>
      </Form>
    </FamilyDetailsWrapper>
  )
}

const FamilyDetailsWrapper = styled.div`
  .next-btn {
    padding-top: 0.2rem;
    padding-bottom: 2.2rem;
    font-size: 1.2rem;
    margin-top: 1rem;
  }
`

export default FamilyDetails
