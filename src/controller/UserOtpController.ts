/**
 * Created by Hai Anh on 3/15/20
 */
import {BadRequestError, Body, JsonController, Post, UnauthorizedError} from 'routing-controllers'
import {Connection, getConnection, Repository} from 'typeorm'
import {User, UserOtp} from '../entity'
import {errorHelper} from '../helpers/ErrorHelper'
import {OtpHelper} from '../helpers/OtpHelper'

@JsonController('/otp')
export class UserOtpController {
    private users: Repository<User>
    private userOtp: Repository<UserOtp>
    private conn: Connection

    constructor() {
        this.conn = getConnection()
        this.users = this.conn.getRepository(User)
        this.userOtp = this.conn.getRepository(UserOtp)
    }

    /**
     *
     * @api {POST} users/reset/phoneNumber Getting one time password
     * @apiName resetPassword
     * @apiGroup user
     * @apiVersion 1.0.0
     *
     * @apiParam  {String} phoneNumber user's phoneNumber
     *
     * @apiParamExample  {type} Request-Example:
     *  {
     *    "phoneNumber" : "+358 402434325"
     *  }
     *
     * @apiSuccessExample {type} Success-Response:
     * {
     *  "status": 'One time password has sent to your message'
     * }
     *
     */

    @Post('/reset')
    public async getTemporaryPassword(@Body() post: any) {
        try {
            const user = await this.users.findOne({where: {phoneNumber: post.phoneNumber}})
            if (!user) {
                throw new BadRequestError('not existing user')
            }
            const findUserOtp = await this.userOtp.findOne({where: {userId: user.id}})
            const otp = new OtpHelper()
            const secret = otp.generateSecret(20)
            const totpCode = otp.generateTotp(secret, 1)
            if (findUserOtp) {
                await this.userOtp.update(findUserOtp.id, {
                    secret,
                    otp: totpCode
                })
            } else {
                const newUserOtp = new UserOtp()
                newUserOtp.otp = totpCode
                newUserOtp.secret = secret
                newUserOtp.user = user
                await this.userOtp.save(newUserOtp)
            }
            // const twilio = new TwilioHelper()
            // twilio.sendMessage(post.phoneNumber, `Your otp code is: ${totpCode}`)
            return {
                message: 'One time password has sent to your message',
            }
        } catch (error) {
            errorHelper(error, 'There was error while resetting password')
        }
    }

    /**
     *
     * @api {POST} users/otp/verify Verify otp
     * @apiName verifyOtp
     * @apiGroup user
     * @apiVersion 1.0.0
     *
     * @apiParamExample  {type} Request-Example:
     *  {
     *    "authyId": "2423552"
     *    "token": "4324534"
     *  }
     *
     * @apiSuccessExample {type} Success-Response:
     *  {
     *      "createdAt": "2019-07-11T11:04:47.284Z",
     *      "updatedAt": "2019-07-11T11:04:47.284Z",
     *      "user": {
     *          "id": "ebd58bf0-ec60-4ae4-aa6c-f7a1d318624d",
     *          "firstName": "Arttu",
     *          "lastName": "Arponen",
     *          "email": "arttu@vertics.co",
     *          "phoneNumber": "1234567890",
     *          "password": "$2a$13$0DPkTwa6Zc4UTaPXNZ85EeQ9cYBCEeLmjOnqyKN9NqP.ttYkRx3mG",
     *          "createdAt": "2019-06-24T05:12:13.782Z",
     *          "updatedAt": "2019-07-09T12:25:41.540Z",
     *          "isAdmin": false,
     *          "emailIsVerified": true,
     *          "verificationCode": "039a5c29-52bd-45a9-8d63-20d9151c5edd",
     *          "identificationVerified": false
     *      }
     *  }
     *
     */

    @Post('/verify')
    public async verifyOtp(@Body() post: any) {
        try {
            const findOtp = await this.userOtp.findOne({where: {otp: post.token}, relations: ['user']})
            if (!findOtp) {
                throw new UnauthorizedError('Token is invalid')
            }
            const otp = new OtpHelper()
            const isVerified = otp.verifyTotp(findOtp.secret, post.token, 1)
            const userId = findOtp.user.id
            await this.userOtp.remove(findOtp)
            if (isVerified) {
                return this.users.findOne(userId)
            } else {
                await this.userOtp.remove(findOtp)
                throw new UnauthorizedError('Token is invalid')
            }
        } catch (error) {
            console.log(error)
            errorHelper(error, 'Token is invalid')
        }
    }
}
