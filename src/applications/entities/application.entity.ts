import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class Application {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  jobTitle: string;

  @Column()
  fullName: string;

  @Column()
  email: string;

  @Column()
  linkedin: string;

  @Column({ nullable: true })
  portfolio: string;

  @Column('text', { nullable: true })
  coverLetter: string;

  @CreateDateColumn()
  createdAt: Date;
}
