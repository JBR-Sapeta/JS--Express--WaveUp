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

const putEmailUpdate = async (userId = 1, body = null, options = {}) => {
  let token;
  let agent = request(app);

  if (options.auth) {
    const response = await agent
      .post('/api/v1.0/users/auth')
      .send(options.auth);
    token = response.body.token;
  }

  agent = request(app).put(`/api/v1.0/users/email/${userId}`);

  if (options.language) {
    agent.set('Accept-Language', options.language);
  }

  if (token) {
    agent.set('Authorization', `Bearer ${token}`);
  }

  return agent.send(body);
};

//------------------------- INTEGRATION TESTS  -------------------------\\

describe('PUT /api/v1.0/users/email/:userId', () => {
  describe('Valid request.', () => {
    it('returns 200 code when valid update request send from authorized user', async () => {
      const user = await addUser();
      const body = {
        password: activeUser.password,
        newEmail: 'newuser@mail.com',
      };
      const response = await putEmailUpdate(user.id, body, {
        auth: activeUserCredentials,
      });
      expect(response.status).toBe(200);
    });

    it('returns succes message when valid update request send from authorized user', async () => {
      const user = await addUser();
      const body = {
        password: activeUser.password,
        newEmail: 'newuser@mail.com',
      };
      const response = await putEmailUpdate(user.id, body, {
        auth: activeUserCredentials,
      });
      expect(response.body.message).toBe(en.email_update_success);
    });

    it('updates email in database when valid request send from authorized user', async () => {
      const user = await addUser();
      const body = {
        password: activeUser.password,
        newEmail: 'newuser@mail.com',
      };
      await putEmailUpdate(user.id, body, {
        auth: activeUserCredentials,
      });
      const userInDB = await UserModel.findOne({ where: { id: user.id } });

      expect(userInDB.email).toBe(body.newEmail);
    });
  });

  describe('Invalid request.', () => {
    it('returns 400 code when request body is send without new email', async () => {
      const user = await addUser();
      const body = {
        password: activeUser.password,
      };
      const response = await putEmailUpdate(user.id, body, {
        auth: activeUserCredentials,
      });
      expect(response.status).toBe(400);
    });

    it('returns 400 code when request body is send without password', async () => {
      const user = await addUser();
      const body = {
        newEmail: 'newemail@mail.com',
      };
      const response = await putEmailUpdate(user.id, body, {
        auth: activeUserCredentials,
      });
      expect(response.status).toBe(400);
    });

    it('returns 401 code when request body is send with invalid password', async () => {
      const user = await addUser();
      const body = {
        password: 'InvalidPassword',
        newEmail: 'newemail@mail.com',
      };
      const response = await putEmailUpdate(user.id, body, {
        auth: activeUserCredentials,
      });
      expect(response.status).toBe(401);
    });

    it('returns 401 code when request is send without token', async () => {
      const user = await addUser();
      const body = {
        password: activeUser.password,
        newEmail: 'newemail@mail.com',
      };
      const response = await putEmailUpdate(user.id, body);
      expect(response.status).toBe(401);
    });

    it('returns 401 code when request is send by inactive user with correct credentials', async () => {
      const user = await addUser(inactiveUser);
      const body = {
        password: inactiveUser.password,
        newEmail: 'newemail@mail.com',
      };
      const response = await putEmailUpdate(user.id, body, {
        auth: inactiveUserCredentials,
      });
      expect(response.status).toBe(401);
    });

    it('returns 403 code when request is send by other authenticated user', async () => {
      await addUser();
      const otherUser = await addUser(inactiveUser);
      const body = {
        password: activeUser.password,
        newEmail: 'newemail@mail.com',
      };
      const response = await putEmailUpdate(otherUser.id, body, {
        auth: activeUserCredentials,
      });
      expect(response.status).toBe(403);
    });
  });

  describe('Internationalization.', () => {
    it.each`
      language | message
      ${'en'}  | ${en.email_update_success}
      ${'pl'}  | ${pl.email_update_success}
    `(
      "returns '$message' message when valid update request send from authorized user and language is set to $language",
      async ({ language, message }) => {
        const user = await addUser();
        const body = {
          password: activeUser.password,
          newEmail: 'newuser@mail.com',
        };
        const response = await putEmailUpdate(user.id, body, {
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
          newEmail: 'newemail@mail.com',
        };
        const nowInMillis = new Date().getTime();
        const response = await putEmailUpdate(user.id, body, { language });
        expect(response.body.path).toBe(`/api/v1.0/users/email/${user.id}`);
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
          newEmail: 'newemail@mail.com',
        };
        const response = await putEmailUpdate(user.id, body, {
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
          newEmail: 'newemail@mail.com',
        };
        const response = await putEmailUpdate(otherUser.id, body, {
          auth: activeUserCredentials,
          language,
        });
        expect(response.body.message).toBe(message);
      }
    );

    it.each`
      language | value               | message
      ${'en'}  | ${null}             | ${en.email_empty}
      ${'en'}  | ${'email.com'}      | ${en.email_validation_failure}
      ${'en'}  | ${'user1@mail.com'} | ${en.email_taken}
      ${'pl'}  | ${null}             | ${pl.email_empty}
      ${'pl'}  | ${'email.com'}      | ${pl.email_validation_failure}
      ${'pl'}  | ${'user1@mail.com'} | ${pl.email_taken}
    `(
      "returns '$message' validation message when language is set to $language and the new password is $value",
      async ({ language, message, value }) => {
        await addUser(inactiveUser);
        const user = await addUser();
        const body = {
          password: activeUser.password,
          newEmail: value,
        };
        const response = await putEmailUpdate(user.id, body, {
          auth: activeUserCredentials,
          language,
        });
        expect(response.body.validationErrors.newEmail).toBe(message);
      }
    );
  });
});
