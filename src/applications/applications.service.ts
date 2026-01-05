import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resend } from 'resend';
import { ConfigService } from '@nestjs/config';
import { CreateApplicationDto } from './dto/create-application.dto';
import { Application } from './entities/application.entity';

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
    try {
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

      // 2. Prepare Email HTML
      const emailHtml = this.generateTemplate(
        `New Candidate: ${dto.fullName}`,
        `
          <p style="margin: 0 0 24px; font-size: 16px; color: #334155;">
            A new application has been submitted for the <strong>${dto.jobTitle}</strong> position.
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
            <tr>
              <td width="120" style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: bold; font-size: 14px;">Candidate</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-weight: 600; font-size: 14px;">${dto.fullName}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: bold; font-size: 14px;">Email</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #ea580c;">
                <a href="mailto:${dto.email}" style="color: #ea580c; text-decoration: none;">${dto.email}</a>
              </td>
            </tr>
             <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: bold; font-size: 14px;">LinkedIn</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #2563eb;">
                <a href="${dto.linkedin}" target="_blank" style="color: #2563eb; text-decoration: none;">View Profile &rarr;</a>
              </td>
            </tr>
            ${
              dto.portfolio
                ? `
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: bold; font-size: 14px;">Portfolio</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #2563eb;">
                <a href="${dto.portfolio}" target="_blank" style="color: #2563eb; text-decoration: none;">View Portfolio &rarr;</a>
              </td>
            </tr>`
                : ''
            }
          </table>

          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 24px; border-radius: 8px;">
            <p style="margin: 0 0 12px; color: #94a3b8; font-size: 11px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">
              Cover Letter
            </p>
            <p style="margin: 0; color: #334155; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${dto.coverLetter}</p>
          </div>

          <div style="margin-top: 32px; text-align: center;">
            <a href="mailto:${dto.email}" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px;">Reply to Candidate</a>
          </div>
        `,
      );

      // 3. Send Email
      await this.resend.emails.send({
        from: `NEXIUS Careers <${fromEmail}>`,
        to: [adminEmail],
        subject: `[Application] ${dto.fullName} - ${dto.jobTitle}`,
        html: emailHtml,
      });

      return { success: true };
    } catch (error) {
      console.error('Application Error:', error);
      throw new InternalServerErrorException('Failed to process application');
    }
  }

  /**
   * Generates the NEXIUS Branded Email Template
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
      <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        
        <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f1f5f9; padding: 40px 0;">
          <tr>
            <td align="center">
              
              <table width="600" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
                
                <tr>
                  <td style="background-color: #0f172a; padding: 32px 40px; text-align: center; border-bottom: 4px solid #ea580c;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">
                      NEX<span style="color: #ea580c;">IUS</span>
                    </h1>
                    <p style="margin: 8px 0 0; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">
                      Talent Acquisition
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin-top: 0; margin-bottom: 24px; color: #0f172a; font-size: 20px; font-weight: 700;">${title}</h2>
                    
                    ${bodyContent}

                  </td>
                </tr>

                <tr>
                  <td style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0 0 8px; color: #64748b; font-size: 12px;">
                      &copy; ${new Date().getFullYear()} Nexius Intelligence. All rights reserved.
                    </p>
                    <p style="margin: 0; color: #94a3b8; font-size: 11px;">
                      This is an automated notification from your careers portal.
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
