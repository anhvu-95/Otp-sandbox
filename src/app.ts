import * as bodyParser from 'body-parser'
import * as cors from 'cors'
import * as dotenv from 'dotenv'
import * as express from 'express'
import * as helmet from 'helmet'
import * as methodOverride from 'method-override'
import * as morgan from 'morgan'
import {Server} from 'net'
import 'reflect-metadata'
import {Action, useExpressServer} from 'routing-controllers'
import {createConnection, getConnection} from 'typeorm'
import {BearerController, MainController, UsersController} from './controller'
import {Bearer} from './entity'

export default class App {

    private app: express.Application
    private server: Server

    public async getApp(): Promise<any> {
        await this.init()
        return this.app
    }

    public async run(): Promise<any> {
        await this.init()
        /**
         * START the server
         */
        this.server = this.app.listen(process.env.PORT, function() {
            console.log('The server is running in port: ', process.env.PORT, ' In ', process.env.NODE_ENV, ' mode')
        })
    }

    public async init(NODE_ENV: string = 'development', PORT: number = 3000): Promise<express.Application> {

        /**
         * Setting environment for development|production
         */
        process.env.NODE_ENV = process.env.NODE_ENV || NODE_ENV

        /**
         * Setting port number
         */
        process.env.PORT = process.env.PORT || String(PORT)

        /**
         * Dotenv init
         */

        dotenv.config()

        /**
         * Create our app w/ express
         */
        this.app = express()

        /**
         * HELMET
         */
        this.app.use(helmet())

        /**
         * CORS
         */
        this.app.use(cors())

        /**
         * LOGGING
         */
        this.app.use(morgan('combined'))

        /**
         * Body parsers and methods
         */
        this.app.use(bodyParser.urlencoded({
            extended: true,
            limit: '50MB',
        })) // parse application/x-www-form-urlencoded
        this.app.use(bodyParser.json({limit: '50MB'})) // parse application/json
        this.app.use(methodOverride())

        /**
         * Database
         */

        // This is for tests. Bit shabby but works. Closing old connection would be better to be included in express.on('close) listener if such exists
        try {
            getConnection()
        } catch (e) {
            await createConnection()
                .catch(err => {
                    console.log('Database connection failure', err)
                })
        }

        /**
         * Setting routes
         */
        useExpressServer(this.app, {
            classTransformer: true,
            development: false,
            controllers: [
                BearerController,
                UsersController,
                MainController,
            ],
            currentUserChecker: async (action: Action) => {
                try {
                    const bearer = action.request.headers.bearer
                    const bearerEntity = await getConnection()
                        .getRepository(Bearer)
                        .findOne({
                            where: {
                                bearer,
                            },
                        })
                    return bearerEntity.user
                } catch (e) {
                    return null
                }
            },
        })
        return this.app
    }
}
