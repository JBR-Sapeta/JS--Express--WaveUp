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

beforeEach(async () => {
  simulateSMTPFailure = false;
  await UserModel.destroy({ truncate: { cascade: true } });
});

afterAll(async () => {
  await server.close();
  jest.setTimeout(5000);
});

//---------------------------- TEST HELPERS ----------------------------\\

const activAdmin = {
  accountName: 'user',
  email: 'user@mail.com',
  password: 'P4assword',
  isInactive: false,
  isAdmin: true,
};

const adminAuth = { email: 'user@mail.com', password: 'P4assword' };

const activeUser = {
  accountName: 'user1',
  email: 'user1@mail.com',
  password: 'P4assword',
  isInactive: false,
  isAdmin: false,
};

const userAuth = { email: 'user1@mail.com', password: 'P4assword' };

const addAdmin = async (user = { ...activAdmin }) => {
  const hash = await bcrypt.hash(user.password, 12);
  user.password = hash;
  const userData = await UserModel.create(user);
  return userData;
};

const addUser = async (user = { ...activeUser }) => {
  const hash = await bcrypt.hash(user.password, 12);
  user.password = hash;
  const userData = await UserModel.create(user);
  return userData;
};

const getToken = async (body = adminAuth) => {
  const response = await request(app).post('/api/v1.0/users/auth').send(body);
  return response.body.token;
};

const putBan = (userId, options = {}) => {
  const agent = request(app).put(`/api/v1.0/admin/users/ban/${userId}`);

  if (options.language) {
    agent.set('Accept-Language', options.language);
  }

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  return agent.send({});
};

//------------------------- INTEGRATION TESTS  -------------------------\\

describe('PUT /api/v1.0/admin/users/ban/:userId', () => {
  describe('Valid Request', () => {
    it('returns 200 code when request is valid', async () => {
      const user = await addUser();
      await addAdmin();
      const token = await getToken();
      const response = await putBan(user.id, { token });
      expect(response.status).toBe(200);
    });

    it('returns success mesage when request is valid', async () => {
      const user = await addUser();
      await addAdmin();
      const token = await getToken();
      const response = await putBan(user.id, { token });
      expect(response.body.message).toBe(en.ban_success);
    });

    it('sets hasBan property to true in database ', async () => {
      const user = await addUser();
      await addAdmin();
      const token = await getToken();
      await putBan(user.id, { token });
      const userInDB = await UserModel.findByPk(user.id);
      expect(userInDB.hasBan).toBe(true);
    });

    it('sends information mail to user who received a ban', async () => {
      const user = await addUser();
      const admin = await addAdmin();
      const token = await getToken();
      await putBan(user.id, { token });
      expect(lastMail).toContain(user.email);
      expect(lastMail).toContain(admin.accountName);
    });
  });

  describe('Invalid Request', () => {
    it('returns 401 code when request is send without token', async () => {
      const user = await addUser();
      await addAdmin();
      const response = await putBan(user.id);
      expect(response.status).toBe(401);
    });

    it('returns 403 code when request is send by user that is not an admin', async () => {
      const admin = await addAdmin();
      await addUser();
      const token = await getToken(userAuth);
      const response = await putBan(admin.id, { token });
      expect(response.status).toBe(403);
    });

    it('returns 404 code when request is send for user that does not exist', async () => {
      await addAdmin();
      const token = await getToken();
      const response = await putBan('does_not_exist', { token });
      expect(response.status).toBe(404);
    });

    it('returns 502 Bad Gateway when sending information mail fails', async () => {
      simulateSMTPFailure = true;
      const user = await addUser();
      await addAdmin();
      const token = await getToken();
      const response = await putBan(user.id, { token });
      expect(response.status).toBe(502);
    });
  });

  describe('Internationalization', () => {
    it.each`
      language | message
      ${'en'}  | ${en.ban_success}
      ${'pl'}  | ${pl.ban_success}
    `(
      'returns success message "$message" when request is valid and the language is set as "$language"',
      async ({ language, message }) => {
        const user = await addUser();
        await addAdmin();
        const token = await getToken();
        const response = await putBan(user.id, { token, language });
        expect(response.body.message).toBe(message);
      }
    );

    it.each`
      language | message
      ${'en'}  | ${en.authentication_failure}
      ${'pl'}  | ${pl.authentication_failure}
    `(
      'returns error message "$message" when request is send without tokenand and the language is set as "$language"',
      async ({ language, message }) => {
        const user = await addUser();
        await addAdmin();
        const response = await putBan(user.id, { language });
        expect(response.body.message).toBe(message);
      }
    );

    it.each`
      language | message
      ${'en'}  | ${en.unauthorized_ban}
      ${'pl'}  | ${pl.unauthorized_ban}
    `(
      'returns error message "$message" when request is send by user that is not an admin and the language is set as "$language"',
      async ({ language, message }) => {
        const admin = await addAdmin();
        await addUser();
        const token = await getToken(userAuth);
        const response = await putBan(admin.id, { token, language });
        expect(response.body.message).toBe(message);
      }
    );

    it.each`
      language | message
      ${'en'}  | ${en.user_not_found}
      ${'pl'}  | ${pl.user_not_found}
    `(
      'returns error message "$message" when request is send for post that does not exist and the language is set as "$language"',
      async ({ language, message }) => {
        await addAdmin();
        const token = await getToken();
        const response = await putBan('does_not_exist', { token, language });
        expect(response.body.message).toBe(message);
      }
    );

    it.each`
      language | message
      ${'en'}  | ${en.nodemailer_failure}
      ${'pl'}  | ${pl.nodemailer_failure}
    `(
      "returns error message '$message' when sending email fails and language is set as '$language'",
      async ({ language, message }) => {
        simulateSMTPFailure = true;
        const user = await addUser();
        await addAdmin();
        const token = await getToken();
        const response = await putBan(user.id, { token, language });
        expect(response.body.message).toBe(message);
      }
    );
  });
});
