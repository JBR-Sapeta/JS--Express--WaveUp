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
  avatar: 'avatar.jpg',
  description: 'my description.',
  isInactive: false,
};

const inactiveUser = {
  accountName: 'user1',
  email: 'user1@mail.com',
  avatar: 'avatar.jpg',
  description: 'my description.',
  isInactive: true,
};

const credentials = { email: 'user@mail.com', password: 'P4ssword' };

const addUser = async (user) => {
  return await UserModel.create(user);
};

const postAuthentication = async (credentials, options = {}) => {
  let agent = request(app).post('/api/v1.0/users/auth');

  if (options.language) {
    agent.set('Accept-Language', options.language);
  }
  return agent.send(credentials);
};

//------------------------- INTEGRATION TESTS  -------------------------\\

describe('POST /api/v1.0/users/auth', () => {
  describe('Valid request.', () => {
    it('returns 200 status code when login request is valid', async () => {
      const password = await bcrypt.hash('P4ssword', 12);
      await addUser({ ...activeUser, password });
      const response = await postAuthentication(credentials);
      expect(response.status).toBe(200);
    });

    it('returns only id, account name, username,  avatr, description, birthday, city, expiration date and token when request is valid ', async () => {
      const password = await bcrypt.hash('P4ssword', 12);
      await addUser({ ...activeUser, password });
      const response = await postAuthentication(credentials);
      expect(Object.keys(response.body)).toEqual([
        'id',
        'accountName',
        'username',
        'email',
        'avatar',
        'description',
        'isAdmin',
        'birthday',
        'city',
        'token',
        'expiresIn',
      ]);
    });

    it('returns  user data: id, account name, avatr, description  in response body when request is valid ', async () => {
      const password = await bcrypt.hash('P4ssword', 12);
      const user = await addUser({ ...activeUser, password });
      const response = await postAuthentication(credentials);
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(user.id);
      expect(response.body.accountName).toBe(user.accountName);
      expect(response.body.email).toBe(user.email);
      expect(response.body.avatar).toBe(user.avatar);
      expect(response.body.description).toBe(user.description);
    });

    it('returns token in response body when credentials are correct', async () => {
      const password = await bcrypt.hash('P4ssword', 12);
      await addUser({ ...activeUser, password });
      const response = await postAuthentication(credentials);
      expect(response.body.token).not.toBeUndefined();
    });
  });

  describe('Invalid request.', () => {
    it('returns 400 status code when password field is missing', async () => {
      const password = await bcrypt.hash('P4ssword', 12);
      await addUser({ ...activeUser, password });
      const response = await postAuthentication({ email: 'user@mail.com' });
      expect(response.status).toBe(400);
    });

    it('returns 400 status code when email field is missing', async () => {
      const password = await bcrypt.hash('P4ssword', 12);
      await addUser({ ...activeUser, password });
      const response = await postAuthentication({ password: 'P4ssword' });
      expect(response.status).toBe(400);
    });

    it('returns 400 status code when email field is invalid', async () => {
      const password = await bcrypt.hash('P4ssword', 12);
      await addUser({ ...activeUser, password });
      const response = await postAuthentication({
        email: 'usermail.com',
        password: 'P4ssword',
      });
      expect(response.status).toBe(400);
    });

    it('returns 401 when password is incorrect', async () => {
      const password = await bcrypt.hash('P4ssword', 12);
      await addUser({ ...activeUser, password });
      const response = await postAuthentication({
        email: 'user@mail.com',
        password: 'Password',
      });
      expect(response.status).toBe(401);
    });

    it('returns 401 status code when user does not exist', async () => {
      const response = await postAuthentication(credentials);
      expect(response.status).toBe(401);
    });

    it('returns 403 status code when user account is in inactive mode', async () => {
      const password = await bcrypt.hash('P4ssword', 12);
      await addUser({ ...inactiveUser, password });
      const response = await postAuthentication({
        ...credentials,
        email: inactiveUser.email,
      });
      expect(response.status).toBe(403);
    });

    it('returns 403 status code when user account has been suspended', async () => {
      const password = await bcrypt.hash('P4ssword', 12);
      await addUser({ ...activeUser, hasBan: true, password });
      const response = await postAuthentication(credentials);
      expect(response.status).toBe(403);
    });

    it('returns proper error body when authentication fails ', async () => {
      const nowInMillis = new Date().getTime();
      const response = await postAuthentication(credentials);
      const error = response.body;
      expect(error.path).toBe('/api/v1.0/users/auth');
      expect(error.timestamp).toBeGreaterThan(nowInMillis);
      expect(Object.keys(error)).toEqual([
        'status',
        'path',
        'timestamp',
        'message',
      ]);
    });
  });

  describe('Internationalization.', () => {
    it.each`
      language | message
      ${'en'}  | ${en.authentication_failure}
      ${'pl'}  | ${pl.authentication_failure}
    `(
      "returns '$message' when auyhentication fails and language is set to $language",
      async ({ language, message }) => {
        const response = await postAuthentication(credentials, { language });
        expect(response.body.message).toBe(message);
      }
    );

    it.each`
      language | message
      ${'en'}  | ${en.inactive_account}
      ${'pl'}  | ${pl.inactive_account}
    `(
      "returns '$message' when user account is in inactive mode and language is set to $language",
      async ({ language, message }) => {
        const password = await bcrypt.hash('P4ssword', 12);
        await addUser({ ...inactiveUser, password });
        const response = await postAuthentication(
          {
            ...credentials,
            email: inactiveUser.email,
          },
          { language }
        );
        expect(response.body.message).toBe(message);
      }
    );

    it.each`
      language | message
      ${'en'}  | ${en.account_suspended}
      ${'pl'}  | ${pl.account_suspended}
    `(
      "returns '$message' when auyhentication fails and language is set to $language",
      async ({ language, message }) => {
        const password = await bcrypt.hash('P4ssword', 12);
        await addUser({ ...activeUser, hasBan: true, password });
        const response = await postAuthentication(credentials, { language });
        expect(response.body.message).toBe(message);
      }
    );
  });
});
