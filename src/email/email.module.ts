import { Module } from '@nestjs/common'
import { EmailService } from './email.service'
import { emailConfig } from './email.config'
import { ConfigModule } from '@nestjs/config'

@Module({
  imports: [ConfigModule.forFeature(emailConfig)],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
