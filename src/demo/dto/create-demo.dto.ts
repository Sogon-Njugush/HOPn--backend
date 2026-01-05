import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateDemoDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  workEmail: string;

  @IsString()
  @IsNotEmpty()
  companyName: string;
}
