const request = require('supertest');
const bcrypt = require('bcrypt');

const app = require('../../src/app');

const UserModel = require('../../src/model/UserModel');

const en = require('../../locales/en/translation.json');
const pl = require('../../locales/pl/translation.json');

//----------------------------- TEST SETUP -----------------------------\\

beforeEach(async () => {
  await UserModel.destroy({ truncate: { cascade: true } });
});

//---------------------------- TEST HELPERS ----------------------------\\

const activeUser = {
  accountName: 'user',
  email: 'user@mail.com',
  password: 'P4assword',
  isInactive: false,
};
const activeUserCredentials = { email: 'user@mail.com', password: 'P4assword' };

const inactiveUser = {
  accountName: 'user1',
  email: 'user1@mail.com',
  password: 'P4assword',
  isInactive: true,
};
const inactiveUserCredentials = {
  email: 'user1@mail.com',
  password: 'P4assword',
};

const addUser = async (user = { ...activeUser }) => {
  const hashedPassword = await bcrypt.hash(user.password, 10);
  user.password = hashedPassword;
  return UserModel.create(user);
};

const putPasswordUpdate = async (userId = 1, body = null, options = {}) => {
  let token;
  let agent = request(app);

  if (options.auth) {
    const response = await agent
      .post('/api/v1.0/users/auth')
      .send(options.auth);
    token = response.body.token;
  }

  agent = request(app).put(`/api/v1.0/users/password/${userId}`);

  if (options.language) {
    agent.set('Accept-Language', options.language);
  }

  if (token) {
    agent.set('Authorization', `Bearer ${token}`);
  }

  return agent.send(body);
};

//------------------------- INTEGRATION TESTS  -------------------------\\

describe('PUT /api/v1.0/users/password/:userId', () => {
  describe('Valid request.', () => {
    it('returns 200 code when valid update request send from authorized user', async () => {
      const user = await addUser();
      const body = {
        password: activeUser.password,
        newPassword: 'N3wPassword',
      };
      const response = await putPasswordUpdate(user.id, body, {
        auth: activeUserCredentials,
      });
      expect(response.status).toBe(200);
    });

    it('returns succes message when valid update request send from authorized user', async () => {
      const user = await addUser();
      const body = {
        password: activeUser.password,
        newPassword: 'N3wPassword',
      };
      const response = await putPasswordUpdate(user.id, body, {
        auth: activeUserCredentials,
      });
      expect(response.body.message).toBe(en.password_update_success);
    });

    it('updates password in database when valid request send from authorized user', async () => {
      const user = await addUser();
      const body = {
        password: activeUser.password,
        newPassword: 'N3wPassword',
      };
      await putPasswordUpdate(user.id, body, {
        auth: activeUserCredentials,
      });
      const userInDB = await UserModel.findOne({ where: { id: user.id } });
      const passwordMatch = await bcrypt.compare(
        body.newPassword,
        userInDB.password
      );
      expect(passwordMatch).toBeTruthy();
    });
  });

  describe('Invalid request.', () => {
    it('returns 400 code when request body is send without new password', async () => {
      const user = await addUser();
      const body = {
        password: activeUser.password,
      };
      const response = await putPasswordUpdate(user.id, body, {
        auth: activeUserCredentials,
      });
      expect(response.status).toBe(400);
    });

    it('returns 400 code when request body is send without password', async () => {
      const user = await addUser();
      const body = {
        newPassword: 'N3wPassword',
      };
      const response = await putPasswordUpdate(user.id, body, {
        auth: activeUserCredentials,
      });
      expect(response.status).toBe(400);
    });

    it('returns 401 code when request body is send with invalid password', async () => {
      const user = await addUser();
      const body = {
        password: 'InvalidPassword',
        newPassword: 'N3wPassword',
      };
      const response = await putPasswordUpdate(user.id, body, {
        auth: activeUserCredentials,
      });
      expect(response.status).toBe(401);
    });

    it('returns 401 code when request is send without token', async () => {
      const user = await addUser();
      const body = {
        password: activeUser.password,
        newPassword: 'N3wPassword',
      };
      const response = await putPasswordUpdate(user.id, body);
      expect(response.status).toBe(401);
    });

    it('returns 401 code when request is send by inactive user with correct credentials', async () => {
      const user = await addUser(inactiveUser);
      const body = {
        password: inactiveUser.password,
        newPassword: 'N3wPassword',
      };
      const response = await putPasswordUpdate(user.id, body, {
        auth: inactiveUserCredentials,
      });
      expect(response.status).toBe(401);
    });

    it('returns 403 code when request is send by other authenticated user', async () => {
      await addUser();
      const otherUser = await addUser(inactiveUser);
      const body = {
        password: activeUser.password,
        newPassword: 'N3wPassword',
      };
      const response = await putPasswordUpdate(otherUser.id, body, {
        auth: activeUserCredentials,
      });
      expect(response.status).toBe(403);
    });
  });

  describe('Internationalization.', () => {
    it.each`
      language | message
      ${'en'}  | ${en.password_update_success}
      ${'pl'}  | ${pl.password_update_success}
    `(
      "returns '$message' message when valid update request send from authorized user and language is set to $language",
      async ({ language, message }) => {
        const user = await addUser();
        const body = {
          password: activeUser.password,
          newPassword: 'N3wPassword',
        };
        const response = await putPasswordUpdate(user.id, body, {
          auth: activeUserCredentials,
          language,
        });
        expect(response.body.message).toBe(message);
      }
    );

    it.each`
      language | message
      ${'en'}  | ${en.authentication_failure}
      ${'pl'}  | ${pl.authentication_failure}
    `(
      "returns '$message' when request send without token and language is set to $language",
      async ({ language, message }) => {
        const user = await addUser();
        const body = {
          password: activeUser.password,
          newPassword: 'N3wPassword',
        };
        const nowInMillis = new Date().getTime();
        const response = await putPasswordUpdate(user.id, body, { language });
        expect(response.body.path).toBe(`/api/v1.0/users/password/${user.id}`);
        expect(response.body.timestamp).toBeGreaterThan(nowInMillis);
        expect(response.body.message).toBe(message);
      }
    );

    it.each`
      language | message
      ${'en'}  | ${en.authentication_failure}
      ${'pl'}  | ${pl.authentication_failure}
    `(
      "returns '$message' when request contains invalid password and language is set as $language",
      async ({ language, message }) => {
        const user = await addUser();
        const body = {
          password: 'InvalidPassword',
          newPassword: 'N3wPassword',
        };
        const response = await putPasswordUpdate(user.id, body, {
          auth: activeUserCredentials,
          language,
        });
        expect(response.body.message).toBe(message);
      }
    );

    it.each`
      language | message
      ${'en'}  | ${en.unauthorized_user_update}
      ${'pl'}  | ${pl.unauthorized_user_update}
    `(
      "returns '$message' when request is send by other authenticated user and language is set as $language",
      async ({ language, message }) => {
        await addUser();
        const otherUser = await addUser(inactiveUser);
        const body = {
          password: activeUser.password,
          newPassword: 'N3wPassword',
        };
        const response = await putPasswordUpdate(otherUser.id, body, {
          auth: activeUserCredentials,
          language,
        });
        expect(response.body.message).toBe(message);
      }
    );

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
      "returns '$message' validation message when language is set to $language and the new password is $value",
      async ({ language, message, value }) => {
        const user = await addUser();
        const body = {
          password: activeUser.password,
          newPassword: value,
        };
        const response = await putPasswordUpdate(user.id, body, {
          auth: activeUserCredentials,
          language,
        });
        expect(response.body.validationErrors.newPassword).toBe(message);
      }
    );
  });
});
