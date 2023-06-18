class UnauthorizedError extends Error {
  constructor(message) {
    super(message || 'authentication_failure');
    this.status = 401;
  }
}

module.exports = UnauthorizedError;
