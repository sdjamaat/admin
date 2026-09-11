import * as functions from "firebase-functions/v1"
import sgMail from "@sendgrid/mail"
import { initializeApp } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { getFirestore } from "firebase-admin/firestore"
const admin = { initializeApp, auth: getAuth, firestore: getFirestore }
import { ThaaliSubmissionEmailData } from "./types"
import { myCustomError } from "./logger"
import { handleContact, reserveContact, verifyTurnstile } from "./contact"

admin.initializeApp()

// sendgrid key
const API_KEY = process.env.SENDGRID_API_KEY
sgMail.setApiKey(API_KEY!)

// template for contact us submission email that is sent to jamaat admins
const TEMPLATE_ID_CONTACT_US_JAMAAT = "d-4809086ff8aa47028fb49d949a05198e"

// template for contact us submission email that is sent to the user who submitted it
const TEMPLATE_ID_CONTACT_US_RECEIPT = "d-968abfbf1d8a4bd7ba4cd520a84dd680"

// template for new user registration email that is sent to jamaat admins
const TEMPLATE_ID_NEW_USER_REGISTRATION_JAMAAT =
  "d-67342aa81e234d42841ebd0dfac1c003"

// template for new user registration email that is sent to the user
const TEMPLATE_ID_NEW_USER_REGISTRATION_RECIEPT =
  "d-8ab3d1a0fd3647e381a5f5501251c979"

// template for when a user submits their thaali preferences
const TEMPLATE_ID_THAALI_SUBMISSIONS = "d-e332ce29c6634d60b29322827eeb0d0b"

// Keep the legacy trigger deployed as a no-op so direct client writes cannot
// bypass CAPTCHA or send mail. Remove it in a later cleanup after rules are locked.
export const newContactFormSubmission = functions.firestore
  .document("contact/{contactID}")
  .onCreate(async () => undefined)

export const submitContactForm = functions
  .runWith({ secrets: ["TURNSTILE_SECRET_KEY"], maxInstances: 10 })
  .https.onCall(async (data, context) => {
    const secret = process.env.TURNSTILE_SECRET_KEY
    const hostnames = (process.env.CONTACT_ALLOWED_HOSTNAMES || "")
      .split(",")
      .map(hostname => hostname.trim())
      .filter(Boolean)
    return handleContact(data, context.rawRequest.ip, {
      verify: token => verifyTurnstile(token, secret, hostnames),
      reserve: (submission, ip) =>
        reserveContact(admin.firestore(), submission, ip, secret!),
      send: async submission => {
        try {
          await Promise.all([
            sgMail.sendMultiple({
              to: ["umoor-dakhiliya@sandiegojamaat.net"],
              cc: [
                "ibrahim.0814@gmail.com",
                "qsdoctor@gmail.com",
                "saifees@gmail.com",
                "chhatri@gmail.com",
              ],
              replyTo: submission.email,
              from: "webmaster@sandiegojamaat.net",
              templateId: TEMPLATE_ID_CONTACT_US_JAMAAT,
              dynamicTemplateData: { ...submission },
            }),
            sgMail.send({
              to: submission.email,
              from: "webmaster@sandiegojamaat.net",
              templateId: TEMPLATE_ID_CONTACT_US_RECEIPT,
              dynamicTemplateData: { ...submission },
            }),
          ])
        } catch {
          // Do not log submitted content, tokens, or provider responses with PII.
          functions.logger.error("Contact email delivery failed")
          throw new functions.https.HttpsError(
            "unavailable",
            "Could not deliver your message. Please try again later.",
          )
        }
      },
    })
  })

/*
Triggered when a new user completes all the registration forms on the website and creates an account
We send some of their information to jamaat admins to let them know
*/
export const newUserRegistration = functions.firestore
  .document("users/{userID}")
  .onCreate(async (change) => {
    const submission = change.data() || {}
    const jamaat_email = {
      to: ["umoor-dakhiliya@sandiegojamaat.net"],
      cc: [
        submission.email,
        "ibrahim.0814@gmail.com",
        "qsdoctor@gmail.com",
        "saifees@gmail.com",
        "chhatri@gmail.com",
      ],
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

    const receipt_email = {
      to: submission.email,
      from: "webmaster@sandiegojamaat.net",
      templateId: TEMPLATE_ID_NEW_USER_REGISTRATION_RECIEPT,
      dynamic_template_data: {
        firstname: submission.firstname,
        lastname: submission.lastname,
        email: submission.email,
        phone: submission.phone,
        familyhead: submission.familyhead ? "Yes" : "No",
      },
    }
    return Promise.all([
      sgMail.sendMultiple(jamaat_email),
      sgMail.send(receipt_email),
    ])
  })

/*
Removes an admin user account and deletes data from db
*/
export const deleteAdminAccount = functions.https.onCall(
  async (data: any) => {
    const callerUID = data.caller.uid
    const adminData = await admin
      .firestore()
      .collection("admins")
      .doc(callerUID)
      .get()
    const canManageAdmins = adminData.data()?.permissions.manage_admin_accounts
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
Deactivates new accounts by default after registration
*/
export const disableNewRegistration = functions.https.onCall(
  async (data: any) => {
    const callerUID = data.caller.uid
    await admin
      .auth()
      .updateUser(callerUID, {
        disabled: true,
      })
      .then((userRecord) => {
        console.log("Successfully updated user", userRecord.toJSON())
      })
      .catch((error) => {
        console.log("Error updating user:", error)
      })
  }
)

export const sendEmailAfterThaaliSubmission = functions.https.onCall(
  async (data: ThaaliSubmissionEmailData) => {
    const thaali_submission_email = {
      to: [...data.userEmails],
      from: "webmaster@sandiegojamaat.net",
      replyTo: {
        email: "faizulmawaidilburhaniyah.sd@gmail.com",
        name: "Faiz-ul-Mawaid San Diego",
      },
      templateId: TEMPLATE_ID_THAALI_SUBMISSIONS,
      dynamic_template_data: {
        itemSelections: data.itemSelections,
        hijriMonthName: data.hijriMonthName,
        hijriYear: data.hijriYear,
        familyDisplayName: data.familyDisplayName,
      },
    }

    let sentSuccessfully = false
    let numTry = 0
    const maxRetry = 3

    while (sentSuccessfully === false && numTry < maxRetry) {
      numTry += 1
      try {
        await sgMail.sendMultiple(thaali_submission_email)
        sentSuccessfully = true
        return Promise.resolve()
      } catch (err) {
        myCustomError(
          "Failed to send thaali confirmation email, error is attached here:",
          err
        )
      }
    }
    return Promise.resolve()
  }
)
