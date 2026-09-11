import { Inject, Injectable } from '@nestjs/common'
import type { ConfigType } from '@nestjs/config'
import nodemailer, { Transporter } from 'nodemailer'
import { emailConfig } from './email.config'
import { emailHtml } from './email-html'

@Injectable()
export class EmailService {
  private transporter: Transporter

  constructor(
    @Inject(emailConfig.KEY)
    private readonly email: ConfigType<typeof emailConfig>,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.email.host,
      port: this.email.port,
      secure: this.email.secure,
      auth: {
        user: this.email.user,
        pass: this.email.password,
      },
    })
  }

  async sendEmail(to: string, subject: string, resetLink: string) {
    const mailOptions = {
      from: this.email.from,
      to,
      subject,
      html: emailHtml(resetLink),
    }
    await this.transporter.sendMail(mailOptions)
  }
}
