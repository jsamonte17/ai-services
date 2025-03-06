import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { FacebookModule } from './facebook/facebook.module';
import { OpenaiModule } from './openai/openai.module';
import { IntercomModule } from './intercom/intercom.module';
import { SequelizeModule } from '@nestjs/sequelize';
import { LeadsModel } from './models/leads.model';
import { ConversationsModel } from './models/conversations.model';
import { BullModule } from '@nestjs/bullmq';
import { FilesModel } from './models/files.model';
import { ReportsModule } from './reports/reports.module';
import { BusybeeModule } from './busybee/busybee.module';
import { SmsQueuedModel } from './models/sms.queued.model';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CitiesModel } from './models/cities.model';
import { CitySearchesModel } from './models/city.searches.model';
import { ContactsModule } from './contacts/contacts.module';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SequelizeModule.forRoot({
      dialect: 'mysql',
      host: process.env.DB_HOST,
      port: 3306,
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      synchronize: true,
      autoLoadModels: true,
      models: [
        LeadsModel,
        ConversationsModel,
        FilesModel,
        SmsQueuedModel,
        CitiesModel,
        CitySearchesModel,
      ],
      timezone: process.env.TZ,
      logging: false,
    }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
      },
      prefix: process.env.REDIS_PREFIX,
    }),
    // BullModule.forRootAsync({
    //   imports: [ConfigModule],
    //   inject: [ConfigService],
    //   useFactory: (configService: ConfigService) => ({
    //     redis: {
    //       host: configService.get('REDIS_HOST'),
    //       port: parseInt(configService.get('REDIS_PORT'), 10),
    //       prefix: configService.get('NODE_ENV') === 'prod' ? 'prod-' : 'dev-',
    //     },
    //   }),
    // }),
    CacheModule.registerAsync({
      useFactory: async () => {
        const store = await redisStore({
          socket: {
            host: process.env.REDIS_HOST,
            port: 6379,
          },
        });

        return {
          store,
          ttl: 10 * 60000, // 10 minutes (milliseconds)
        };
      },
    }),
    FacebookModule,
    OpenaiModule,
    IntercomModule,
    ReportsModule,
    BusybeeModule,
    UsersModule,
    AuthModule,
    ContactsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
