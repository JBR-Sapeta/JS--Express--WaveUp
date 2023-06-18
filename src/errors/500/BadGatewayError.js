class BadGatewayError extends Error {
  constructor(message) {
    super(message || 'bad_gateway_error');
    this.status = 502;
  }
}

module.exports = BadGatewayError;
