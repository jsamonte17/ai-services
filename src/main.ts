import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';

const CORS_WHITELIST: string[] = (process.env.CORS_WHITELIST ?? '')
  .replace(/^['"]|['"]$/g, '')
  .split(',')
  .map((s) => s.trim());

const cors = {
  credentials: true,
  methods: ['GET', 'POST'],
  origin: function (origin, callback) {
    if (CORS_WHITELIST.indexOf(origin) !== -1 || !origin) callback(null, true);
    else callback(new Error(`Not allowed by CORS: ${origin}`));
  },
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors(cors);

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  // app.use((req, res, next) => {
  //   req.setTimeout(60000); // 60 seconds
  //   next();
  // });

  await app.listen(process.env.PORT || 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
