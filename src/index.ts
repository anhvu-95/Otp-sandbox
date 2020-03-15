import App from './app'

const run = async (): Promise<void> => {
  await new App().run()
}
/* tslint:disable */
run()
