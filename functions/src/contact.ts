import { createHmac } from "node:crypto"
import { HttpsError } from "firebase-functions/v1/https"
import type { Firestore } from "firebase-admin/firestore"

export interface ContactSubmission {
  name: string
  email: string
  phone: string
  message: string
}

export function validateContact(data: unknown): ContactSubmission {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new HttpsError(
      "invalid-argument",
      "Please check the contact form fields.",
    )
  }
  const input = data as Record<string, unknown>
  const limits = { name: 100, email: 254, phone: 30, message: 5000 }
  const result = {} as ContactSubmission
  for (const field of Object.keys(limits) as (keyof ContactSubmission)[]) {
    const value = input[field]
    if (
      typeof value !== "string" ||
      !value.trim() ||
      value.length > limits[field] ||
      // eslint-disable-next-line no-control-regex -- Reject control characters in user input.
      /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value) ||
      (field !== "message" && /[\r\n]/.test(value))
    ) {
      throw new HttpsError(
        "invalid-argument",
        "Please check the contact form fields.",
      )
    }
    result[field] = value.trim()
  }
  result.email = result.email.toLowerCase()
  if (
    !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(result.email) ||
    !/^[+\d().\s-]+$/.test(result.phone) ||
    result.phone.replace(/\D/g, "").length < 7 ||
    result.phone.replace(/\D/g, "").length > 15
  ) {
    throw new HttpsError(
      "invalid-argument",
      "Please check your email and phone number.",
    )
  }
  return result
}

export async function verifyTurnstile(
  token: unknown,
  secret: string | undefined,
  allowedHostnames: string[],
  request: typeof fetch = fetch,
): Promise<void> {
  if (!secret || !allowedHostnames.length) {
    throw new HttpsError(
      "failed-precondition",
      "The contact form is temporarily unavailable.",
    )
  }
  if (typeof token !== "string" || !token.trim() || token.length > 2048) {
    throw new HttpsError(
      "invalid-argument",
      "Please complete the security check.",
    )
  }
  let result: { success?: boolean; hostname?: string; action?: string }
  try {
    const response = await request(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: new URLSearchParams({ secret, response: token }),
        signal: AbortSignal.timeout(10000),
      },
    )
    if (!response.ok) throw new Error("Verification service unavailable")
    result = await response.json()
  } catch {
    throw new HttpsError(
      "unavailable",
      "Security check unavailable. Please try again.",
    )
  }
  if (
    result?.success !== true ||
    result.action !== "contact" ||
    !allowedHostnames.includes(result.hostname || "")
  ) {
    throw new HttpsError(
      "permission-denied",
      "Security check failed. Please try again.",
    )
  }
}

const HOUR = 60 * 60 * 1000

export function nextQuota(
  current: { count?: number; resetAt?: number } | undefined,
  limit: number,
  now: number,
) {
  const active =
    current && Number.isFinite(current.resetAt) && current.resetAt > now
  const count = active ? current.count : 0
  // Corrupted state must fail closed, not silently reset a quota.
  if (!Number.isInteger(count) || count < 0 || count >= limit) {
    throw new HttpsError(
      "resource-exhausted",
      "Too many submissions. Please try again in an hour.",
    )
  }
  return { count: count + 1, resetAt: active ? current.resetAt : now + HOUR }
}

export async function reserveContact(
  db: Firestore,
  submission: ContactSubmission,
  ip: string,
  secret: string,
  now = Date.now(),
) {
  const key = (value: string) =>
    createHmac("sha256", secret).update(value).digest("hex")
  const quotas = [
    { id: key(`email:${submission.email}`), limit: 3 },
    { id: key(`ip:${ip}`), limit: 10 },
    { id: "global", limit: 100 },
  ].map(quota => ({
    ...quota,
    ref: db.collection("contactRateLimits").doc(quota.id),
  }))
  const contact = db.collection("contact").doc()
  await db.runTransaction(async transaction => {
    const snapshots = await transaction.getAll(
      ...quotas.map(quota => quota.ref),
    )
    const updates = quotas.map((quota, i) =>
      nextQuota(snapshots[i].data(), quota.limit, now),
    )
    quotas.forEach((quota, i) =>
      transaction.set(quota.ref, {
        ...updates[i],
        expiresAt: new Date(updates[i].resetAt),
      }),
    )
    transaction.create(contact, { ...submission, createdAt: new Date(now) })
  })
  return contact.id
}

export async function handleContact(
  data: unknown,
  ip: string | undefined,
  dependencies: {
    verify: (token: unknown) => Promise<void>
    reserve: (submission: ContactSubmission, ip: string) => Promise<string>
    send: (submission: ContactSubmission) => Promise<void>
  },
) {
  const submission = validateContact(data)
  const input = data as Record<string, unknown>
  if (input.website !== undefined && input.website !== "") {
    throw new HttpsError(
      "invalid-argument",
      "Could not submit the contact form.",
    )
  }
  if (!ip)
    throw new HttpsError(
      "unavailable",
      "Could not submit the contact form. Please try again.",
    )
  await dependencies.verify(input.turnstileToken)
  const id = await dependencies.reserve(submission, ip)
  await dependencies.send(submission)
  return { id }
}
