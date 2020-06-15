import React from "react"
import styled from "styled-components"
import { Form, Input, Button, InputNumber, Tag, Select } from "antd"
import { onFinishFailed } from "../../functions/forms"
const { Option } = Select

const AccountDetails = ({ layout, setStep, values, setValues }) => {
  const [form] = Form.useForm()
  const onFinish = values => {
    setValues({ ...values })
    setStep("personal-details")
  }

  return (
    <AccountDetailsWrapper>
      <div style={{ textAlign: "center" }}>
        <Tag
          className="float-center"
          color="geekblue"
          style={{
            fontSize: "1.1rem",
            padding: ".3rem",
            marginBottom: "1rem",
          }}
        >
          Account Details
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
          label="Head of family?"
          name="familyhead"
          rules={[
            { required: true, message: "Please select if head of family" },
          ]}
        >
          <Select>
            <Option value={true}>Yes</Option>
            <Option value={false}>No</Option>
          </Select>
        </Form.Item>
        <Form.Item
          label="ITS #"
          name="its"
          rules={[{ required: true, message: "Please input your ITS number" }]}
        >
          <InputNumber style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          label="First name:"
          name="firstname"
          rules={[{ required: true, message: "Please input your first name" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Last name:"
          name="lastname"
          rules={[{ required: true, message: "Please input your last name" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Email:"
          name="email"
          rules={[
            {
              required: true,
              message: "Please input your email",
            },
            {
              type: "email",
              message: "Email is invalid",
            },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[
            { required: true, message: "Please input your password" },
            () => ({
              validator(rule, value) {
                const passw = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,200}$/
                if (!value || value.match(passw)) {
                  return Promise.resolve()
                }
                return Promise.reject(
                  "Password must be at least 6 characters long and must contain a digit and an uppercase letter"
                )
              },
            }),
          ]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item
          label="Confirm password"
          name="confirmpassword"
          dependencies={["password"]}
          rules={[
            {
              required: true,
              message: "Please confirm your password",
            },
            ({ getFieldValue }) => ({
              validator(rule, value) {
                if (!value || getFieldValue("password") === value) {
                  return Promise.resolve()
                }

                return Promise.reject(
                  "The two passwords that you entered do not match"
                )
              },
            }),
          ]}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            className="float-right next-btn"
          >
            Next
          </Button>
        </Form.Item>
      </Form>
    </AccountDetailsWrapper>
  )
}

const AccountDetailsWrapper = styled.div`
  .next-btn {
    padding-top: 0.2rem;
    padding-bottom: 2.2rem;
    font-size: 1.2rem;
    margin-top: 1rem;
  }
`

export default AccountDetails
