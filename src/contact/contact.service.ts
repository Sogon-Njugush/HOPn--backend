import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MailerService } from '@nestjs-modules/mailer';
import { CreateContactDto } from './dto/create-contact.dto';
import { ContactMessage } from './entities/contact.entity';

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(ContactMessage)
    private contactRepository: Repository<ContactMessage>,
    private readonly mailerService: MailerService,
  ) {}

  async create(createContactDto: CreateContactDto) {
    try {
      // 1. Save to Database
      const newMessage = this.contactRepository.create(createContactDto);
      await this.contactRepository.save(newMessage);

      // 2. Prepare Email Content

      // --- USER EMAIL (Acknowledgment) ---
      const userHtml = this.generateTemplate(
        `We received your message`,
        `
          <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #334155;">
            Hello <strong>${createContactDto.fullName}</strong>,
          </p>
          <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #334155;">
            Thank you for contacting <strong>HOPn</strong>. We have successfully received your inquiry regarding "<em>${createContactDto.subject}</em>". Our team is reviewing your request and will get back to you shortly.
          </p>
          
          <div style="background-color: #fff7ed; border-left: 4px solid #ea580c; padding: 20px; border-radius: 4px; margin-bottom: 24px;">
            <p style="margin: 0 0 8px; color: #9a3412; font-size: 12px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">
              Your Message
            </p>
            <p style="margin: 0; color: #1e293b; font-style: italic;">
              "${createContactDto.message}"
            </p>
          </div>
        `,
      );

      // --- ADMIN EMAIL (Notification) ---
      const adminHtml = this.generateTemplate(
        `New Contact Submission`,
        `
          <p style="margin: 0 0 24px; font-size: 16px; color: #334155;">
            You have received a new inquiry from the website contact form.
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
            <tr>
              <td width="100" style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: bold;">Name:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b;">${createContactDto.fullName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: bold;">Email:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #ea580c;">
                <a href="mailto:${createContactDto.email}" style="color: #ea580c; text-decoration: none;">${createContactDto.email}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: bold;">Subject:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b;">${createContactDto.subject}</td>
            </tr>
          </table>

          <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px;">
            <p style="margin: 0 0 8px; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: bold;">Message Content</p>
            <p style="margin: 0; color: #1e293b;">${createContactDto.message}</p>
          </div>
        `,
      );

      // 3. Send Emails (Non-blocking)
      this.mailerService
        .sendMail({
          to: createContactDto.email,
          subject: `We received your message: ${createContactDto.subject}`,
          html: userHtml,
        })
        .catch((err) => console.error('Error sending user email:', err));

      this.mailerService
        .sendMail({
          to: 'admin@hopn.eu', // Replace with your real admin email
          subject: `[New Lead] ${createContactDto.subject}`,
          html: adminHtml,
        })
        .catch((err) => console.error('Error sending admin email:', err));

      return { success: true, message: 'Message sent successfully' };
    } catch (error) {
      console.error('Error sending contact message:', error);
      throw new InternalServerErrorException('Failed to process request');
    }
  }

  /**
   * Generates a professional HTML email template with the Orange/Slate theme.
   */
  private generateTemplate(title: string, bodyContent: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-font-smoothing: antialiased;">
        
        <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f8fafc; padding: 40px 0;">
          <tr>
            <td align="center">
              
              <table width="600" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                
                <tr>
                  <td style="background-color: #0f172a; padding: 30px 40px; text-align: center; border-bottom: 4px solid #ea580c;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
                      HOP<span style="color: #ea580c;">n</span>
                    </h1>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin-top: 0; margin-bottom: 24px; color: #0f172a; font-size: 20px; font-weight: 700;">${title}</h2>
                    
                    ${bodyContent}

                    <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                      <p style="margin: 0; color: #64748b; font-size: 14px;">
                        Best regards,<br>
                        <strong style="color: #ea580c;">The HOPn Team</strong>
                      </p>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td style="background-color: #f1f5f9; padding: 24px; text-align: center;">
                    <p style="margin: 0 0 8px; color: #64748b; font-size: 12px;">
                      &copy; ${new Date().getFullYear()} HOPn Technologies. All rights reserved.
                    </p>
                    <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                      Weichterstr 1, Buchloe, 86807, Germany
                    </p>
                  </td>
                </tr>

              </table>
              
              <table width="600" border="0" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center" style="padding-top: 16px;">
                    <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                      Intelligent Digital Experiences.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }
}
