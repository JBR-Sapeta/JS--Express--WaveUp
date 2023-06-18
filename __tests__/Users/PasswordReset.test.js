const request = require('supertest');
const bcrypt = require('bcrypt');
const SMTPServer = require('smtp-server').SMTPServer;

const app = require('../../src/app');

const UserModel = require('../../src/model/UserModel');

const en = require('../../locales/en/translation.json');
const pl = require('../../locales/pl/translation.json');

const { TESTING_PORT } = require('../../src/services/MailService');

//----------------------------- TEST SETUP -----------------------------\\

let lastMail, server;
let simulateSmtpFailure = false;

beforeAll(async () => {
  server = new SMTPServer({
    authOptional: true,
    onData(stream, session, callback) {
      let mailBody;
      stream.on('data', (data) => {
        mailBody += data.toString();
      });
      stream.on('end', () => {
        if (simulateSmtpFailure) {
          const err = new Error('Invalid mailbox');
          err.responseCode = 553;
          return callback(err);
        }
        lastMail = mailBody;
        callback();
      });
    },
  });

  server.listen(TESTING_PORT, 'localhost');

  jest.setTimeout(20000);
});

beforeEach(async () => {
  simulateSmtpFailure = false;
  await UserModel.destroy({ truncate: { cascade: true } });
});

afterAll(async () => {
  await server.close();
  jest.setTimeout(5000);
});

//---------------------------- TEST HELPERS ----------------------------\\

const activeUser = {
  accountName: 'user1',
  email: 'user1@mail.com',
  password: 'P4ssword',
  inactive: false,
};

const addUser = async (user = { ...activeUser }) => {
  const hashedPassword = await bcrypt.hash(user.password, 10);
  user.password = hashedPassword;
  return UserModel.create(user);
};

const postPasswordReset = (email = 'user1@mail.com', options = {}) => {
  const agent = request(app).post('/api/v1.0/users/password');
  if (options.language) {
    agent.set('Accept-Language', options.language);
  }
  return agent.send({ email: email });
};

const putPasswordReset = (body = {}, options = {}) => {
  const agent = request(app).put('/api/v1.0/users/password');

  if (options.language) {
    agent.set('Accept-Language', options.language);
  }
  return agent.send(body);
};

//------------------------- INTEGRATION TESTS  -------------------------\\

describe('POST /api/v1.0/users/password', () => {
  describe('Valid request.', () => {
    it('returns 200 ok when a password reset request is sent for valid user', async () => {
      const user = await addUser();
      const response = await postPasswordReset(user.email);
      expect(response.status).toBe(200);
    });

    it('creates passwordResetToken when a password reset request is sent for valid user', async () => {
      const user = await addUser();
      await postPasswordReset(user.email);
      const userInDB = await UserModel.findOne({
        where: { email: user.email },
      });
      expect(userInDB.passwordResetToken).toBeTruthy();
    });

    it('sends a password reset email with passwordResetToken', async () => {
      const user = await addUser();
      await postPasswordReset(user.email);
      const userInDB = await UserModel.findOne({
        where: { email: user.email },
      });
      const passwordResetToken = userInDB.passwordResetToken;
      expect(lastMail).toContain('user1@mail.com');
      expect(lastMail).toContain(passwordResetToken);
    });
  });

  describe('Invalid request.', () => {
    it('returns 404 when a password reset request is send for unknown e-mail', async () => {
      const response = await postPasswordReset();
      expect(response.status).toBe(404);
    });

    it('returns 502 Bad Gateway when sending email fails', async () => {
      simulateSmtpFailure = true;
      const user = await addUser();
      const response = await postPasswordReset(user.email);
      expect(response.status).toBe(502);
    });
  });

  describe('Internationalization.', () => {
    it.each`
      language | message
      ${'pl'}  | ${pl.password_reset_request_success}
      ${'en'}  | ${en.password_reset_request_success}
    `(
      "returns 200 code with '$message' for known email for password reset request when language is set as $language",
      async ({ language, message }) => {
        const user = await addUser();
        const response = await postPasswordReset(user.email, { language });
        expect(response.body.message).toBe(message);
        expect(response.status).toBe(200);
      }
    );

    it.each`
      language | message
      ${'pl'}  | ${pl.email_validation_failure}
      ${'en'}  | ${en.email_validation_failure}
    `(
      "returns 400 code with validation error response having '$message' when request does not have valid email and language is set as $language",
      async ({ language, message }) => {
        const response = await postPasswordReset(null, { language: language });
        expect(response.body.validationErrors.email).toBe(message);
        expect(response.status).toBe(400);
      }
    );

    it.each`
      language | message
      ${'en'}  | ${en.email_not_inuse}
      ${'pl'}  | ${pl.email_not_inuse}
    `(
      "returns error body with '$message' message for unknown email when language is set as $language",
      async ({ language, message }) => {
        const nowInMillis = new Date().getTime();
        const response = await postPasswordReset('user1@mail.com', {
          language: language,
        });
        expect(response.body.path).toBe('/api/v1.0/users/password');
        expect(response.body.timestamp).toBeGreaterThan(nowInMillis);
        expect(response.body.message).toBe(message);
      }
    );

    it.each`
      language | message
      ${'pl'}  | ${pl.nodemailer_failure}
      ${'en'}  | ${en.nodemailer_failure}
    `(
      "returns '$message' when sending email fails amd language is set as $language",
      async ({ language, message }) => {
        simulateSmtpFailure = true;
        const user = await addUser();
        const response = await postPasswordReset(user.email, { language });
        expect(response.body.message).toBe(message);
      }
    );
  });
});

describe('PUT /api/v1.0/users/password', () => {
  describe('Valid request.', () => {
    it('returns 200 when valid password is sent with valid password reset token', async () => {
      const user = await addUser();
      user.passwordResetToken = 'test-token';
      await user.save();
      const response = await putPasswordReset({
        password: 'N3w-Password',
        passwordResetToken: 'test-token',
      });
      expect(response.status).toBe(200);
    });

    it('returns succes message when valid password is sent with valid password reset token', async () => {
      const user = await addUser();
      user.passwordResetToken = 'test-token';
      await user.save();
      const response = await putPasswordReset({
        password: 'N3w-Password',
        passwordResetToken: 'test-token',
      });
      expect(response.body.message).toBe(en.password_update_success);
    });

    it('updates the password in database when the request is valid', async () => {
      const user = await addUser();
      user.passwordResetToken = 'test-token';
      await user.save();
      await putPasswordReset({
        password: 'N3w-password',
        passwordResetToken: 'test-token',
      });
      const userInDB = await UserModel.findOne({
        where: { email: 'user1@mail.com' },
      });
      expect(userInDB.password).not.toEqual(user.password);
    });

    it('clears the reset token in database when the request is valid', async () => {
      const user = await addUser();
      user.passwordResetToken = 'test-token';
      await user.save();
      await putPasswordReset({
        password: 'N3w-password',
        passwordResetToken: 'test-token',
      });
      const userInDB = await UserModel.findOne({
        where: { email: 'user1@mail.com' },
      });
      expect(userInDB.passwordResetToken).toBeFalsy();
    });

    it('activates and clears activation token if the account is inactive after valid password reset', async () => {
      const user = await addUser();
      user.passwordResetToken = 'test-token';
      user.activationToken = 'activation-token';
      user.isInactive = true;
      await user.save();
      await putPasswordReset({
        password: 'N3w-password',
        passwordResetToken: 'test-token',
      });
      const userInDB = await UserModel.findOne({
        where: { email: 'user1@mail.com' },
      });
      expect(userInDB.activationToken).toBeFalsy();
      expect(userInDB.isInactive).toBe(false);
    });
  });

  describe('Invalid request.', () => {
    it('returns 400 code when trying to update with invalid password and the reset token is valid', async () => {
      const user = await addUser();
      user.passwordResetToken = 'test-token';
      await user.save();
      const response = await putPasswordReset({
        password: 'not-valid',
        passwordResetToken: 'test-token',
      });
      expect(response.status).toBe(400);
    });

    it('returns 401 code when password reset token is invalid', async () => {
      const response = await putPasswordReset({
        password: 'P4ssword',
        passwordResetToken: 'abcd',
      });
      expect(response.status).toBe(401);
    });
  });

  describe('Internationalization.', () => {
    it.each`
      language | value              | message
      ${'en'}  | ${null}            | ${en.password_empty}
      ${'en'}  | ${'P4ssw'}         | ${en.password_size}
      ${'en'}  | ${'alllowercase'}  | ${en.password_pattern}
      ${'en'}  | ${'ALLUPPERCASE'}  | ${en.password_pattern}
      ${'en'}  | ${'1234567890'}    | ${en.password_pattern}
      ${'en'}  | ${'lowerandUPPER'} | ${en.password_pattern}
      ${'en'}  | ${'lower4nd5667'}  | ${en.password_pattern}
      ${'en'}  | ${'UPPER44444'}    | ${en.password_pattern}
      ${'pl'}  | ${null}            | ${pl.password_empty}
      ${'pl'}  | ${'P4ssw'}         | ${pl.password_size}
      ${'pl'}  | ${'alllowercase'}  | ${pl.password_pattern}
      ${'pl'}  | ${'ALLUPPERCASE'}  | ${pl.password_pattern}
      ${'pl'}  | ${'1234567890'}    | ${pl.password_pattern}
      ${'pl'}  | ${'lowerandUPPER'} | ${pl.password_pattern}
      ${'pl'}  | ${'lower4nd5667'}  | ${pl.password_pattern}
      ${'pl'}  | ${'UPPER44444'}    | ${pl.password_pattern}
    `(
      "returns '$message' validation message when language is set to $language and the value is $value",
      async ({ language, message, value }) => {
        const user = await addUser();
        user.passwordResetToken = 'test-token';
        await user.save();
        const response = await putPasswordReset(
          { password: value, passwordResetToken: 'test-token' },
          { language: language }
        );
        expect(response.body.validationErrors.password).toBe(message);
      }
    );

    it.each`
      language | message
      ${'pl'}  | ${pl.unauthorized_password_reset}
      ${'en'}  | ${en.unauthorized_password_reset}
    `(
      'returns error body with $message when language is set to $language after trying to update with invalid token',
      async ({ language, message }) => {
        const nowInMillis = new Date().getTime();
        const response = await putPasswordReset(
          { password: 'P4ssword', passwordResetToken: 'abcd' },
          { language }
        );
        expect(response.body.path).toBe('/api/v1.0/users/password');
        expect(response.body.timestamp).toBeGreaterThan(nowInMillis);
        expect(response.body.message).toBe(message);
      }
    );
  });
});
