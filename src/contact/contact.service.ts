import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resend } from 'resend';
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
    this.resend = new Resend(this.configService.get<string>('RESEND_API_KEY'));
  }

  async create(createContactDto: CreateContactDto) {
    try {
      // 1. Save to Database
      const newMessage = this.contactRepository.create(createContactDto);
      await this.contactRepository.save(newMessage);

      // 2. Setup Sender & Admin
      // If verifying a domain on Resend, change this to: 'support@nexius.com'
      const fromEmail =
        this.configService.get<string>('RESEND_FROM_EMAIL') ||
        'onboarding@resend.dev';
      const adminEmail =
        this.configService.get<string>('ADMIN_EMAIL') || 'dev.sogon@gmail.com';

      // 3. Generate User Email (NEXIUS Branded)
      const userHtml = this.generateTemplate(
        `We received your inquiry`,
        `
          <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #334155;">
            Hello <strong>${createContactDto.fullName}</strong>,
          </p>
          <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #334155;">
            Thank you for contacting <strong>NEXIUS</strong>. We have received your inquiry regarding "<em>${createContactDto.subject}</em>".
          </p>
          <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #334155;">
            Our solution architects are reviewing your message and will respond shortly.
          </p>
          <div style="background-color: #fff7ed; border-left: 4px solid #ea580c; padding: 20px; border-radius: 4px; margin-bottom: 24px;">
            <p style="margin: 0 0 8px; color: #9a3412; font-size: 12px; text-transform: uppercase; font-weight: bold;">Your Message</p>
            <p style="margin: 0; color: #1e293b; font-style: italic;">"${createContactDto.message}"</p>
          </div>
        `,
      );

      // 4. Generate Admin Notification
      const adminHtml = this.generateTemplate(
        `New Contact Submission`,
        `
          <p><strong>Incoming Lead from Website:</strong></p>
          <p><strong>Name:</strong> ${createContactDto.fullName}</p>
          <p><strong>Email:</strong> ${createContactDto.email}</p>
          <p><strong>Subject:</strong> ${createContactDto.subject}</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
          <p><strong>Message:</strong></p>
          <p>${createContactDto.message}</p>
        `,
      );

      // 5. Send Emails (Wait for response to catch errors)
      const emailResults = await Promise.all([
        // Send to User
        this.resend.emails.send({
          from: `NEXIUS Support <${fromEmail}>`,
          to: [createContactDto.email],
          subject: `We received your message: ${createContactDto.subject}`,
          html: userHtml,
        }),

        // Send to Admin
        this.resend.emails.send({
          from: `NEXIUS System <${fromEmail}>`,
          to: [adminEmail],
          subject: `[New Lead] ${createContactDto.subject}`,
          html: adminHtml,
        }),
      ]);

      // Optional: Check results for debugging
      if (emailResults[0].error) {
        console.error('Failed to send user email:', emailResults[0].error);
      }

      return { success: true, message: 'Message sent successfully' };
    } catch (error) {
      console.error('Error sending contact message:', error);
      throw new InternalServerErrorException('Failed to process request');
    }
  }

  private generateTemplate(title: string, bodyContent: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: 'Segoe UI', sans-serif; background-color: #f8fafc; padding: 40px 0;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            
            <div style="background-color: #0f172a; padding: 30px; text-align: center; border-bottom: 4px solid #ea580c;">
                <h1 style="color: white; margin: 0; letter-spacing: 1px;">
                  NEX<span style="color: #ea580c;">IUS</span>
                </h1>
            </div>

            <div style="padding: 40px;">
                <h2 style="color: #0f172a; margin-top: 0;">${title}</h2>
                ${bodyContent}
                
                <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">
                    <p>Best regards,<br><strong style="color: #ea580c;">The NEXIUS Team</strong></p>
                </div>
            </div>

            <div style="background-color: #f1f5f9; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
                <p style="margin: 0;">&copy; ${new Date().getFullYear()} Nexius Intelligence. All rights reserved.</p>
            </div>
        </div>
      </body>
      </html>
    `;
  }
}
