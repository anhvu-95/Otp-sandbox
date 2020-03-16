/**
 * Created by Hai Anh on 3/15/20
 */

import {Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn} from 'typeorm'
import {User} from './User'

@Entity()
export class UserOtp {
    @PrimaryGeneratedColumn()
    public id: number

    @Column()
    public otp: number

    @Column()
    public secret: string

    @OneToOne(() => User, user => user.otp)
    @JoinColumn()
    public user: User
}
