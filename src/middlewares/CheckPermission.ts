import {ForbiddenError} from 'routing-controllers'
import {getConnection} from 'typeorm'
import {Company, User} from '../entity'
import {UserRole} from '../utils/values'

export const checkIfUserIsCompanyOwner = async (user: User, companyId) => {
    if (user.role === UserRole.ADMIN) {
        return true
    } else if (user.role === UserRole.OWNER) {
        const currentUser = await getConnection().getRepository(User).findOneOrFail(user.id, {relations: ['companies']})
        const isCurrentUserInCompany = currentUser.companies.some(company => company.id === companyId)
        if (isCurrentUserInCompany) {
            return true
        } else {
            throw new ForbiddenError(`You don't have right to perform this action`)
        }
    } else {
        throw new ForbiddenError(`You don't have right to perform this action`)
    }
}

/**
 *
 * @param {User} currentUser
 * @param {number} editedUserId
 * @param {number} companyId
 */

export const checkIfUserInCompany = async (currentUser: User, editedUserId: number, companyId: number) => {
    if (currentUser.id === editedUserId) {
        return true
    } else {
        if (currentUser.role === UserRole.ADMIN) {
            return true
        } else if (currentUser.role === UserRole.OWNER) {
            const findCompany =  await getConnection().getRepository(Company).findOneOrFail(companyId, {relations: ['employees']})
            const isEditedUserInCompany = findCompany.employees.some(employee => employee.id === editedUserId)
            const isOwnerInCompany = findCompany.employees.some(employee => employee.id === currentUser.id)
            if (isEditedUserInCompany && isOwnerInCompany) {
                return true
            } else {
                throw new ForbiddenError(`You don't have right to to perform this action`)
            }
        } else {
            throw new ForbiddenError(`You don't have right to perform this action`)
        }
    }
}

export const checkIfAdmin = (user: User) => {
    if (user.role === UserRole.ADMIN) {
        return true
    }
    throw new ForbiddenError(`You don't have right to perform this action`)
}
