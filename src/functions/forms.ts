export const onFinishFailed = (form: any) => {
  setTimeout(() => {
    let badFields = form.getFieldsError()
    let badFieldNames: any[] = []
    for (let field of badFields) {
      if (field.errors.length !== 0) badFieldNames.push(field.name)
    }
    form.resetFields(badFieldNames)
  }, 4000)
}
