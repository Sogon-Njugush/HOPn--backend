import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resend } from 'resend';
import { ConfigService } from '@nestjs/config';
import { CreateApplicationDto } from './dto/create-application.dto';
import { Application } from './entities/application.entity'; // You need to create this entity file

@Injectable()
export class ApplicationsService {
  private resend: Resend;

  constructor(
    @InjectRepository(Application)
    private appRepository: Repository<Application>,
    private readonly configService: ConfigService,
  ) {
    this.resend = new Resend(this.configService.get<string>('RESEND_API_KEY'));
  }

  async create(dto: CreateApplicationDto) {
    // 1. Save to DB
    const newApp = this.appRepository.create(dto);
    await this.appRepository.save(newApp);

    const fromEmail =
      this.configService.get<string>('RESEND_FROM_EMAIL') ||
      'onboarding@resend.dev';
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    if (!adminEmail) {
      throw new Error('ADMIN_EMAIL is not defined in environment variables');
    }

    // 2. Email Notification (To Admin Only usually, or auto-reply to user)
    await this.resend.emails.send({
      from: `NEXIUS Careers <${fromEmail}>`,
      to: [adminEmail],
      subject: `New Application: ${dto.jobTitle} - ${dto.fullName}`,
      html: `
        <h2>New Job Application</h2>
        <p><strong>Role:</strong> ${dto.jobTitle}</p>
        <p><strong>Name:</strong> ${dto.fullName}</p>
        <p><strong>Email:</strong> ${dto.email}</p>
        <p><strong>LinkedIn:</strong> <a href="${dto.linkedin}">${dto.linkedin}</a></p>
        <p><strong>Portfolio:</strong> <a href="${dto.portfolio}">${dto.portfolio}</a></p>
        <hr />
        <p><strong>Cover Letter:</strong></p>
        <p>${dto.coverLetter}</p>
      `,
    });

    return { success: true };
  }
}
