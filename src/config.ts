import * as dotenv from 'dotenv'

dotenv.config()

const { TOKEN, CLIENT_ID } = process.env

if (!TOKEN || !CLIENT_ID)
    throw new Error('No token or client id present!')

export const config = {
    TOKEN,
    CLIENT_ID
}