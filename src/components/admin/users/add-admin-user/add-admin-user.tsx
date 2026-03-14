import React, { useState, useEffect } from "react"
import { cloneDeep } from "lodash"
import styled from "styled-components"
import { Card, message, Spin } from "antd"
import AdminAccountDetails from "./admin-account-details"
import ReviewAdminAccountDetails from "./review-admin-details"
import { db, auth } from "../../../../lib/firebase"
import { doc, setDoc } from "firebase/firestore"
import { createUserWithEmailAndPassword } from "firebase/auth"
import CustomMessage from "../../../custom-message"

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 },
}

const AddAdminUser = ({ setPage }: any) => {
  const [step, setStep] = useState("account-details")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [accountDetails, setAccountDetails] = useState({
    email: null,
    name: null,
    password: null,
    confirmpassword: null,
  })

  const getCurrentForm = (step: any) => {
    switch (step) {
      case "account-details":
        return (
          <AdminAccountDetails
            layout={layout}
            setStep={setStep}
            values={accountDetails}
            setValues={setAccountDetails}
          />
        )

      case "review":
        return (
          <ReviewAdminAccountDetails
            setStep={setStep}
            accountDetails={accountDetails}
            submitForm={submitForm}
          />
        )
      default:
        return (
          <AdminAccountDetails
            layout={layout}
            setStep={setStep}
            values={accountDetails}
            setValues={setAccountDetails}
          />
        )
    }
  }

  const writeUserData = async (uid: any, metadata: any) => {
    await setDoc(doc(db, "admins", uid), {
      ...metadata,
    })
  }

  const submitForm = async () => {
    setIsSubmitting(true)

    const metadata = {
      email: accountDetails.email,
      name: accountDetails.name,
      admin: true,
      permissions: {
        manage_user_accounts: true,
        manage_admin_accounts: false,
        fmb: false,
      },
    }
    try {
      const newUser = await createUserWithEmailAndPassword(
        auth,
        accountDetails.email!,
        accountDetails.password!
      )

      if (newUser) {
        await writeUserData(newUser.user.uid, {
          ...metadata,
          uid: newUser.user.uid,
        })
      }
      setTimeout(() => {
        setPage("users-manage-accounts")
      }, 3000)

      CustomMessage(
        "success",
        "Successfully registered admin account. Redirecting to 'Manage Accounts' tab..."
      )
    } catch (error: any) {
      console.log(error)
      CustomMessage("error", error.message)
    }
    setIsSubmitting(false)
  }

  return (
    <AddAdminUserWrapper>
      <div className="content">
        <Card
          title="New Admin User"
          headStyle={{ fontSize: "1.5rem", textAlign: "center" }}
          bodyStyle={{ paddingBottom: "0" }}
        >
          <Spin spinning={isSubmitting}>{getCurrentForm(step)}</Spin>
        </Card>
      </div>
    </AddAdminUserWrapper>
  )
}

const AddAdminUserWrapper = styled.div`
  .content {
    max-width: 1000px;
    margin: auto;
  }
`

export default AddAdminUser
