/**
 * Created by Hai Anh on 3/5/20
 */

import {Response} from 'express'
import {
    BadRequestError,
    Body,
    CurrentUser,
    Delete,
    ForbiddenError,
    Get,
    HeaderParam,
    InternalServerError,
    JsonController,
    NotFoundError,
    Param,
    Patch,
    Post, QueryParam,
    Redirect,
    Res, UnauthorizedError,
} from 'routing-controllers'
import {Connection, getConnection, Repository} from 'typeorm'
import * as uuidv4 from 'uuid/v4'
import {Bearer, User} from '../entity'
import {ConflictError} from '../error'
import {errorHelper} from '../helpers/ErrorHelper'
import {checkIfAdmin, checkIfUserInCompany, checkIfUserIsCompanyOwner} from '../middlewares/CheckPermission'
import {HTTP_CODE, UserRole} from '../utils/values'
import {TwilioHelper} from '../helpers/TwilioHelper'

@JsonController()
export class UsersController {
    private users: Repository<User>
    private bearers: Repository<Bearer>
    private files: Repository<File>
    private conn: Connection

    constructor() {
        this.conn = getConnection()
        this.users = this.conn.getRepository(User)
        this.bearers = this.conn.getRepository(Bearer)
        this.files = this.conn.getRepository(File)
    }

    /**
     *
     * @api {POST} users Create new owner
     * @apiName createUser
     * @apiGroup user
     * @apiVersion 1.0.0
     *
     * @apiParam  {String} [firstName] user's first name
     * @apiParam  {String} [lastName] user's last name
     * @apiParam  {String} [email] user's email
     * @apiParam  {String} [phoneNumber] user's phone number
     * @apiParam  {String} [password] user's password
     * @apiParam  {String} [address] user's street address
     * @apiParam  {String} [postalCode] user's postal code
     * @apiParam  {String} [city] user's city
     * @apiParam  {License}[license] user's license
     * @apiParam  {Company} [company] user's company
     * @apiParam  {File} [avatar] user's avatar
     * @apiParam  {userLanguages} [userLanguages] user's languages
     *
     * @apiParamExample  {type} Request-Example:
     *  {
     *    "firstName": "Arttu",
     *    "lastName": "Arponen",
     *    "email" : "arttu@vertics.co",
     *    "password": "password",
     *    "phoneNumber": "0443339799",
     *    "address": "Otakaari 5",
     *    "postalCode": "02510",
     *    "city": "Espoo",
     *    "license": {
     *        "id": 3
     *    },
     *    "companies":[{
     *        "id": 4
     *    }]
     *    ,
     *    avatar: {
     *        "id": 7
     *    },
     *    languages: [{
     *        "languageId": 1,
     *        "skillLevel": 3
     *    }, {
     *        "languageId": 2,
     *        "skillLevel": 4
     *    }]
     *  }
     *
     * @apiSuccessExample {type} Success-Response:
     * {
     *  "status": 'Created'
     * }
     *
     */
    @Post('/users')
    public async createDriver(@CurrentUser({required: true}) user: User, @Body({required: true, validate: true}) post: User, @Res() res: Response) {
        try {
            if (user.role !== UserRole.OWNER && user.role !== UserRole.ADMIN) {
                throw new ForbiddenError(`You don't have right to perform this action`)
            }
            const existingUser = await this.users.findOne({where: {email: post.email}})
            if (existingUser) {
                throw new ConflictError('Existing user')
            }
            const newUser = new User()
            newUser.firstName = post.firstName
            newUser.lastName = post.lastName
            newUser.email = post.email
            newUser.phoneNumber = post.phoneNumber
            newUser.address = post.address
            newUser.postalCode = post.postalCode
            newUser.city = post.city
            newUser.role = UserRole.DRIVER
            const randomPassword = uuidv4()
            await newUser.setPassword(randomPassword)
            const twilio = new TwilioHelper()
            const twilioRes = await twilio.createAuthyUser(newUser.email, newUser.phoneNumber)
            newUser.authyId = twilioRes.user.id
            const userInsertRes = await this.users.save(newUser)
            newUser.id = userInsertRes.id
            const resetPasswordCode = uuidv4()
            const resetPasswordLink = `${process.env.BACKEND_URL}users/password/${resetPasswordCode}`
            await this.users.update(newUser.id, {resetPasswordCode})
            const findNewUser = await this.users.findOne(newUser.id, {relations: ['license', 'avatar', 'companies', 'languages']})
            return res.status(HTTP_CODE.CREATED).send({message: 'Created', user: findNewUser})
        } catch (error) {
            errorHelper(error, error.message)
        }
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

    @Post('/users/reset/phoneNumber')
    public async getTemporaryPassword(@Body() post: any) {
        try {
            const user = await this.users.findOne({where: {phoneNumber: post.phoneNumber}})
            if (!user) {
                throw new BadRequestError('not existing user')
            }
            if (!user.authyId) {
                throw new BadRequestError('user does not have authy id')
            }
            const twilio = new TwilioHelper()
            twilio.getOtp(user.authyId)
            return {
                message: 'One time password has sent to your message',
                authyId: user.authyId
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
     *      "bearer": "2c7c724d-cbde-485f-968f-e8053d5201ea",
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

    @Post('/users/otp/verify')
    public async verifyOtp(@Body() post: any) {
        try {

            const twilio = new TwilioHelper()
            const verifyRes = await twilio.verifyOtp(post.authyId, post.token)
            if (verifyRes.status === 200) {
                const user = await this.users.findOne({where: {authyId: post.authyId}})
                const findBearer = await this.bearers.findOne({where: {user}})
                if (findBearer) {
                    const bearer = new Bearer()
                    bearer.bearer = uuidv4()
                    bearer.user = user
                    await this.bearers.delete(findBearer.bearer)
                    await this.bearers.save(bearer)
                    bearer.user = await this.users.findOne(user.id)
                    return bearer
                } else {
                    const bearer = new Bearer()
                    bearer.bearer = uuidv4()
                    bearer.user = user
                    await this.bearers.save(bearer)
                    bearer.user = await this.users.findOne(user.id)
                    return bearer
                }
            } else {
                throw new UnauthorizedError('Token is invalid')
            }
        } catch (error) {
            errorHelper(error, 'Token is invalid')
        }
    }
}
