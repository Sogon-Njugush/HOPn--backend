import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsUrl,
  IsOptional,
} from 'class-validator';

export class CreateApplicationDto {
  @IsString()
  @IsNotEmpty()
  jobTitle: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsUrl()
  @IsNotEmpty()
  linkedin: string;

  @IsUrl()
  @IsOptional() // Optional because not everyone has a portfolio
  portfolio?: string;

  @IsString()
  @IsNotEmpty()
  coverLetter: string;
}
