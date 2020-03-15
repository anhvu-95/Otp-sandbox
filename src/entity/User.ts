import * as bcrypt from 'bcryptjs'
import {Exclude} from 'class-transformer'
import {IsEmail} from 'class-validator'
import {BadRequestError, ForbiddenError, InternalServerError} from 'routing-controllers'
import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany, OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm'

import {UserRole} from '../utils/values'
import {Bearer} from './Bearer'
import {UserOtp} from './UserOtp'

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    public id: number

    @Column('varchar', {length: 255})
    public firstName: string

    @Column('varchar', {length: 255})
    public lastName: string

    @Column('varchar', {length: 255})
    @IsEmail()
    public email: string

    @Column('varchar', {nullable: true})
    public phoneNumber: string

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.DRIVER,
    })
    public role: string

    @Exclude()
    @Column({default: false})
    public isDeactivated: boolean

    @Exclude({toPlainOnly: true})
    @Column('text')
    public password: string

    @OneToOne(() => UserOtp, userOtp => userOtp.user)
    public otp: UserOtp

    @CreateDateColumn()
    public createdAt: Date

    @UpdateDateColumn()
    public updatedAt: Date

    @Exclude({toPlainOnly: true})
    @Column('uuid', {nullable: true})
    public resetPasswordCode: string

    @OneToMany(() => Bearer, bearer => bearer.user, {onDelete: 'CASCADE'})
    public bearers: Bearer[]

    @Exclude({toPlainOnly: true})
    public async setPassword(password: string): Promise<string> {
        if (!process.env.SALT_ROUNDS) {
            throw new InternalServerError('SALT_ROUNDS is not defined in process.env')
        }
        const SALT_ROUNDS = Number(process.env.SALT_ROUNDS)
        try {
            if (password.length < 8) {
                throw new BadRequestError('Password is too short, must be at least 8 letters long')
            }
            const salt = await bcrypt.genSalt(SALT_ROUNDS)
            const hash = await bcrypt.hash(password, salt)
            this.password = hash
            return hash
        } catch (error) {
            if (error.name === 'Error') {
                throw new BadRequestError('Password is too short, must be at least 8 letters long')
            } else {
                throw new InternalServerError('Could not set password')
            }
        }
    }

    @Exclude({toPlainOnly: true})
    public async comparePassword(plain: string): Promise<boolean> {
        if (await bcrypt.compare(plain, this.password)) {
            return true
        } else {
            throw new ForbiddenError('Passwords do not match')
        }
    }
}
