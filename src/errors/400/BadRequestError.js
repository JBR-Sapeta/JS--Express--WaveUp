class BadRequestError extends Error {
  constructor(errors, message = 'data_validation_failure') {
    super(message);
    this.status = 400;
    this.errors = errors;
  }
}

module.exports = BadRequestError;
