import React, { useState } from "react"
import Layout from "../components/layout"
import styled from "styled-components"
import { Form, Input, Button, Card, message, Spin } from "antd"
import { onFinishFailed } from "../functions/forms"
import firebase from "gatsby-plugin-firebase"
import { navigate } from "gatsby"

const layout = {
  labelCol: { span: 16 },
  wrapperCol: { span: 24 },
}

message.config({
  top: 100,
  duration: 4,
  maxCount: 3,
})

const Message = ({ message }) => {
  return (
    <>
      <br />
      <div>{message}</div>
    </>
  )
}

const ForgotPasswordForm = () => {
  const [form] = Form.useForm()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const onSubmit = values => {
    setIsSubmitting(true)
    firebase
      .auth()
      .sendPasswordResetEmail(values.email)
      .then(() => {
        message.success({
          content: (
            <Message
              message={`Password reset email sent! Check your inbox for further instructions`}
            />
          ),
        })
      })
      .catch(error => {
        message.error({
          content: <Message message={`Error: ${error.message}`} />,
        })
      })
      .finally(() => setIsSubmitting(false))
  }

  return (
    <Card
      title="Reset Password"
      headStyle={{ fontSize: "1.7rem", textAlign: "center" }}
    >
      <Spin spinning={isSubmitting}>
        <Form
          {...layout}
          form={form}
          onFinish={onSubmit}
          initialValues={{ email: null }}
          onFinishFailed={() => onFinishFailed(form)}
          layout="vertical"
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Please input your email" },
              { type: "email", message: "Email is not valid" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" className="submit mod-btn">
              Submit
            </Button>
          </Form.Item>

          <Form.Item>
            <Button className=" mod-btn" onClick={() => navigate("/login")}>
              Back to Login
            </Button>
          </Form.Item>
        </Form>
      </Spin>
    </Card>
  )
}

export default () => {
  return (
    <Layout>
      <ForgotPasswordWrapper>
        <div className="content">
          <ForgotPasswordForm />
        </div>
      </ForgotPasswordWrapper>
    </Layout>
  )
}

const ForgotPasswordWrapper = styled.div`
  .content {
    max-width: 500px;
    margin: auto;
    padding-top: 5%;
  }

  .mod-btn {
    width: 100%;
    padding-top: 0.3rem;
    padding-bottom: 2.3rem;
    font-size: 1.3rem;
  }

  .submit {
    margin-top: 1rem;
  }
`
