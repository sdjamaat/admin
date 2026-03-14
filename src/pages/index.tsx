import React, { useState, useContext } from "react"
import Layout from "../components/layout"
import styled from "styled-components"
import { Form, Input, Button, Card, Spin } from "antd"
import { onFinishFailed } from "../functions/forms"
import { useNavigate } from "react-router-dom"
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "../lib/firebase"
import { AuthContext } from "../provider/auth-context"
import useComponentWillMount from "../custom-hooks/component-will-mount"
import CustomMessage from "../components/custom-message"

const layout = {
  labelCol: { span: 16 },
  wrapperCol: { span: 24 },
}

const getAndSetUserInformation = async (uid: string, localEncryptedStore: any) => {
  try {
    const docSnap = await getDoc(doc(db, "admins", uid))
    if (docSnap.exists()) {
      const userInfo = docSnap.data()
      if (userInfo.admin === true) {
        localEncryptedStore.set("authUser", {
          admin: userInfo.admin,
          uid: uid,
          name: userInfo.name,
          email: userInfo.email,
          permissions: userInfo.permissions,
        })
      } else {
        return false
      }
    } else {
      return false
    }
  } catch (err) {
    console.log(err)
    return false
  }
  return true
}

const LoginForm = () => {
  const navigate = useNavigate()
  const { isLoggedIn, setIsLoggedIn, localEncryptedStore, setCurrUser } = useContext(AuthContext)

  useComponentWillMount(() => {
    if (isLoggedIn) {
      navigate("/auth/admin")
    }
  })
  const [form] = Form.useForm()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSubmit = async (values: any) => {
    if (isSubmitting) {
      try {
        await setPersistence(auth, browserLocalPersistence)
        const response = await signInWithEmailAndPassword(auth, values.email, values.password)
        if (response.user.uid) {
          const isAdmin = await getAndSetUserInformation(response.user.uid, localEncryptedStore)
          if (isAdmin) {
            setIsLoggedIn(true)
            setCurrUser(localEncryptedStore.get("authUser"))
            navigate("/auth/admin")
          } else {
            throw { message: "Unauthorized" }
          }
        } else {
          CustomMessage("error", "Something went wrong while logging in")
        }
      } catch (error: any) {
        CustomMessage("error", error.message)
      } finally {
        setIsSubmitting(false)
      }
    } else {
      setIsSubmitting(false)
    }
  }

  return (
    <Card title="Admin Login" headStyle={{ fontSize: "1.7rem", textAlign: "center" }}>
      <Spin spinning={isSubmitting}>
        <Form
          {...layout}
          form={form}
          onFinish={onSubmit}
          initialValues={{ email: null, password: null }}
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
          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Please input your password" }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" className="submit mod-btn" htmlType="submit" onClick={() => setIsSubmitting(true)}>
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Spin>
    </Card>
  )
}

const Login = () => {
  return (
    <Layout>
      <LoginWrapper>
        <div className="content">
          <LoginForm />
        </div>
      </LoginWrapper>
    </Layout>
  )
}

const LoginWrapper = styled.div`
  .content {
    max-width: 500px;
    margin: auto;
    padding-top: 5%;
  }
  .mod-btn {
    width: 100%;
    height: 2.8rem;
    font-size: 1.3rem;
  }
  .submit {
    margin-top: 1rem;
  }
`

export default Login
