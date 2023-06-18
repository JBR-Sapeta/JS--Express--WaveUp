class ForbiddenError extends Error {
  constructor(message) {
    super(message || 'forbidden');
    this.status = 403;
  }
}

module.exports = ForbiddenError;
