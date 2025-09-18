import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class LoginDTO {
  // Email
  @IsNotEmpty({ message: 'Email cannot be empty or null' })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @MaxLength(100, {
    message: 'Email should not be more than 100 characters long',
  })
  email: string;

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
