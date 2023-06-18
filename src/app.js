const express = require('express');
const app = express();
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');

//It creates folder structure for uploaded files.
const path = require('path');

const FileService = require('./services/FileService');
FileService.createFolders();

const { UPLOAD_DIR, PROFILE_DIR, POST_DIR } = process.env;
const profileImagePath = path.join('.', UPLOAD_DIR, PROFILE_DIR);
const postImageFolder = path.join('.', UPLOAD_DIR, POST_DIR);

const ONE_YEAR = 365 * 24 * 60 * 60 * 1000;

//Setting up i18next config.
const i18next = require('i18next');
const Backend = require('i18next-fs-backend');
const middleware = require('i18next-http-middleware');
i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    fallbackLng: 'en',
    lng: 'en',
    ns: ['translation'],
    defaultNS: 'translation',
    backend: {
      loadPath: './locales/{{lng}}/{{ns}}.json',
    },
    detection: {
      lookupHeader: 'accept-language',
    },
  });

// Middlewares import.
const userRouter = require('./routes/UserRouter');
const postRouter = require('./routes/PostRouter');
const fileRouter = require('./routes/FileRouter');
const likeRouter = require('./routes/LikeRouter');
const commentRouter = require('./routes/CommentRouter');
const adminRouter = require('./routes/AdminRouter');
const errorHandler = require('./errors/ErrorHandler');
const swaggerDocs = require('./utils/swagger');

const tokenAuthentication = require('./middlewares/tokenAuthentication');

// CORS and Helmet configs.
const corsOptions = {
  origin: `${process.env.CORS_ALLOW_ORIGIN}`,
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
};

const helmetOptions = {
  crossOriginResourcePolicy: false,
};

const rateLimiter = rateLimit({
  windowMs: 5 * 60 * 100,
  max: 2000,
});

// Registering middlewares.
app.use(cors(corsOptions));
app.use(helmet(helmetOptions));
app.use(middleware.handle(i18next));
app.use(rateLimiter);
app.use(hpp());

//Serving static resources.
app.use('/images', express.static(profileImagePath, { maxAge: ONE_YEAR }));
app.use('/posts', express.static(postImageFolder, { maxAge: ONE_YEAR }));

app.use(express.json({ limit: '4mb' }));

app.use(tokenAuthentication);

app.use('/api/v1.0/users', userRouter);
app.use('/api/v1.0/posts', postRouter);
app.use('/api/v1.0/files', fileRouter);
app.use('/api/v1.0/likes', likeRouter);
app.use('/api/v1.0/comments', commentRouter);
app.use('/api/v1.0/admin', adminRouter);
swaggerDocs(app);

const NotFoundError = require('./errors/400/NotFoundError');
app.all('*', (req, res, next) => {
  next(new NotFoundError(`${req.originalUrl}  route not found.`, 404));
});

app.use(errorHandler);

module.exports = app;
