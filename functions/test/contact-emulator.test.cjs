const { test } = require('node:test')
const assert = require('node:assert/strict')
const { initializeApp, deleteApp } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const { reserveContact } = require('../lib/contact')

test('real Firestore transactions enforce contact quotas under concurrent requests', {
  skip: !process.env.FIRESTORE_EMULATOR_HOST,
  timeout: 120000,
}, async () => {
  // Fail closed rather than permitting this fixture to touch a live project.
  assert.match(process.env.FIRESTORE_EMULATOR_HOST, /^(127\.0\.0\.1|localhost):\d+$/)
  const app = initializeApp({ projectId: 'demo-sdj-security' }, 'contact-concurrency')
  const db = getFirestore(app)
  try {
    const submission = { name: 'Emulator test', email: 'test@example.invalid', phone: '+15555550123', message: 'Local fixture' }
    const results = await Promise.allSettled(Array.from({ length: 20 }, () =>
      reserveContact(db, submission, '127.0.0.1', 'emulator-only-secret')))
    assert.equal(results.filter(result => result.status === 'fulfilled').length, 3)
    for (const result of results.filter(result => result.status === 'rejected')) {
      assert.equal(result.reason.code, 'resource-exhausted')
    }
    assert.equal((await db.collection('contact').get()).size, 3)
    const quotas = await db.collection('contactRateLimits').get()
    assert.equal(quotas.size, 3)
    for (const quota of quotas.docs) assert.equal(quota.data().count, 3)
  } finally {
    await deleteApp(app)
  }
})
