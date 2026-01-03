import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ContactModule } from './contact/contact.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactMessage } from './contact/entities/contact.entity';
import { ConfigModule } from '@nestjs/config';

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
      entities: [ContactMessage],
      synchronize: true, // Automatically creates tables (Disable in production)
      ssl: {
        rejectUnauthorized: false, // Required for secure cloud connections like Neon
      },
    }),
    //  Email Configuration (Using .env variables)
    MailerModule.forRoot({
      transport: {
        host: process.env.SMTP_HOST,
        port: 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      },
      defaults: {
        from: '"No Reply" <noreply@hopn.eu>',
      },
    }),
    ContactModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
