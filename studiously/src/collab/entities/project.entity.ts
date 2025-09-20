import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../member/entities/user.entity';
import { Task } from './task.entity';
import { Note } from './note.entity';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 160 })
  title: string;

  @Column({ type: 'text', nullable: true })
  summary?: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, eager: true })
  owner?: UserEntity | null;

  @OneToMany(() => Task, (t) => t.project, { cascade: ['remove'] })
  tasks: Task[];

  @OneToMany(() => Note, (n) => n.project, { cascade: ['remove'] })
  notes: Note[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
