import * as functions from "firebase-functions"
const sgMail = require("@sendgrid/mail")
import * as admin from "firebase-admin"
admin.initializeApp(functions.config().firebase)

// sendgrid key
const API_KEY =
  "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"
sgMail.setApiKey(API_KEY)

// template for contact us submission email that is sent to jamaat admins
const TEMPLATE_ID_CONTACT_US_JAMAAT = "d-4809086ff8aa47028fb49d949a05198e"

// template for contact us submission email that is sent to the user who submitted it
const TEMPLATE_ID_CONTACT_US_RECEIPT = "d-968abfbf1d8a4bd7ba4cd520a84dd680"

// templace for new user registration email that is sent to jamaat admins
const TEMPLATE_ID_NEW_USER_REGISTRATION_JAMAAT =
  "d-67342aa81e234d42841ebd0dfac1c003"

// template for new user registration email that is sent to the user
const TEMPLATE_ID_NEW_USER_REGISTRATION_RECIEPT =
  "d-8ab3d1a0fd3647e381a5f5501251c979"

/*
Triggered when a user submits information via the contact us form on the homepage of the website we send two emails
First email: sent to jamaat admins to let them know someone has submitted an inquiry
Second email: sent to the user who submitted information, as a reciept
*/
export const newContactFormSubmission = functions.firestore
  .document("contact/{contactID}")
  .onCreate(async (change, context) => {
    const submission = change.data() || {}
    const jamaat_email = {
      to: ["umoor-dakhiliya@sandiegojamaat.net", "ibrahim.0814@gmail.com"],
      from: "webmaster@sandiegojamaat.net",
      templateId: TEMPLATE_ID_CONTACT_US_JAMAAT,
      dynamic_template_data: {
        name: submission.name,
        email: submission.email,
        phone: submission.phone,
        message: submission.message,
      },
    }

    const reciept_email = {
      to: submission.email,
      from: "webmaster@sandiegojamaat.net",
      templateId: TEMPLATE_ID_CONTACT_US_RECEIPT,
      dynamic_template_data: {
        name: submission.name,
        email: submission.email,
        phone: submission.phone,
        message: submission.message,
      },
    }
    // set the api key for sendgrid
    return Promise.all([
      sgMail.sendMultiple(jamaat_email),
      sgMail.send(reciept_email),
    ])
  })

/*
Triggered when a new user completes all the registration forms on the website and creates an account
We send some of their information to jamaat admins to let them know
*/
export const newUserRegistration = functions.firestore
  .document("users/{userID}")
  .onCreate(async (change, context) => {
    const submission = change.data() || {}
    const jamaat_email = {
      to: ["umoor-dakhiliya@sandiegojamaat.net", "ibrahim.0814@gmail.com"],
      from: "webmaster@sandiegojamaat.net",
      templateId: TEMPLATE_ID_NEW_USER_REGISTRATION_JAMAAT,
      dynamic_template_data: {
        firstname: submission.firstname,
        lastname: submission.lastname,
        email: submission.email,
        phone: submission.phone,
        familyhead: submission.familyhead ? "Yes" : "No",
      },
    }

    const reciept_email = {
      to: submission.email,
      from: "webmaster@sandiegojamaat.net",
      templateId: TEMPLATE_ID_NEW_USER_REGISTRATION_RECIEPT,
      dynamic_template_data: {
        dynamic_template_data: {
          firstname: submission.firstname,
          lastname: submission.lastname,
          email: submission.email,
          phone: submission.phone,
          familyhead: submission.familyhead ? "Yes" : "No",
        },
      },
    }
    return Promise.all([
      sgMail.sendMultiple(jamaat_email),
      sgMail.send(reciept_email),
    ])
  })

/*
Removes an admin user account and deletes data from db
*/
export const deleteAdminAccount = functions.https.onCall(
  async (data, context) => {
    const callerUID = data.caller.uid
    const adminData = await admin
      .firestore()
      .collection("admins")
      .doc(callerUID)
      .get()
    const canManageAdmins = adminData.data().permissions.manage_admin_accounts
    if (canManageAdmins === true) {
      await admin.auth().deleteUser(data.user.uid)
      await admin.firestore().collection("admins").doc(data.user.uid).delete()
    } else {
      throw Error(
        "Insufficient permissions. User is not authorized to perform this action"
      )
    }
  }
)

/*
Deactivates new accounts by default after registeration
*/

export const disableNewRegistration = functions.https.onCall(
  async (data, context) => {
    const callerUID = data.caller.uid
    await admin
      .auth()
      .updateUser(callerUID, {
        // email: 'modifiedUser@example.com',
        // phoneNumber: '+11234567890',
        // emailVerified: true,
        // password: 'newPassword',
        // displayName: 'Jane Doe',
        // photoURL: 'http://www.example.com/12345678/photo.png',
        disabled: true,
      })
      .then(function (userRecord) {
        // See the UserRecord reference doc for the contents of userRecord.
        console.log("Successfully updated user", userRecord.toJSON())
      })
      .catch(function (error) {
        console.log("Error updating user:", error)
      })
  }
)
