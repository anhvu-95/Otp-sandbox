/**
 * Created by Hai Anh on 3/13/20
 */
import axios from 'axios'

export class TwilioHelper {
    private twilioAuthyToken = process.env.TWILIO_AUTHY_API_KEY
    private baseEndPoint = 'https://api.authy.com/protected/json'

    public async createAuthyUser(email: string, phoneNumber: string): Promise<any> {
        const data = {
            email,
            phoneNumber
        }
        return axios.post(`${this.baseEndPoint}/users/new?api_key=${this.twilioAuthyToken}`, data)
    }

    public async getOtp(authyId: string): Promise<any> {
        return axios.get(`${this.baseEndPoint}/sms/${authyId}?api_key=${this.twilioAuthyToken}&force=true&locale=fi`)
    }

    public async verifyOtp(authyId: string, token: string): Promise<any> {
        const headers = {
            'X-Authy-API-Key': this.twilioAuthyToken
        }
        return axios.get(`${this.baseEndPoint}/verify/${token}/${authyId}`, {headers})
    }
}
