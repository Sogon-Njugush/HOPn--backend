import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resend } from 'resend'; // 1. Import Resend
import { ConfigService } from '@nestjs/config';
import { CreateContactDto } from './dto/create-contact.dto';
import { ContactMessage } from './entities/contact.entity';

@Injectable()
export class ContactService {
  private resend: Resend;

  constructor(
    @InjectRepository(ContactMessage)
    private contactRepository: Repository<ContactMessage>,
    private readonly configService: ConfigService,
  ) {
    // 2. Initialize Resend with API Key
    this.resend = new Resend(this.configService.get<string>('RESEND_API_KEY'));
  }

  async create(createContactDto: CreateContactDto) {
    try {
      // 3. Save to Database
      const newMessage = this.contactRepository.create(createContactDto);
      await this.contactRepository.save(newMessage);

      // 4. Determine Sender Address
      // Note: On Resend Free Tier, you MUST use 'onboarding@resend.dev' until you verify your domain.
      // Once verified, change this to 'support@hopn.eu'
      const fromEmail =
        this.configService.get<string>('RESEND_FROM_EMAIL') ||
        'onboarding@resend.dev';
      const adminEmail =
        this.configService.get<string>('ADMIN_EMAIL') || 'dev.sogon@gmail.com';

      // 5. Generate Email HTML (using your Theme)
      const userHtml = this.generateTemplate(
        `We received your message`,
        `
          <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #334155;">
            Hello <strong>${createContactDto.fullName}</strong>,
          </p>
          <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #334155;">
            Thank you for contacting <strong>HOPn</strong>. We have received your inquiry regarding "<em>${createContactDto.subject}</em>".
          </p>
          <div style="background-color: #fff7ed; border-left: 4px solid #ea580c; padding: 20px; border-radius: 4px; margin-bottom: 24px;">
            <p style="margin: 0 0 8px; color: #9a3412; font-size: 12px; text-transform: uppercase; font-weight: bold;">Your Message</p>
            <p style="margin: 0; color: #1e293b; font-style: italic;">"${createContactDto.message}"</p>
          </div>
        `,
      );

      const adminHtml = this.generateTemplate(
        `New Contact Submission`,
        `
          <p>You have received a new inquiry.</p>
          <p><strong>Name:</strong> ${createContactDto.fullName}</p>
          <p><strong>Email:</strong> ${createContactDto.email}</p>
          <p><strong>Message:</strong> ${createContactDto.message}</p>
        `,
      );

      // 6. Send Emails using Resend API
      await Promise.all([
        // Send to User
        this.resend.emails.send({
          from: `HOPn Support <${fromEmail}>`,
          to: [createContactDto.email],
          subject: `We received your message: ${createContactDto.subject}`,
          html: userHtml,
        }),

        // Send to Admin
        this.resend.emails.send({
          from: `HOPn System <${fromEmail}>`,
          to: [adminEmail],
          subject: `[New Lead] ${createContactDto.subject}`,
          html: adminHtml,
        }),
      ]);

      return { success: true, message: 'Message sent successfully' };
    } catch (error) {
      console.error('Error sending contact message:', error);
      // Resend specific error handling (optional)
      throw new InternalServerErrorException('Failed to process request');
    }
  }

  // (Keep your existing generateTemplate method exactly as it is)
  private generateTemplate(title: string, bodyContent: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: sans-serif; background-color: #f8fafc; padding: 40px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background-color: #0f172a; padding: 20px; text-align: center; border-bottom: 4px solid #ea580c;">
                <h1 style="color: white; margin: 0;">HOP<span style="color: #ea580c;">n</span></h1>
            </div>
            <div style="padding: 40px;">
                <h2 style="color: #0f172a;">${title}</h2>
                ${bodyContent}
            </div>
        </div>
      </body>
      </html>
    `;
  }
}
