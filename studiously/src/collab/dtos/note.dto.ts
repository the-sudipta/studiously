import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateNoteDto {
  @IsString()
  @MaxLength(160)
  title: string;

  @IsString()
  content: string;

  @IsInt()
  @Min(1)
  projectId: number;
}

export class UpdateNoteDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;
}
