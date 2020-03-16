import {Get, InternalServerError, JsonController} from 'routing-controllers'
import {getConnection} from 'typeorm'
import {UsersController} from './UserController'
import {UserOtpController} from './UserOtpController'

@JsonController()
class MainController {
    @Get('/')
    public async root() {
        if (getConnection().isConnected) {
            return {
                msg: 'API OK',
            }
        } else {
            throw new InternalServerError('Database connection error')
        }
    }

}
export {UsersController, MainController, UserOtpController}
