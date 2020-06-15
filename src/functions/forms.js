//function used recurrently in components with forms (especially in registration and login)

module.exports = {
  onFinishFailed: form => {
    setTimeout(() => {
      let badFields = form.getFieldsError()
      let badFieldNames = []
      for (let field of badFields) {
        if (field.errors.length !== 0) badFieldNames.push(field.name)
      }
      form.resetFields(badFieldNames)
    }, 4000)
  },
}
