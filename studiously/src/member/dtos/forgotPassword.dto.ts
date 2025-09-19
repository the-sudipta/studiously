import { IsNotEmpty } from 'class-validator';

export class ForgetPasswordDTO {
  // Email
  @IsNotEmpty({ message: 'Email cannot be empty or null' })
  email: string;
}
