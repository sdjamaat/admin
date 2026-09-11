const { test } = require("node:test")
const assert = require("node:assert/strict")
const sgMail = require("@sendgrid/mail")

test("direct Firestore writes cannot send contact emails", async () => {
  const deliveries = []
  const originalSetApiKey = sgMail.setApiKey
  sgMail.setApiKey = () => {} // No provider configuration is needed for offline tests.
  const originalSend = sgMail.send
  const originalSendMultiple = sgMail.sendMultiple
  sgMail.send = async message => deliveries.push(message)
  sgMail.sendMultiple = async message => deliveries.push(message)
  try {
    const { newContactFormSubmission } = require("../lib/index.js")
    await newContactFormSubmission.run(
      {
        data: () => ({
          name: "rbKrpZPpAuSGoDijdFtk",
          email: "bot@example.com",
          phone: "5555550100",
          message: "QXYheJKQETqcuHxsADSo",
          verified: true, // Client-supplied approval must not restore the bypass.
        }),
      },
      {},
    )
    assert.equal(deliveries.length, 0)
  } finally {
    sgMail.setApiKey = originalSetApiKey
    sgMail.send = originalSend
    sgMail.sendMultiple = originalSendMultiple
  }
})

const {
  validateContact,
  verifyTurnstile,
  nextQuota,
  handleContact,
  reserveContact,
} = require("../lib/contact.js")
const valid = {
  name: " Test Visitor ",
  email: " Visitor@Example.com ",
  phone: "+1 (555) 555-0100",
  message: "Please share visiting hours.\nThank you.",
}
const checkCode = code => error => error.code === code

test("valid submissions are normalized without passing client metadata downstream", () => {
  assert.deepEqual(
    validateContact({ ...valid, verified: true, createdAt: 0 }),
    {
      name: "Test Visitor",
      email: "visitor@example.com",
      phone: "+1 (555) 555-0100",
      message: valid.message,
    },
  )
})

test("rejects malformed, empty, oversized, and header-injection fields", () => {
  for (const data of [
    null,
    [],
    {},
    { ...valid, name: " " },
    { ...valid, message: "x".repeat(5001) },
    { ...valid, email: "x@example.com\r\nBcc: victim@example.com" },
    { ...valid, phone: 123 },
    { ...valid, phone: "abc5551234" },
    { ...valid, email: "a@b" },
    { ...valid, name: "\0Visitor" },
  ]) {
    assert.throws(() => validateContact(data), checkCode("invalid-argument"))
  }
})

const okVerification = {
  success: true,
  hostname: "sandiegojamaat.net",
  action: "contact",
}
const fakeResponse = body => async () =>
  new Response(JSON.stringify(body), { status: 200 })

test("verifies token using the private server key and expected action/hostname", async () => {
  await verifyTurnstile(
    "test-token",
    "test-only-secret",
    ["sandiegojamaat.net"],
    async (url, options) => {
      assert.equal(
        url,
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      )
      assert.equal(options.method, "POST")
      assert.equal(options.body.get("response"), "test-token")
      assert.equal(options.body.get("secret"), "test-only-secret")
      assert.ok(options.signal)
      return new Response(JSON.stringify(okVerification))
    },
  )
})

test("fails closed for forged, expired, reused, cross-site, or wrong-action tokens", async () => {
  for (const body of [
    null,
    {},
    { success: "true" },
    { success: false, "error-codes": ["timeout-or-duplicate"] },
    { ...okVerification, hostname: "attacker.example" },
    { ...okVerification, action: "login" },
  ]) {
    await assert.rejects(
      verifyTurnstile(
        "token",
        "test-only-secret",
        ["sandiegojamaat.net"],
        fakeResponse(body),
      ),
      checkCode("permission-denied"),
    )
  }
  for (const token of [undefined, "", "x".repeat(2049), 123]) {
    await assert.rejects(
      verifyTurnstile(token, "test-only-secret", ["sandiegojamaat.net"]),
      checkCode("invalid-argument"),
    )
  }
})

test("missing configuration and verification outages cannot accept a submission", async () => {
  await assert.rejects(
    verifyTurnstile("token", undefined, ["sandiegojamaat.net"]),
    checkCode("failed-precondition"),
  )
  await assert.rejects(
    verifyTurnstile("token", "test-only-secret", []),
    checkCode("failed-precondition"),
  )
  for (const request of [
    async () => {
      throw new Error("timeout")
    },
    async () => new Response("bad", { status: 503 }),
    async () => new Response("not json"),
  ]) {
    await assert.rejects(
      verifyTurnstile(
        "token",
        "test-only-secret",
        ["sandiegojamaat.net"],
        request,
      ),
      checkCode("unavailable"),
    )
  }
})

test("quota accepts the last allowed submission, blocks excess, and resets on expiry", () => {
  assert.deepEqual(nextQuota(undefined, 3, 100), { count: 1, resetAt: 3600100 })
  assert.deepEqual(nextQuota({ count: 2, resetAt: 1000 }, 3, 100), {
    count: 3,
    resetAt: 1000,
  })
  assert.throws(
    () => nextQuota({ count: 3, resetAt: 1000 }, 3, 100),
    checkCode("resource-exhausted"),
  )
  assert.deepEqual(nextQuota({ count: 3, resetAt: 1000 }, 3, 1000), {
    count: 1,
    resetAt: 3601000,
  })
  assert.throws(
    () => nextQuota({ count: -1, resetAt: 1000 }, 3, 100),
    checkCode("resource-exhausted"),
  )
})

test("rejected submissions never reach persistence or email delivery", async () => {
  for (const scenario of [
    "invalid",
    "honeypot",
    "captcha",
    "quota",
    "missing-ip",
  ]) {
    const effects = []
    const input = {
      ...valid,
      turnstileToken: "token",
      ...(scenario === "invalid" ? { name: "" } : {}),
      ...(scenario === "honeypot" ? { website: "spam" } : {}),
    }
    await assert.rejects(
      handleContact(
        input,
        scenario === "missing-ip" ? undefined : "192.0.2.1",
        {
          verify: async () => {
            if (scenario === "captcha") throw new Error("rejected")
          },
          reserve: async () => {
            if (scenario === "quota") throw new Error("limited")
            effects.push("stored")
            return "id"
          },
          send: async () => {
            effects.push("sent")
          },
        },
      ),
    )
    assert.deepEqual(effects, [])
  }
})

test("accepted submissions verify, persist normalized fields, then send once", async () => {
  const effects = []
  const result = await handleContact(
    { ...valid, turnstileToken: "token", website: "" },
    "192.0.2.1",
    {
      verify: async token => {
        assert.equal(token, "token")
        effects.push("verified")
      },
      reserve: async (submission, ip) => {
        assert.equal(ip, "192.0.2.1")
        assert.equal(submission.email, "visitor@example.com")
        assert.equal(submission.turnstileToken, undefined)
        effects.push("stored")
        return "contact-id"
      },
      send: async submission => {
        assert.equal(submission.email, "visitor@example.com")
        effects.push("sent")
      },
    },
  )
  assert.deepEqual(effects, ["verified", "stored", "sent"])
  assert.deepEqual(result, { id: "contact-id" })
})

test("delivery errors propagate instead of claiming success or automatically resending", async () => {
  let sends = 0
  await assert.rejects(
    handleContact({ ...valid, turnstileToken: "token" }, "192.0.2.1", {
      verify: async () => {},
      reserve: async () => "saved-id",
      send: async () => {
        sends++
        throw new Error("mail unavailable")
      },
    }),
    /mail unavailable/,
  )
  assert.equal(sends, 1)
})

// Replace only the external Firestore transport. Exercise the real transaction
// callback and verify that all quota checks precede every staged write.
function memoryFirestore() {
  const records = new Map()
  let sequence = 0
  return {
    records,
    collection: collection => ({
      doc: (id = String(++sequence)) => ({ id, path: `${collection}/${id}` }),
    }),
    runTransaction: async callback => {
      const pending = []
      await callback({
        getAll: async (...refs) =>
          refs.map(ref => ({ data: () => records.get(ref.path) })),
        set: (ref, value) => pending.push([ref.path, value]),
        create: (ref, value) => pending.push([ref.path, value]),
      })
      pending.forEach(([path, value]) => records.set(path, value))
    },
  }
}

test("email quota survives IP changes and rejected transactions create no contact", async () => {
  const db = memoryFirestore()
  for (let i = 0; i < 3; i++)
    await reserveContact(
      db,
      validateContact(valid),
      `192.0.2.${i}`,
      "test-only-secret",
      100,
    )
  await assert.rejects(
    reserveContact(
      db,
      validateContact(valid),
      "192.0.2.4",
      "test-only-secret",
      100,
    ),
    checkCode("resource-exhausted"),
  )
  assert.equal(
    [...db.records.keys()].filter(key => key.startsWith("contact/")).length,
    3,
  )
  assert.equal(db.records.get("contactRateLimits/global").count, 3)
  assert.ok(
    [...db.records.keys()].every(
      key => !key.includes("example.com") && !key.includes("192.0.2."),
    ),
  )
})

test("IP and global quotas bound submissions even when senders rotate email addresses", async () => {
  for (const [limit, sameIP] of [
    [10, true],
    [100, false],
  ]) {
    const db = memoryFirestore()
    for (let i = 0; i < limit; i++)
      await reserveContact(
        db,
        { ...validateContact(valid), email: `visitor${i}@example.com` },
        sameIP ? "192.0.2.1" : `192.0.2.${i}`,
        "test-only-secret",
        100,
      )
    await assert.rejects(
      reserveContact(
        db,
        { ...validateContact(valid), email: "new@example.com" },
        sameIP ? "192.0.2.1" : "192.0.2.200",
        "test-only-secret",
        100,
      ),
      checkCode("resource-exhausted"),
    )
    assert.equal(
      [...db.records.keys()].filter(key => key.startsWith("contact/")).length,
      limit,
    )
  }
})
