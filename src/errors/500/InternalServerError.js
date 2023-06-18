class InternalServerError extends Error {
  constructor() {
    super('internal_server_error');
    this.status = 500;
  }
}

module.exports = InternalServerError;
