import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017'
const DB_NAME = process.env.DB_NAME || 'CinemaLoyaltyDB'

let client = null
let db = null

export async function connectDB() {
  if (db) return db
  try {
    client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    })
    await client.connect()
    db = client.db(DB_NAME)
    console.log(`[MongoDB] Connected successfully to "${DB_NAME}" at ${MONGODB_URI}`)
    return db
  } catch (error) {
    console.error(`[MongoDB] Connection error:`, error.message)
    throw error
  }
}

export function getDB() {
  if (!db) {
    throw new Error('Database not connected. Call connectDB() first.')
  }
  return db
}

export async function closeDB() {
  if (client) {
    await client.close()
    client = null
    db = null
  }
}
