import React from "react"
import styled from "styled-components"
import { Form, Input, Button, InputNumber, Tag, Select } from "antd"
import { onFinishFailed } from "../../../../functions/forms"
const { Option } = Select

const AdminAccountDetails = ({ layout, setStep, values, setValues }) => {
  const [form] = Form.useForm()
  const onFinish = values => {
    setValues({ ...values })
    setStep("review")
  }

  return (
    <AdminAccountDetailsWrapper>
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
          label={`Name`}
          name="name"
          rules={[
            {
              required: true,
              message: "Please input account name",
            },
          ]}
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
    </AdminAccountDetailsWrapper>
  )
}

const AdminAccountDetailsWrapper = styled.div`
  .next-btn {
    padding-top: 0.2rem;
    padding-bottom: 2.2rem;
    font-size: 1.2rem;
    margin-top: 1rem;
  }
`

export default AdminAccountDetails
