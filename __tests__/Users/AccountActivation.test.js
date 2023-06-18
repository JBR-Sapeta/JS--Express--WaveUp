const request = require('supertest');
const SMTPServer = require('smtp-server').SMTPServer;

const app = require('../../src/app');
const { TESTING_PORT } = require('../../src/services/MailService');

const UserModel = require('../../src/model/UserModel');

const en = require('../../locales/en/translation.json');
const pl = require('../../locales/pl/translation.json');

//----------------------------- TEST SETUP -----------------------------\\

let lastMail, server;
let simulateSMTPFailure = false;

beforeAll(async () => {
  server = new SMTPServer({
    authOptional: true,
    onData(stream, session, callback) {
      let mailBody;
      stream.on('data', (data) => {
        mailBody += data.toString();
      });
      stream.on('end', () => {
        if (simulateSMTPFailure) {
          const err = new Error('Invalid mailbox');
          err.responseCode = 553;
          return callback(err);
        }
        lastMail = mailBody;
        callback();
      });
    },
  });
  server.listen(parseInt(TESTING_PORT), 'localhost');
  jest.setTimeout(20000);
});

beforeEach(() => {
  simulateSMTPFailure = false;
  return UserModel.destroy({ truncate: true });
});

afterAll(async () => {
  await server.close();
  jest.setTimeout(5000);
});

//---------------------------- TEST HELPERS ----------------------------\\

const validUserData = {
  accountName: 'user',
  email: 'user@mail.com',
  password: 'Password999',
};

const invalidToken = 'invalid_token';

const postUser = (user = validUserData, options = {}) => {
  const agent = request(app).post('/api/v1.0/users');

  if (options.language) {
    agent.set('Accept-Language', options.language);
  }

  return agent.send(user);
};

const postActivation = (token, options = {}) => {
  const agent = request(app).post('/api/v1.0/users/activate/' + token);

  if (options.language) {
    agent.set('Accept-Language', options.language);
  }

  return agent.send();
};

//------------------------- INTEGRATION TESTS  -------------------------\\
describe('POST /api/v1.0/users/activate/:token', () => {
  describe('Valid request.', () => {
    it('returns 200 status code when activation request is valid', async () => {
      await postUser();
      const users = await UserModel.findAll();
      const token = users[0].activationToken;
      const response = await postActivation(token);
      expect(response.status).toBe(200);
    });

    it('returns sucess message when activation request is valid', async () => {
      await postUser();
      const users = await UserModel.findAll();
      const token = users[0].activationToken;
      const response = await postActivation(token);
      const body = response.body;
      expect(body.message).toBe(en.account_activation_success);
    });

    it('sets activationToken in database to null when activation request is valid', async () => {
      await postUser();
      const users = await UserModel.findAll();
      const token = users[0].activationToken;
      await postActivation(token);
      const user = await UserModel.findAll();
      expect(user[0].activationToken).toBeFalsy();
    });

    it('sets isInactive in database to false when activation request is valid', async () => {
      await postUser();
      const users = await UserModel.findAll();
      const token = users[0].activationToken;
      await postActivation(token);
      const user = await UserModel.findAll();
      expect(user[0].isInactive).toBeFalsy();
    });
  });

  describe('Invalid request.', () => {
    it('returns 400 status code when activation token is invalid', async () => {
      await postUser();
      const response = await postActivation(invalidToken);
      expect(response.status).toBe(400);
    });

    it('returns validation errro message when activation token is invalid', async () => {
      await postUser();
      const response = await postActivation(invalidToken);
      expect(response.body.message).toBe(en.data_validation_failure);
      expect(response.body.validationErrors.token).toBe(
        en.invalid_activation_token
      );
    });

    it("doesn't set activationToken in database to null when activation request is invalid", async () => {
      await postUser();
      await postActivation(invalidToken);
      const users = await UserModel.findAll();
      expect(users[0].activationToken).toBeTruthy();
    });

    it("doesn't sets isInactive in database to false when activation request is invalid", async () => {
      await postUser();
      await postActivation(invalidToken);
      const users = await UserModel.findAll();
      expect(users[0].isInactive).toBeTruthy();
    });
  });

  describe('Internationalization', () => {
    it(`returns succes message '${pl.account_activation_success}' when activation token is invalid and language is set to pl`, async () => {
      await postUser();
      const users = await UserModel.findAll();
      const token = users[0].activationToken;
      const response = await postActivation(token, { language: 'pl' });
      expect(response.body.message).toBe(pl.account_activation_success);
    });

    it(`returns validation errro message '${pl.data_validation_failure}' when activation token is invalid and language is set to pl`, async () => {
      await postUser();
      const response = await postActivation(invalidToken, { language: 'pl' });
      expect(response.body.message).toBe(pl.data_validation_failure);
      expect(response.body.validationErrors.token).toBe(
        pl.invalid_activation_token
      );
    });
  });
});
