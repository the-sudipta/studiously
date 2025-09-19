import { IsNotEmpty } from 'class-validator';

export class OTP_ReceiverDTO {
  // OTP
  @IsNotEmpty({ message: 'OTP cannot be empty or null' })
  otp: string;
}
