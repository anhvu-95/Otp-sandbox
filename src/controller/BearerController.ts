import {
    BadRequestError,
    Body,
    CurrentUser,
    Delete, ForbiddenError,
    Get,
    HeaderParam,
    InternalServerError,
    JsonController,
    Post,
    UnauthorizedError,
} from 'routing-controllers'
import {getConnection, Repository} from 'typeorm'
import * as uuidv4 from 'uuid/v4'
import {Bearer, User} from '../entity'
import {errorHelper} from '../helpers/ErrorHelper'
import ILogin from '../interfaces/ILogin'
import {UserRole} from '../utils/values'

@JsonController('/bearers')
export class BearerController {
    private bearers: Repository<Bearer>
    private users: Repository<User>

    constructor() {
        this.bearers = getConnection().getRepository(Bearer)
        this.users = getConnection().getRepository(User)
    }

    /**
     *
     * @api {POST} bearers Creting a bearer/login token
     * @apiName postBearer
     * @apiGroup bearer
     * @apiVersion 1.0.0
     *
     * @apiParam  {String} [email] user's email
     * @apiParam  {String} [password] user's password
     *
     * @apiParamExample  {type} Request-Example:
     *  {
     *    "email" : "arttu@vertics.co",
     *    "password": "password",
     *  }
     *
     * @apiSuccessExample {type} Success-Response:
     * {
     *      "bearer": "2c7c724d-cbde-485f-968f-e8053d5201ea",
     *      "user": {
     *          "id": "ebd58bf0-ec60-4ae4-aa6c-f7a1d318624d",
     *          "firstName": "Arttu",
     *          "lastName": "Arponen",
     *          "email": "arttu@vertics.co",
     *          "phoneNumber": "1234567890",
     *          "createdAt": "2019-06-24T05:12:13.782Z",
     *          "updatedAt": "2019-07-09T12:25:41.540Z",
     *          "isAdmin": false,
     *          "emailIsVerified": true,
     *          "identificationVerified": false
     *      },
     *      "createdAt": "2019-07-11T11:04:47.284Z",
     *      "updatedAt": "2019-07-11T11:04:47.284Z"
     *  }
     *
     */

    @Post()
    public async post(@Body() post: ILogin) {
        const {email, password} = post
        if (!email || !password) {
            throw new BadRequestError('Password or email missing')
        }
        try {
            const user = await this.users.findOne({where: {email}})
            if (!user) {
                throw new UnauthorizedError(`User was not found`)
            }
            if (user.isDeactivated) {
                throw new ForbiddenError('The account is deactivated')
            }
            const findBearer = await this.bearers.findOne({where: {user}})

            if (findBearer) {
                try {
                    if (await user.comparePassword(password)) {
                        const bearer = new Bearer()
                        bearer.bearer = uuidv4()
                        bearer.user = user
                        await this.bearers.delete(findBearer.bearer)
                        await this.bearers.save(bearer)
                        bearer.user = await this.users.findOne(user.id, {relations: ['avatar']})
                        return bearer
                    }
                } catch (error) {
                    throw new InternalServerError(`${error}`)
                }
            }
            if (await user.comparePassword(password)) {
                const bearer = new Bearer()
                bearer.bearer = uuidv4()
                bearer.user = user
                await this.bearers.save(bearer)
                bearer.user = await this.users.findOne(user.id, {relations: ['avatar']})
                return bearer
            }
        } catch (error) {
            errorHelper(error, error.message)
        }
    }

    /**
     *
     * @api {GET} bearers Get a bearer/login token
     * @apiName getBearer
     * @apiGroup bearer
     * @apiVersion 1.0.0
     *
     * @apiHeader {String} bearer Bearer
     *
     * @apiSuccessExample {type} Success-Response:
     * {
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

    @Get()
    public async verify(@CurrentUser({required: true}) user: User) {
        return user
    }

    /**
     *
     * @api {DELETE} bearers Delete a bearer/login token
     * @apiName deleteBearer
     * @apiGroup bearer
     * @apiVersion 1.0.0
     *
     * @apiHeader {String} bearer Bearer
     *
     * @apiSuccessExample {type} Success-Response:
     * {
     *  "status": 'Deleted'
     * }
     *
     */

    @Delete()
    public async delete(@CurrentUser({required: true}) user: User, @HeaderParam('bearer') bearer: string) {
        await this.bearers.delete(bearer)
        return {status: 'Deleted'}
    }
}
