const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const request = require('supertest');

const app = require('../../src/app');

const FileModel = require('../../src/model/FileModel');
const UserModel = require('../../src/model/UserModel');

const en = require('../../locales/en/translation.json');
const pl = require('../../locales/pl/translation.json');

const { UPLOAD_DIR, POST_DIR } = process.env;

//----------------------------- TEST SETUP -----------------------------\\

beforeEach(async () => {
  await FileModel.destroy({ truncate: true });
  UserModel.destroy({ truncate: { cascade: true } });
});

//---------------------------- TEST HELPERS ----------------------------\\

const activeUser = {
  accountName: 'user',
  email: 'user@mail.com',
  password: 'P4assword',
  isInactive: false,
};
const credentials = { email: 'user@mail.com', password: 'P4assword' };

const addUser = async (user = { ...activeUser }) => {
  const hash = await bcrypt.hash(user.password, 12);
  user.password = hash;
  const userData = await UserModel.create(user);
  return userData;
};

const uploadFile = async (fileName = 'test-png.png', options = {}) => {
  const agent = request(app).post('/api/v1.0/files/posts');
  if (options.language) {
    agent.set('Accept-Language', options.language);
  }

  let token;
  if (options.auth) {
    const response = await request(app)
      .post('/api/v1.0/users/auth')
      .send(options.auth);
    token = response.body.token;
  }

  if (token) {
    agent.set('Authorization', `Bearer ${token}`);
  }

  return agent.attach(
    'file',
    path.join('.', '__tests__', 'Resources', fileName)
  );
};

//------------------------- INTEGRATION TESTS  -------------------------\\

describe('POST /api/v1.0/files/posts', () => {
  describe('Valid request', () => {
    it('returns 200 code when request is valid ', async () => {
      await addUser();
      const response = await uploadFile('test-png.png', { auth: credentials });
      expect(response.status).toBe(200);
    });

  it('returns 200 code when file is slightly smaller than 2 MB', async () => {
      await addUser();
      const response = await uploadFile('test-less2MB.jpg', {
        auth: credentials,
      });
      expect(response.status).toBe(200);
    });

    it('returns file id in response', async () => {
      await addUser();
      const response = await uploadFile('test-png.png', { auth: credentials });
      const fileId = response.body.id;
      const savedFile = await FileModel.findOne({ where: { id: fileId } });
      expect(savedFile.id).toBe(fileId);
    });

    it('it saves file in posts directory', async () => {
      await addUser();
      await uploadFile('test-png.png', { auth: credentials });
      const files = await FileModel.findAll();
      const file = files[0];
      const filePath = path.join('.', UPLOAD_DIR, POST_DIR, file.filename);
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('creates dynamic filename and saves ', async () => {
      await addUser();
      const beforeSubmit = Date.now();
      await uploadFile('test-png.png', { auth: credentials });
      const files = await FileModel.findAll();
      const file = files[0];
      expect(file.filename).not.toBe('test-png.png');
      expect(file.uploadDate.getTime()).toBeGreaterThan(beforeSubmit);
    });

    it.each`
      fileName          | fileType
      ${'test-png.png'} | ${'image/png'}
      ${'test-png'}     | ${'image/png'}
      ${'test-jpg.jpg'} | ${'image/jpeg'}
    `(
      'saves fileType as $fileType in file object when $file is uploaded',
      async ({ fileType, fileName }) => {
        await addUser();
        await uploadFile(fileName, { auth: credentials });
        const files = await FileModel.findAll();
        const file = files[0];
        expect(file.fileType).toBe(fileType);
      }
    );

    it.each`
      fileName          | fileExtension
      ${'test-png.png'} | ${'png'}
      ${'test-png'}     | ${'png'}
      ${'test-jpg.jpg'} | ${'jpg'}
    `(
      'saves filename with extension $fileExtension in file object and stored object when $fileExtension is uploaded',
      async ({ fileExtension, fileName }) => {
        await addUser();
        await uploadFile(fileName, { auth: credentials });
        const files = await FileModel.findAll();
        const file = files[0];
        if (fileName === 'test-txt.txt') {
          expect(file.filename.endsWith('txt')).toBe(false);
        } else {
          expect(file.filename.endsWith(fileExtension)).toBe(true);
        }
        const filePath = path.join('.', UPLOAD_DIR, POST_DIR, file.filename);
        expect(fs.existsSync(filePath)).toBe(true);
      }
    );
  });

  describe('Invalid request', () => {
    it('returns 400 code when uploaded file size is bigger than 2 MB', async () => {
      const response = await uploadFile('test-over2MB.jpg');
      expect(response.status).toBe(400);
    });

    it('returns validation error message in repons vehen image is bigger than 2MB', async () => {
      const response = await uploadFile('test-over2MB.jpg');
      expect(response.body.message).toBe(en.file_size_limit);
    });

    it('returns 401 code when request send without token', async () => {
      const response = await uploadFile('test-jpg.jpg');
      expect(response.status).toBe(401);
    });

    it('returns error message when request send without token', async () => {
      const response = await uploadFile('test-jpg.jpg');
      expect(response.body.message).toBe(en.authentication_failure);
    });

    it.each`
      fileName          | status
      ${'test-pdf.pdf'} | ${400}
      ${'test-gif.gif'} | ${400}
      ${'test-txt.txt'} | ${400}
    `(
      'returns 400 code when file has not supported type - $fileName',
      async ({ fileName, status }) => {
        await addUser();
        const response = await uploadFile(fileName, { auth: credentials });
        expect(response.status).toBe(status);
      }
    );
  });

  describe('Internationalization', () => {
    it.each`
      language | message
      ${'pl'}  | ${pl.file_size_limit}
      ${'en'}  | ${en.file_size_limit}
    `(
      'returns $message when file size is bigger than 2mb',
      async ({ language, message }) => {
        const nowInMillis = Date.now();
        const response = await uploadFile('test-over2MB.jpg', { language });
        const error = response.body;
        expect(error.path).toBe('/api/v1.0/files/posts');
        expect(error.message).toBe(message);
        expect(error.timestamp).toBeGreaterThan(nowInMillis);
      }
    );

    it.each`
      language | fileName          | message
      ${'en'}  | ${'test-pdf.pdf'} | ${en.unsupported_image_file}
      ${'en'}  | ${'test-gif.gif'} | ${en.unsupported_image_file}
      ${'en'}  | ${'test-txt.txt'} | ${en.unsupported_image_file}
      ${'pl'}  | ${'test-pdf.pdf'} | ${pl.unsupported_image_file}
      ${'pl'}  | ${'test-gif.gif'} | ${pl.unsupported_image_file}
      ${'pl'}  | ${'test-txt.txt'} | ${pl.unsupported_image_file}
    `(
      'returns error message "$message" when file has not supported type ($fileName) and language is set as "$language"',
      async ({ language, fileName, message }) => {
        await addUser();
        const response = await uploadFile(fileName, {
          auth: credentials,
          language,
        });

        expect(response.body.message).toBe(message);
      }
    );
  });
});
