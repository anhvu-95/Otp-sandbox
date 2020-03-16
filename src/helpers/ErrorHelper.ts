import {BadRequestError, ForbiddenError, InternalServerError, NotFoundError} from 'routing-controllers'

export function errorHelper(e: Error, defaultMessage?: string) {
    if (e.name === 'EntityNotFound') {
        throw new NotFoundError(e.message)
    }
    if (e instanceof NotFoundError) {
        throw new NotFoundError(e.message)
    } else if (e instanceof InternalServerError) {
        throw new InternalServerError(e.message)
    } else if (e instanceof BadRequestError) {
        throw new BadRequestError(e.message)
    } else if (e instanceof ForbiddenError) {
        throw new ForbiddenError(e.message)
    } else {
        throw new InternalServerError(defaultMessage)
    }
}
