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

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 160 })
  title: string;

  @Column({ type: 'text', nullable: true })
  details?: string | null;

  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.TODO })
  status: TaskStatus;

  @Column({ type: 'timestamptz', nullable: true })
  due_at?: Date | null;

  @ManyToOne(() => Project, (p) => p.tasks, {
    eager: true,
    onDelete: 'CASCADE',
  })
  project: Project;

  @ManyToOne(() => UserEntity, { nullable: true, eager: true })
  assignee?: UserEntity | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
