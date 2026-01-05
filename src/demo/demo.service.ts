import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resend } from 'resend';
import { ConfigService } from '@nestjs/config';
import { CreateDemoDto } from './dto/create-demo.dto';
import { DemoRequest } from './entities/demo.entity';

@Injectable()
export class DemoService {
  private resend: Resend;

  constructor(
    @InjectRepository(DemoRequest)
    private demoRepository: Repository<DemoRequest>,
    private readonly configService: ConfigService,
  ) {
    this.resend = new Resend(this.configService.get<string>('RESEND_API_KEY'));
  }

  async create(dto: CreateDemoDto) {
    const newDemo = this.demoRepository.create(dto);
    await this.demoRepository.save(newDemo);

    const fromEmail =
      this.configService.get<string>('RESEND_FROM_EMAIL') ||
      'onboarding@resend.dev';
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    if (!adminEmail) {
      throw new Error('ADMIN_EMAIL is not defined in environment variables');
    }

    // Notify Sales Team
    await this.resend.emails.send({
      from: `NEXIUS Sales <${fromEmail}>`,
      to: [adminEmail],
      subject: ` HOT LEAD: Demo Request from ${dto.companyName}`,
      html: `
        <h2>New Demo Request</h2>
        <p><strong>Name:</strong> ${dto.firstName} ${dto.lastName}</p>
        <p><strong>Company:</strong> ${dto.companyName}</p>
        <p><strong>Email:</strong> ${dto.workEmail}</p>
      `,
    });

    return { success: true };
  }
}
