# typescript-typeorm-boilerplate

##Installation

1. Install [yarn](https://yarnpkg.com/en/) by `brew install yarn`
2. Install postgresql
    * `brew install postgresql`
    * `start postgresql`
3. Create Database
    * `createdb typescript-typeorm-boilerplate-dev` and `createdb typescript-typeorm-boilerplate-production` (or what's configured in ormconfig.json)
    * If you face problems with database connection when running, try your unix username as database username. Password might also be "postgres"
4. Add global requirements by `yarn global add ts-node typeorm tsc` (node bundled with typescript transpiler, typeorm and typescript transpiler)
5. Run `yarn install && yarn run start`

## Core technologies

Roughly knowing what are the capabilities and roles of each is mandatory for understanding and developing the software

* [Node](https://nodejs.org)
* [PostgreSQL](https://www.postgresql.org) Database
* [TypeORM](https://typeorm.io) ORM
* [rounting-controllers](https://github.com/typestack/routing-controllers) simplifying [Express](http://expressjs.com) routings with decorators
  * [socket-controllers](https://github.com/typestack/socket-controllers) Handlind websockets
* [Typescript](http://www.typescriptlang.org)
* [class-transformer](https://github.com/typestack/class-transformer)

See package.json for more.

### Tests

TBW/TODO

### Production

TBW

###TODO

- ts-node-dev
