/**
 * Created by Hai Anh on 3/4/20
 */
import {HttpError} from 'routing-controllers'
import {HTTP_CODE} from '../utils/values'

export class ConflictError extends HttpError {
    public message: string

    constructor(message: string) {
        super(HTTP_CODE.CONFLICT)
        Object.setPrototypeOf(this, ConflictError.prototype)
        this.message = message
    }
}
