import * as functions from "firebase-functions"

const errorToMetadata = err => {
  return {
    metadata: {
      ...err,
      message: err.message,
      stack: err.stack,
    },
  }
}

const formatMetadata = payload => {
  if (payload instanceof Error) {
    return errorToMetadata(payload)
  }

  const payloadType = typeof payload
  if (payloadType === "object") {
    return { metadata: { ...payload } }
  }

  return { metadata: payload }
}

export const myCustomError = (message, data) => {
  const formattedMetadata = formatMetadata(data)

  functions.logger.error(message, formattedMetadata)
}
