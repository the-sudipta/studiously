import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Project } from './project.entity';
import { UserEntity } from '../../member/entities/user.entity';

@Entity('notes')
export class Note {
  @PrimaryGeneratedColumn()
  id: number;

  // eslint-disable-next-line prettier/prettier
  @Column({ length: 160 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @ManyToOne(() => Project, (p) => p.notes, {
    eager: true,
    onDelete: 'CASCADE',
  })
  project: Project;

  @ManyToOne(() => UserEntity, { nullable: true, eager: true })
  author?: UserEntity | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
