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


const postUser = (user = validUserData, options = {}) => {
  const agent = request(app).post('/api/v1.0/users');

  if (options.language) {
    agent.set('Accept-Language', options.language);
  }

  return agent.send(user);
};

//------------------------- INTEGRATION TESTS  -------------------------\\

describe('POST /api/v1.0/users', () => {
  describe('Valid request.', () => {
    it('returns 200 status code when signup request is valid', async () => {
      const response = await postUser();
      expect(response.status).toBe(200);
    });

    it('returns succes message when signup request is valid', async () => {
      const response = await postUser();
      const body = response.body;
      expect(body.message).toBe(en.user_created);
    });

    it('saves user in databas', async () => {
      await postUser();
      const userList = await UserModel.findAll();
      expect(userList.length).toBe(1);
    });

    it('saves account name and email in databas', async () => {
      await postUser();
      const userList = await UserModel.findAll();
      const savedUser = userList[0];
      expect(savedUser.accountName).toBe('user');
      expect(savedUser.email).toBe('user@mail.com');
    });

    it('hashes password in databas', async () => {
      await postUser();
      const userList = await UserModel.findAll();
      const savedUser = userList[0];
      expect(savedUser.password).not.toBe('PW123456789');
    });

    it('creates user in inactive mode', async () => {
      await postUser();
      const users = await UserModel.findAll();
      const savedUser = users[0];
      expect(savedUser.isInactive).toBe(true);
    });

    it('creates user in inactive mode even if the request body contains isInactive property set to false', async () => {
      const newUser = { ...validUserData, isInactive: false };
      await postUser(newUser);
      const users = await UserModel.findAll();
      const savedUser = users[0];
      expect(savedUser.isInactive).toBe(true);
    });

    it('creates user in user mode', async () => {
      await postUser();
      const users = await UserModel.findAll();
      const savedUser = users[0];
      expect(savedUser.isAdmin).toBe(false);
    });

    it('creates user with hasBan property set to false', async () => {
      await postUser();
      const users = await UserModel.findAll();
      const savedUser = users[0];
      expect(savedUser.hasBan).toBe(false);
    });

    it('creates user in non admin mode even if the request body contains isAdmin property set to true', async () => {
      const newUser = { ...validUserData, isAdmin: true };
      await postUser(newUser);
      const users = await UserModel.findAll();
      const savedUser = users[0];
      expect(savedUser.isAdmin).toBe(false);
    });

    it('creates user without ban even if the request body contains hasBan property set to true', async () => {
      const newUser = { ...validUserData, hasBan: true };
      await postUser(newUser);
      const users = await UserModel.findAll();
      const savedUser = users[0];
      expect(savedUser.hasBan).toBe(false);
    });

    it('creates an activationToken for user', async () => {
      await postUser();
      const users = await UserModel.findAll();
      const savedUser = users[0];
      expect(savedUser.activationToken).toBeTruthy();
    });

    it('sends an account activation email with activationToken', async () => {
      await postUser();
      const users = await UserModel.findAll();
      const savedUser = users[0];
      expect(lastMail).toContain('user@mail.com');
      expect(lastMail).toContain(savedUser.activationToken);
    });
  });

  //--------------------------------------------- INVALID ------------------------------------------\\
  describe('Invalid request.', () => {
    it('returns 400 code when data validation fails', async () => {
      const response = await postUser({
        accountName: null,
        email: 'user1@mail.com',
        password: 'PassW123456789',
      });
      expect(response.status).toBe(400);
    });

    it.each`
      missingField     | statusCode
      ${'accountName'} | ${400}
      ${'email'}       | ${400}
      ${'password'}    | ${400}
    `(
      "returns '$statusCode' code when $missingField is not included in request body",
      async ({ missingField, statusCode }) => {
        const user = {
          accountName: 'user1',
          email: 'user1@mail.com',
          password: 'PassW123456789',
        };
        delete user[missingField];
        const response = await postUser(user);
        expect(response.status).toBe(statusCode);
      }
    );

    it(`returns 400 code when eamil is taken`, async () => {
      await UserModel.create(validUserData);
      const response = await postUser({
        ...validUserData,
        accountName: 'NewUSer',
      });
      expect(response.status).toEqual(400);
    });

    it(`returns 400 code when account name is taken`, async () => {
      await UserModel.create(validUserData);
      const response = await postUser({
        ...validUserData,
        email: 'user1@mail.com',
      });
      expect(response.status).toEqual(400);
    });

    it('returns 502 Bad Gateway when sending email fails', async () => {
      simulateSMTPFailure = true;
      const response = await postUser();
      expect(response.status).toBe(502);
    });

    it('returns multiple error messages when signup request have no body', async () => {
      const response = await postUser({});
      const body = response.body;
      expect(Object.keys(body.validationErrors)).toEqual([
        'accountName',
        'email',
        'password',
      ]);
    });
  });

  describe('Internationalization.', () => {
    it.each`
      language | message
      ${'en'}  | ${en.user_created}
      ${'pl'}  | ${pl.user_created}
    `(
      "returns succes message '$message' when signup request is valid and language is set as '$language'",
      async ({ language, message }) => {
        const response = await postUser(validUserData, { language });
        const body = response.body;
        expect(body.message).toBe(message);
      }
    );

    it.each`
      language | message
      ${'en'}  | ${en.data_validation_failure}
      ${'pl'}  | ${pl.data_validation_failure}
    `(
      "returns error message '$message' when data validation fails and language is set as '$language'",
      async ({ language, message }) => {
        const response = await postUser(
          {
            accountName: null,
            email: 'user1@mail.com',
            password: 'PassW123456789',
          },
          { language }
        );
        expect(response.body.message).toBe(message);
      }
    );

    it.each`
      field            | value                  | errorMessage
      ${'accountName'} | ${null}                | ${en.account_name_empty}
      ${'accountName'} | ${'usr'}               | ${en.account_name_size}
      ${'accountName'} | ${'usr'.repeat(11)}    | ${en.account_name_size}
      ${'email'}       | ${null}                | ${en.email_empty}
      ${'email'}       | ${'email.com'}         | ${en.email_validation_failure}
      ${'email'}       | ${'email@com'}         | ${en.email_validation_failure}
      ${'email'}       | ${'email.pw.com'}      | ${en.email_validation_failure}
      ${'password'}    | ${null}                | ${en.password_empty}
      ${'password'}    | ${'p4A'}               | ${en.password_size}
      ${'password'}    | ${'lowercase'}         | ${en.password_pattern}
      ${'password'}    | ${'UPERCASE'}          | ${en.password_pattern}
      ${'password'}    | ${'123456789'}         | ${en.password_pattern}
      ${'password'}    | ${'lowercaseand123'}   | ${en.password_pattern}
      ${'password'}    | ${'lowerAndUpperCase'} | ${en.password_pattern}
      ${'password'}    | ${'UPPERAND123456'}    | ${en.password_pattern}
    `(
      "returns '$errorMessage' message when $field is set to $value and language is set as 'en'",
      async ({ field, value, errorMessage }) => {
        const user = {
          accountName: 'user1',
          email: 'user1@mail.com',
          password: 'PassW123456789',
        };
        user[field] = value;
        const response = await postUser(user);
        const body = response.body;
        expect(body.validationErrors[field]).toBe(errorMessage);
      }
    );

    it.each`
      field            | value                  | errorMessage
      ${'accountName'} | ${null}                | ${pl.account_name_empty}
      ${'accountName'} | ${'usr'}               | ${pl.account_name_size}
      ${'accountName'} | ${'usr'.repeat(11)}    | ${pl.account_name_size}
      ${'email'}       | ${null}                | ${pl.email_empty}
      ${'email'}       | ${'email.com'}         | ${pl.email_validation_failure}
      ${'email'}       | ${'email@com'}         | ${pl.email_validation_failure}
      ${'email'}       | ${'email.pw.com'}      | ${pl.email_validation_failure}
      ${'password'}    | ${null}                | ${pl.password_empty}
      ${'password'}    | ${'p4A'}               | ${pl.password_size}
      ${'password'}    | ${'lowercase'}         | ${pl.password_pattern}
      ${'password'}    | ${'UPERCASE'}          | ${pl.password_pattern}
      ${'password'}    | ${'123456789'}         | ${pl.password_pattern}
      ${'password'}    | ${'lowercaseand123'}   | ${pl.password_pattern}
      ${'password'}    | ${'lowerAndUpperCase'} | ${pl.password_pattern}
      ${'password'}    | ${'UPPERAND123456'}    | ${pl.password_pattern}
    `(
      "returns '$errorMessage' message when $field is set to $value and language is ste to 'pl'",
      async ({ field, value, errorMessage }) => {
        const user = {
          accountName: 'user1',
          email: 'user1@mail.com',
          password: 'PassW123456789',
        };
        user[field] = value;
        const response = await postUser(user, { language: 'pl' });
        const body = response.body;
        expect(body.validationErrors[field]).toBe(errorMessage);
      }
    );

    it.each`
      language | message
      ${'en'}  | ${en.email_taken}
      ${'pl'}  | ${pl.email_taken}
    `(
      "returns error message '$message'  when eamil is taken and language is set as '$language'",
      async ({ language, message }) => {
        await UserModel.create(validUserData);
        const response = await postUser(
          {
            ...validUserData,
            accountName: 'NewUSer',
          },
          { language }
        );
        expect(response.body.validationErrors.email).toBe(message);
      }
    );

    it.each`
      language | message
      ${'en'}  | ${en.account_name_taken}
      ${'pl'}  | ${pl.account_name_taken}
    `(
      "returns error message '$message' when account name is taken and language is set as '$language'",
      async ({ language, message }) => {
        await UserModel.create(validUserData);
        const response = await postUser(
          {
            ...validUserData,
            email: 'user1@mail.com',
          },
          { language }
        );
        expect(response.body.validationErrors.accountName).toBe(message);
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
        const response = await postUser(validUserData, { language });
        expect(response.body.message).toBe(message);
      }
    );
  });
});

// describe('POST /api/v1.0/users/activate/:token', () => {
//   describe('Valid request.', () => {
//     it('returns 200 status code when activation request is valid', async () => {
//       await postUser();
//       const users = await UserModel.findAll();
//       const token = users[0].activationToken;
//       const response = await postActivation(token);
//       expect(response.status).toBe(200);
//     });

//     it('returns sucess message when activation request is valid', async () => {
//       await postUser();
//       const users = await UserModel.findAll();
//       const token = users[0].activationToken;
//       const response = await postActivation(token);
//       const body = response.body;
//       expect(body.message).toBe(en.account_activation_success);
//     });

//     it('sets activationToken in database to null when activation request is valid', async () => {
//       await postUser();
//       const users = await UserModel.findAll();
//       const token = users[0].activationToken;
//       await postActivation(token);
//       const user = await UserModel.findAll();
//       expect(user[0].activationToken).toBeFalsy();
//     });

//     it('sets isInactive in database to false when activation request is valid', async () => {
//       await postUser();
//       const users = await UserModel.findAll();
//       const token = users[0].activationToken;
//       await postActivation(token);
//       const user = await UserModel.findAll();
//       expect(user[0].isInactive).toBeFalsy();
//     });
//   });

//   describe('Invalid request.', () => {
//     it('returns 400 status code when activation token is invalid', async () => {
//       await postUser();
//       const response = await postActivation(invalidToken);
//       expect(response.status).toBe(400);
//     });

//     it('returns validation errro message when activation token is invalid', async () => {
//       await postUser();
//       const response = await postActivation(invalidToken);
//       expect(response.body.message).toBe(en.data_validation_failure);
//       expect(response.body.validationErrors.token).toBe(
//         en.invalid_activation_token
//       );
//     });

//     it("doesn't set activationToken in database to null when activation request is invalid", async () => {
//       await postUser();
//       await postActivation(invalidToken);
//       const users = await UserModel.findAll();
//       expect(users[0].activationToken).toBeTruthy();
//     });

//     it("doesn't sets isInactive in database to false when activation request is invalid", async () => {
//       await postUser();
//       await postActivation(invalidToken);
//       const users = await UserModel.findAll();
//       expect(users[0].isInactive).toBeTruthy();
//     });
//   });

//   describe('Internationalization', () => {
//     it(`returns succes message '${pl.account_activation_success}' when activation token is invalid and language is set to pl`, async () => {
//       await postUser();
//       const users = await UserModel.findAll();
//       const token = users[0].activationToken;
//       const response = await postActivation(token, { language: 'pl' });
//       expect(response.body.message).toBe(pl.account_activation_success);
//     });

//     it(`returns validation errro message '${pl.data_validation_failure}' when activation token is invalid and language is set to pl`, async () => {
//       await postUser();
//       const response = await postActivation(invalidToken, { language: 'pl' });
//       expect(response.body.message).toBe(pl.data_validation_failure);
//       expect(response.body.validationErrors.token).toBe(
//         pl.invalid_activation_token
//       );
//     });
//   });
// });
