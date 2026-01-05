import { Module } from '@nestjs/common';
import { DemoService } from './demo.service';
import { DemoController } from './demo.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DemoRequest } from './entities/demo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DemoRequest])],
  controllers: [DemoController],
  providers: [DemoService],
})
export class DemoModule {}
