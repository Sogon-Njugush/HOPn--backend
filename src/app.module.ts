import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ContactModule } from './contact/contact.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactMessage } from './contact/entities/contact.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ApplicationsModule } from './applications/applications.module';
import { DemoModule } from './demo/demo.module';
import { DemoRequest } from './demo/entities/demo.entity';
import { Application } from './applications/entities/application.entity';

@Module({
  imports: [
    // Load .env file globally
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Database Configuration (Neon)
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL, // Uses the string from .env
      entities: [ContactMessage, DemoRequest, Application],
      synchronize: false, // Automatically creates tables (Disable in production)
      ssl: {
        rejectUnauthorized: false, // Required for secure cloud connections like Neon
      },
    }),
    //  Email Configuration (Using .env variables)
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        transport: {
          host: config.get<string>('SMTP_HOST'),
          port: config.get<number>('SMTP_PORT'),
          secure: config.get<boolean>('SMTP_SECURE') === true, // True for 465, False for 587
          auth: {
            user: config.get<string>('SMTP_USER'),
            pass: config.get<string>('SMTP_PASS'),
          },
        },
        defaults: {
          from: `"HOPn Support" <${config.get<string>('SMTP_USER')}>`,
        },
      }),
    }),
    ContactModule,
    ApplicationsModule,
    DemoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
