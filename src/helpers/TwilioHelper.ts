/**
 * Created by Hai Anh on 3/13/20
 */
import * as twilio from 'twilio'

export class TwilioHelper {
    private client
    private twilioAccountSid = process.env.TWILIO_SID
    private twilioAuthToken = process.env.TWILIO_AUTH_TOKEN
    private twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

    constructor() {
        this.client = twilio(this.twilioAccountSid, this.twilioAuthToken)
    }

    public async sendMessage(to: number, message: string) {
        return this.client.messages.create({
            body: message,
            from: this.twilioPhoneNumber,
            to,
        })
    }
}
