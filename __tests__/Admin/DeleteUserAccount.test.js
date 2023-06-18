const request = require('supertest');
const bcrypt = require('bcrypt');
const SMTPServer = require('smtp-server').SMTPServer;

const app = require('../../src/app');

const UserModel = require('../../src/model/UserModel');
const PostModel = require('../../src/model/PostModel');
const CommentModel = require('../../src/model/CommentModel');
const LikeModel = require('../../src/model/LikeModel');

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

const addPost = async (userId) => {
  const post = await PostModel.create({
    content: `Greate Post.`,
    userId: userId,
  });

  return post;
};

const addComments = async (postId, userId, count = 1) => {
  for (i = 0; i < count; i++) {
    await CommentModel.create({
      postId,
      userId,
      content: `My short comment !`,
    });
  }
  await LikeModel.create({
    postId,
    userId,
  });
};

const addLike = async (postId, userId) => {
  await LikeModel.create({
    postId,
    userId,
  });
};

const getToken = async (body = adminAuth) => {
  const response = await request(app).post('/api/v1.0/users/auth').send(body);
  return response.body.token;
};

const deleteUser = (userId, body, options = {}) => {
  const agent = request(app).delete(`/api/v1.0/admin/users/${userId}`);

  if (options.language) {
    agent.set('Accept-Language', options.language);
  }

  if (options.token) {
    agent.set('Authorization', `Bearer ${options.token}`);
  }
  return agent.send(body);
};

//------------------------- INTEGRATION TESTS  -------------------------\\

describe('DELETE /api/v1.0/admin/users/:userId', () => {
  const body = { password: 'P4assword' };
  describe('Valid Request', () => {
    it('returns 200 code when request is valid', async () => {
      const user = await addUser();
      await addAdmin();
      const token = await getToken();
      const response = await deleteUser(user.id, body, { token });
      expect(response.status).toBe(200);
    });

    it('returns success message  when request is valid', async () => {
      const user = await addUser();
      await addAdmin();
      const token = await getToken();
      const response = await deleteUser(user.id, body, { token });
      expect(response.body.message).toBe(en.user_delete_success);
    });

    it('deletes user from database when request sent from authorized admin', async () => {
      const user = await addUser();
      await addAdmin();
      const token = await getToken();
      await deleteUser(user.id, body, { token });
      const userInDatabse = await UserModel.findByPk(user.id);
      expect(userInDatabse).toBeNull();
    });

    it("deletes user's posts from database when request send from authorized admin", async () => {
      const user = await addUser();
      await addAdmin();
      const token = await getToken();
      await addPost(user.id);
      await deleteUser(user.id, body, { token });
      const posts = await PostModel.findAll();
      expect(posts.length).toBe(0);
    });

    it("deletes user's comments from database when request send from authorized user", async () => {
      const user = await addUser();
      const admin = await addAdmin();
      const post = await addPost(admin.id);
      const token = await getToken();
      await addComments(post.id, user.id, 5);
      await deleteUser(user.id, body, { token });
      const comments = await CommentModel.findAll();
      expect(comments.length).toBe(0);
    });

    it("deletes user's likes from database when request send from authorized user", async () => {
      const user = await addUser();
      const admin = await addAdmin();
      const post = await addPost(admin.id);
      const token = await getToken();
      await addLike(post.id, user.id);
      await deleteUser(user.id, body, { token });
      const likes = await LikeModel.findAll();
      expect(likes.length).toBe(0);
    });

    it('sends information mail to user whose account was deleted', async () => {
      const user = await addUser();
      const admin = await addAdmin();
      const token = await getToken();
      await deleteUser(user.id, body, { token });
      expect(lastMail).toContain(user.email);
      expect(lastMail).toContain(admin.accountName);
    });
  });

  describe('Invalid request.', () => {
    it('returns 400 code when request send without password', async () => {
      const user = await addUser();
      await addAdmin();
      const token = await getToken();
      const response = await deleteUser(user.id, {}, { token });
      expect(response.status).toBe(400);
    });

    it('returns 401 status code when delete request send without token', async () => {
      const user = await addUser();
      await addAdmin();
      const response = await deleteUser(user.id, body);
      expect(response.status).toBe(401);
    });

    it('returns 401 code when request send with invalid password', async () => {
      const user = await addUser();
      await addAdmin();
      const token = await getToken();
      const body = { password: 'InvalidPassword' };
      const response = await deleteUser(user.id, body, { token });
      expect(response.status).toBe(401);
    });

    it('returns 403 status code when delete request send with correct credentials but from user that is not an admin', async () => {
      await addUser();
      const admin = await addAdmin();
      const token = await getToken(userAuth);
      const response = await deleteUser(admin.id, body, { token });
      expect(response.status).toBe(403);
    });

    it('returns 502 Bad Gateway when sending information mail fails', async () => {
      simulateSMTPFailure = true;
      const user = await addUser();
      await addAdmin();
      const token = await getToken();
      const response = await deleteUser(user.id, body, { token });
      expect(response.status).toBe(502);
    });
  });

  describe('Internationalization.', () => {
    it.each`
      language | message
      ${'en'}  | ${en.user_delete_success}
      ${'pl'}  | ${pl.user_delete_success}
    `(
      "returns error message '$message' when delete request sent by authorized user and language is ste to '$language'",
      async ({ language, message }) => {
        const user = await addUser();
        await addAdmin();
        const token = await getToken();
        const response = await deleteUser(user.id, body, { token, language });
        expect(response.body.message).toBe(message);
      }
    );

    it.each`
      language | message                       | field
      ${'en'}  | ${en.data_validation_failure} | ${en.password_empty}
      ${'pl'}  | ${pl.data_validation_failure} | ${pl.password_empty}
    `(
      "returns error message '$message' when request send without password and language is ste to '$language'",
      async ({ language, message, field }) => {
        const user = await addUser();
        await addAdmin();
        const token = await getToken();
        const response = await deleteUser(user.id, {}, { token, language });
        expect(response.body.message).toBe(message);
        expect(response.body.validationErrors.password).toBe(field);
      }
    );

    it.each`
      language | message
      ${'en'}  | ${en.authentication_failure}
      ${'pl'}  | ${pl.authentication_failure}
    `(
      "returns error message '$message' when delete request send without token and language is ste to '$language'",
      async ({ language, message }) => {
        const user = await addUser();
        await addAdmin();
        const response = await deleteUser(user.id, body, { language });
        expect(response.body.message).toBe(message);
      }
    );

    it.each`
      language | message
      ${'en'}  | ${en.authentication_failure}
      ${'pl'}  | ${pl.authentication_failure}
    `(
      "returns error message '$message' when request contains invalid password and language is set as $language",
      async ({ language, message }) => {
        const user = await addUser();
        await addAdmin();
        const token = await getToken();
        const body = { password: 'InvalidPassword' };
        const response = await deleteUser(user.id, body, { token, language });
        expect(response.body.message).toBe(message);
      }
    );

    it.each`
      language | message
      ${'en'}  | ${en.unauthorized_user_delete}
      ${'pl'}  | ${pl.unauthorized_user_delete}
    `(
      "returns error message '$message' when request send with correct credentials but from user that is not an admin and language is ste to '$language'",
      async ({ language, message }) => {
        await addUser();
        const admin = await addAdmin();
        const token = await getToken(userAuth);
        const response = await deleteUser(admin.id, body, { token, language });
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
        const response = await deleteUser(user.id, body, { token, language });
        expect(response.body.message).toBe(message);
      }
    );
  });
});
