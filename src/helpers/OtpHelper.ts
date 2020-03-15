import * as crypto from 'crypto'
import * as base32 from 'hi-base32'

// Generate secrey key for app
export class OtpHelper {

    // Generate TOTP
    public generateTotp = (secret, window = 0) => {
        const counter = Math.floor(Date.now() / 30000)
        return this.generateHotp(counter + window)
    }

// Verify TOTP
    public verifyTotp = (token, window = 0) => {
        if (Math.abs(+window) > 10) {
            return false
        }

        for (let errorWindow = -window; errorWindow <= +window; errorWindow++) {
            const totp = this.generateTotp(process.env.APP_SECRET, errorWindow)
            if (token === totp) {
                return true
            }
        }
        return false
    }

    private generateSecret = (length) => {
        const randomBuffer = crypto.randomBytes(length)
        return base32.encode(randomBuffer).replace(/=/g, '')
    }

// Generate hmac
    private generateHmac = (counter) => {
        const decodedSecret = base32.decode.asBytes(process.env.APP_SECRET)
        const buffer = Buffer.alloc(8);
        for (let i = 0; i < 8; i++) {
            buffer[7 - i] = counter & 0xff;
            counter = counter >> 8;
        }
        // Generate hmac value
        const hmac = crypto.createHmac('sha1', Buffer.from(decodedSecret))
        return hmac.update(buffer)

    }

// Truncate hmac
    private truncateHmac = (hmacValue) => {
        const offset = hmacValue[hmacValue.length - 1] & 0xf
        return ((hmacValue[offset] & 0x7f) << 24) |
            ((hmacValue[offset + 1] & 0xff) << 16) |
            ((hmacValue[offset + 2] & 0xff) << 8) |
            (hmacValue[offset + 3] & 0xff)

    }

// Generate HOTP
    private generateHotp = (counter) => {
        const hmac = this.generateHmac(counter)
        const code = this.truncateHmac(hmac)
        // Extract result to get 6 digits
        return code % 10 ** 6
    }
}