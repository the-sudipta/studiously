import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class New_PasswordDTO {
  // Password
  @IsNotEmpty({ message: 'Password cannot be empty or null' })
  @IsString({ message: 'Password should be a string' })
  @Matches(
    /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+])[0-9a-zA-Z!@#$%^&*()_+]{8,}$/,
    {
      message:
        'Password should contain at least one uppercase letter, one lowercase letter, one number, and one special character, and is at least 8 characters long.',
    },
  )
  password: string;
}
