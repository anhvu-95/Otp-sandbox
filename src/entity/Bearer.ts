import {
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
  } from 'typeorm'
import { User } from './User'

@Entity()
export class Bearer {
  @PrimaryColumn()
  public bearer: string

  @ManyToOne(() => User, user => user.bearers, { eager: true })
  public user: User

  @CreateDateColumn()
  public createdAt: Date

  @UpdateDateColumn()
  public updatedAt: Date
}
