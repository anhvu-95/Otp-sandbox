export const HTTP_CODE = {
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
}

export enum UserRole {
    ADMIN = 'ADMIN',
    OPERATOR = 'OPERATOR',
    OWNER = 'OWNER',
    DRIVER = 'DRIVER',
}

export enum CarColor {
    RED = 'punainen',
    BLUE = 'sininen',
    GREY = 'harmaa',
    GREEN = 'vihreä',
    SILVER = ' hopea',
    WHITE = 'valkoinen',
    BLACK = 'musta',
    BROWN = 'ruskea/beige',
    YELLOW = 'keltainen',
    OTHER = 'muu',
}

export enum FileType {
    AVATAR = 'avatar',
    LICENSE = 'license',
}

export enum LicenseType {
    USER = 'user',
    COMPANY = 'company'
}
