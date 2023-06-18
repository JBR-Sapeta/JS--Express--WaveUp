const fs = require('fs');
const path = require('path');
const request = require('supertest');
const bcrypt = require('bcrypt');

const app = require('../../src/app');

const UserModel = require('../../src/model/UserModel');

const en = require('../../locales/en/translation.json');
const pl = require('../../locales/pl/translation.json');

//----------------------------- TEST SETUP -----------------------------\\

beforeEach(async () => {
  UserModel.destroy({ truncate: { cascade: true } });
});

//---------------------------- TEST HELPERS ----------------------------\\

const { UPLOAD_DIR, PROFILE_DIR } = process.env;
const profileFolderPath = path.join('.', UPLOAD_DIR, PROFILE_DIR);

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
  const hash = await bcrypt.hash(user.password, 12);
  user.password = hash;
  const userData = await UserModel.create(user);
  return userData;
};

const putUser = async (userId = 1, body = null, options = {}) => {
  let token;
  let agent = request(app);

  if (options.auth) {
    const response = await agent
      .post('/api/v1.0/users/auth')
      .send(options.auth);
    token = response.body.token;
  }

  agent = request(app).put(`/api/v1.0/users/${userId}`);

  if (options.language) {
    agent.set('Accept-Language', options.language);
  }

  if (token) {
    agent.set('Authorization', `Bearer ${token}`);
  }

  return agent.send(body);
};

const readFileAsBase64 = (file = 'test-png.png') => {
  const filePath = path.join(__dirname, '..', 'Resources', file);
  return fs.readFileSync(filePath, { encoding: 'base64' });
};

//------------------------- INTEGRATION TESTS  -------------------------\\

describe('PUT /api/v1.0/users/:userId', () => {
  describe('Valid request.', () => {
    it('returns 200 ok when valid update request send from authorized user', async () => {
      const user = await addUser();
      const body = { username: 'UpdatedUser' };
      const response = await putUser(user.id, body, {
        auth: activeUserCredentials,
      });
      expect(response.status).toBe(200);
    });

    it('returns body which contains only id, username, email, description, birthday, city and avatar when valid update request sent from authorized user', async () => {
      const user = await addUser();
      const body = { username: 'UpdatedUser' };
      const response = await putUser(user.id, body, {
        auth: activeUserCredentials,
      });
      expect(Object.keys(response.body)).toEqual([
        'id',
        'accountName',
        'username',
        'email',
        'avatar',
        'description',
        'birthday',
        'city',
      ]);
    });

    it('updates username in database when valid request contains new username', async () => {
      const user = await addUser();
      const body = { username: 'UpdatedUser' };
      await putUser(user.id, body, { auth: activeUserCredentials });
      const userInDB = await UserModel.findOne({ where: { id: user.id } });
      expect(userInDB.username).toBe(body.username);
    });

    it('does not update accountName in database when valid request contains new accountName', async () => {
      const user = await addUser();
      const body = { accountName: 'UpdatedUser' };
      await putUser(user.id, body, { auth: activeUserCredentials });
      const userInDB = await UserModel.findOne({ where: { id: user.id } });
      expect(userInDB.accountName).not.toBe(body.accountName);
    });

    it('updates description in database when valid request contains new description', async () => {
      const user = await addUser();
      const body = {
        username: 'UpdatedUser',
        description: 'My new description.',
      };
      await putUser(user.id, body, { auth: activeUserCredentials });
      const userInDB = await UserModel.findOne({ where: { id: user.id } });
      expect(userInDB.description).toBe(body.description);
    });

    it('sets description in database to null when valid request contains description property set to null', async () => {
      const user = await addUser();
      const oldBody = {
        username: 'UpdatedUser',
        description: 'My new description.',
      };
      await putUser(user.id, oldBody, { auth: activeUserCredentials });
      const body = {
        username: 'UpdatedUser',
        description: null,
      };
      await putUser(user.id, body, { auth: activeUserCredentials });
      const userInDB = await UserModel.findOne({ where: { id: user.id } });
      expect(userInDB.description).toBe(body.description);
      expect(userInDB.description).not.toBe(oldBody.description);
    });

    it('updates birthday in database when valid request contains new birthday', async () => {
      const user = await addUser();
      const date = new Date('2023-4-01').toISOString();
      const body = {
        username: 'UpdatedUser',
        birthday: date,
      };
      await putUser(user.id, body, { auth: activeUserCredentials });
      const userInDB = await UserModel.findOne({ where: { id: user.id } });
      expect(new Date(userInDB.birthday).toISOString()).toBe(date);
    });

    it('sets birthday in database to null when valid request contains birthday property set to null', async () => {
      const user = await addUser();
      const date = new Date('2023-4-01').toISOString();
      const oldBody = {
        username: 'UpdatedUser',
        birthday: date,
      };
      await putUser(user.id, oldBody, { auth: activeUserCredentials });
      const body = {
        username: 'UpdatedUser',
        birthday: null,
      };
      await putUser(user.id, body, { auth: activeUserCredentials });
      const userInDB = await UserModel.findOne({ where: { id: user.id } });
      expect(new Date(userInDB.birthday).toISOString()).not.toBe(date);
      expect(userInDB.birthday).toBe(null);
    });

    it('updates city in database when valid request contains new city', async () => {
      const user = await addUser();
      const body = {
        username: 'UpdatedUser',
        city: 'Cracow',
      };
      await putUser(user.id, body, { auth: activeUserCredentials });
      const userInDB = await UserModel.findOne({ where: { id: user.id } });
      expect(userInDB.city).toBe(body.city);
    });

    it('sets city in database to null when valid request contains city property set to null', async () => {
      const user = await addUser();
      const oldBody = {
        username: 'UpdatedUser',
        city: 'Cracow',
      };
      await putUser(user.id, oldBody, { auth: activeUserCredentials });
      const body = {
        username: 'UpdatedUser',
        city: null,
      };
      await putUser(user.id, body, { auth: activeUserCredentials });
      const userInDB = await UserModel.findOne({ where: { id: user.id } });
      expect(userInDB.city).toBe(body.city);
      expect(userInDB.city).not.toBe(oldBody.city);
    });

    it('saves the avatar in database when valid request contains image as base64', async () => {
      const fileInbase64 = readFileAsBase64();
      const user = await addUser();
      const body = { username: 'UpdatedUser', image: fileInbase64 };
      await putUser(user.id, body, { auth: activeUserCredentials });
      const userInDB = await UserModel.findOne({ where: { id: user.id } });
      expect(userInDB.avatar).toBeTruthy();
    });

    it('saves the avatar to upload folder when valid request contains image as base64', async () => {
      const fileInbase64 = readFileAsBase64();
      const user = await addUser();
      const body = { username: 'UpdatedUser', image: fileInbase64 };
      await putUser(user.id, body, { auth: activeUserCredentials });
      const userInDB = await UserModel.findOne({ where: { id: user.id } });
      const avatarPath = path.join(profileFolderPath, userInDB.avatar);
      expect(fs.existsSync(avatarPath)).toBe(true);
    });

    it('removes the old avatar when user upload new one', async () => {
      const fileInBase64 = readFileAsBase64();
      const user = await addUser();
      const body = { username: 'UpdatedUser', image: fileInBase64 };
      const response = await putUser(user.id, body, {
        auth: activeUserCredentials,
      });
      const oldAvatar = response.body.avatar;
      await putUser(user.id, body, { auth: activeUserCredentials });
      const avatarPath = path.join(profileFolderPath, oldAvatar);
      expect(fs.existsSync(avatarPath)).toBe(false);
    });

    it('keeps the old avatar when user want only update username', async () => {
      const fileInBase64 = readFileAsBase64();
      const user = await addUser();
      const body = { username: 'UpdatedUser', image: fileInBase64 };
      const response = await putUser(user.id, body, {
        auth: activeUserCredentials,
      });
      const oldAvatar = response.body.avatar;
      await putUser(
        user.id,
        { username: 'AnotherUsername' },
        { auth: activeUserCredentials }
      );
      const avatarPath = path.join(profileFolderPath, oldAvatar);
      // After all clear all images
      expect(fs.existsSync(avatarPath)).toBe(true);
      const userInDB = await UserModel.findOne({ where: { id: user.id } });
      expect(userInDB.avatar).toBe(oldAvatar);
    });

    it('returns 200 when image size is slightly smaller than 2mb', async () => {
      const fileInBase64 = readFileAsBase64('test-less2MB.jpg');
      const user = await addUser();
      const body = { username: 'UpdatedUser', image: fileInBase64 };
      const response = await putUser(user.id, body, {
        auth: activeUserCredentials,
      });
      expect(response.status).toBe(200);
    });
  });

  describe('Invalid request.', () => {
    it('returns 400 code when request body is send with too short username', async () => {
      const user = await addUser();
      const body = { description: 'New description.', username: 'K' };
      const response = await putUser(user.id, body, activeUserCredentials);
      expect(response.status).toBe(400);
    });

    it('returns 400 code when request body is send with too long username', async () => {
      const user = await addUser();
      const body = {
        description: 'New description.',
        username: 'K'.repeat(25),
      };
      const response = await putUser(user.id, body, activeUserCredentials);
      expect(response.status).toBe(400);
    });

    it('returns 400 code when avatar size is bigger than 2MB', async () => {
      const fileInBase64 = readFileAsBase64('test-over2MB.jpg');
      const user = await addUser();
      const body = { username: 'UpdatedUser', image: fileInBase64 };
      const response = await putUser(user.id, body, activeUserCredentials);
      expect(response.status).toBe(400);
    });

    it('returns 400 code when avatar has not supported type', async () => {
      const fileInBase64 = readFileAsBase64('test-gif.gif');
      const user = await addUser();
      const body = { username: 'UpdatedUser', image: fileInBase64 };
      const response = await putUser(user.id, body, activeUserCredentials);
      expect(response.status).toBe(400);
    });

    it('returns 400 code when description is bigger than 500 characters', async () => {
      const user = await addUser();
      const body = {
        username: 'UpdatedUser',
        description: 'a'.repeat(501),
      };
      const response = await putUser(user.id, body, {
        auth: activeUserCredentials,
      });
      expect(response.status).toBe(400);
    });

    it('returns 400 code when city is bigger than 24 characters', async () => {
      const user = await addUser();
      const body = {
        username: 'UpdatedUser',
        city: 'a'.repeat(25),
      };
      const response = await putUser(user.id, body, {
        auth: activeUserCredentials,
      });
      expect(response.status).toBe(400);
    });

    it('returns 400 code when birthday has invalid format', async () => {
      const user = await addUser();
      const body = {
        username: 'UpdatedUser',
        birthday: 'da31dad1213d',
      };
      const response = await putUser(user.id, body, {
        auth: activeUserCredentials,
      });
      expect(response.status).toBe(400);
    });

    it('returns 401 code when request is send without token', async () => {
      const user = await addUser();
      const body = { username: 'UpdatedUser' };
      const response = await putUser(user.id, body);
      expect(response.status).toBe(401);
    });

    it('returns 401 code when request is send by inactive user with correct credentials', async () => {
      const user = await addUser(inactiveUser);
      const body = { username: 'UpdatedUser' };
      const response = await putUser(user.id, body, {
        auth: inactiveUserCredentials,
      });
      expect(response.status).toBe(401);
    });

    it('returns 403 code when request is send by other authenticated user', async () => {
      await addUser();
      const otherUser = await addUser(inactiveUser);
      const body = { username: 'UpdatedUser' };
      const response = await putUser(otherUser.id, body, {
        auth: activeUserCredentials,
      });
      expect(response.status).toBe(403);
    });
  });

  describe('Internationalization.', () => {
    it.each`
      language | message
      ${'en'}  | ${en.authentication_failure}
      ${'pl'}  | ${pl.authentication_failure}
    `(
      "returns '$message' for unauthorized request when language is set to $language",
      async ({ language, message }) => {
        const user = await addUser();
        const nowInMillis = new Date().getTime();
        const body = { username: 'UpdatedUser' };
        const response = await putUser(user.id, body, { language });
        expect(response.body.path).toBe(`/api/v1.0/users/${user.id}`);
        expect(response.body.timestamp).toBeGreaterThan(nowInMillis);
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
        const body = { username: 'UpdatedUser' };
        const response = await putUser(otherUser.id, body, {
          auth: activeUserCredentials,
          language,
        });
        expect(response.body.message).toBe(message);
      }
    );

    it.each`
      language | value             | message
      ${'en'}  | ${'u'}            | ${en.username_size}
      ${'en'}  | ${'a'.repeat(33)} | ${en.username_size}
      ${'pl'}  | ${'u'}            | ${pl.username_size}
      ${'pl'}  | ${'a'.repeat(33)} | ${pl.username_size}
    `(
      'returns bad request with $message when username is updated with $value when language is set as $language',
      async ({ language, value, message }) => {
        const user = await addUser();
        const body = { username: value };
        const response = await putUser(user.id, body, {
          auth: activeUserCredentials,
          language: language,
        });
        expect(response.status).toBe(400);
        expect(response.body.validationErrors.username).toBe(message);
      }
    );

    it.each`
      language | message
      ${'pl'}  | ${pl.profile_avatar_size}
      ${'en'}  | ${en.profile_avatar_size}
    `(
      "returns '$message' when file size exceeds 2mb and language is set as $language",
      async ({ language, message }) => {
        const fileWithExceeding2MB = 'a'.repeat(1024 * 1024 * 2) + 'a';
        const base64 = Buffer.from(fileWithExceeding2MB).toString('base64');
        const savedUser = await addUser();
        const body = { username: 'UpdatedUser', image: base64 };
        const response = await putUser(savedUser.id, body, {
          auth: { email: savedUser.email, password: 'P4ssword' },
          language,
        });
        expect(response.body.validationErrors.image).toBe(message);
      }
    );

    it.each`
      file              | status
      ${'test-gif.gif'} | ${400}
      ${'test-pdf.pdf'} | ${400}
      ${'test-txt.txt'} | ${400}
      ${'test-png.png'} | ${200}
      ${'test-jpg.jpg'} | ${200}
    `(
      "returns '$status' code when uploading $file as image",
      async ({ file, status }) => {
        const fileInBase64 = readFileAsBase64(file);
        const user = await addUser();
        const body = { username: 'UpdatedUser', image: fileInBase64 };
        const response = await putUser(user.id, body, {
          auth: activeUserCredentials,
        });
        expect(response.status).toBe(status);
      }
    );

    it.each`
      language | message
      ${'pl'}  | ${pl.description_size}
      ${'en'}  | ${en.description_size}
    `(
      "returns '$message' when description is bigger than 500 characters and language is set as $language",
      async ({ language, message }) => {
        const user = await addUser();
        const body = {
          username: 'UpdatedUser',
          description: 'a'.repeat(501),
        };
        const response = await putUser(user.id, body, {
          auth: activeUserCredentials,
          language,
        });
        expect(response.body.validationErrors.description).toBe(message);
      }
    );

    it.each`
    language | message
    ${'pl'}  | ${pl.city_size}
    ${'en'}  | ${en.city_size}
  `(
    "returns '$message' when city name is bigger than 24 characters and language is set as $language",
    async ({ language, message }) => {
      const user = await addUser();
      const body = {
        username: 'UpdatedUser',
        city: 'a'.repeat(25),
      };
      const response = await putUser(user.id, body, {
        auth: activeUserCredentials,
        language,
      });
      expect(response.body.validationErrors.city).toBe(message);
    }
  );

    it.each`
      language | message
      ${'pl'}  | ${pl.birthday_date_format}
      ${'en'}  | ${en.birthday_date_format}
    `(
      "returns '$message' when birthday has invalid format and language is set as $language",
      async ({ language, message }) => {
        const user = await addUser();
        const body = {
          username: 'UpdatedUser',
          birthday: 'da31dad1213d',
        };
        const response = await putUser(user.id, body, {
          auth: activeUserCredentials,
          language,
        });
        expect(response.body.validationErrors.birthday).toBe(message);
      }
    );

    it.each`
      file              | language | message
      ${'test-gif.gif'} | ${'pl'}  | ${pl.unsupported_image_file}
      ${'test-gif.gif'} | ${'en'}  | ${en.unsupported_image_file}
      ${'test-pdf.pdf'} | ${'pl'}  | ${pl.unsupported_image_file}
      ${'test-pdf.pdf'} | ${'en'}  | ${en.unsupported_image_file}
      ${'test-txt.txt'} | ${'pl'}  | ${pl.unsupported_image_file}
      ${'test-txt.txt'} | ${'en'}  | ${en.unsupported_image_file}
    `(
      'returns $message when uploading $file as image when language is $language',
      async ({ file, language, message }) => {
        const fileInBase64 = readFileAsBase64(file);
        const user = await addUser();
        const body = { username: 'UpdatedUser', image: fileInBase64 };
        const response = await putUser(user.id, body, {
          auth: activeUserCredentials,
          language,
        });
        expect(response.body.validationErrors.image).toBe(message);
      }
    );
  });
});
