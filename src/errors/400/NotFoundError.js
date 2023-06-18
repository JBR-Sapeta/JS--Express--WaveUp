class NotFoundError extends Error {
  constructor(message) {
    super(message || 'not_found');
    this.status = 404;
  }
}

module.exports = NotFoundError;
