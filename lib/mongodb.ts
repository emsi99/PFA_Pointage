import mongoose from 'mongoose'
import dns from 'node:dns'

// Force IPv4 first to avoid DNS resolution issues on some networks
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first')
}

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI manquant dans .env.local')
}

interface CacheMongoose {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  var _mongoose: CacheMongoose | undefined
}

const cache: CacheMongoose = global._mongoose ?? { conn: null, promise: null }
global._mongoose = cache

export async function connectDB() {
  if (cache.conn) return cache.conn
  if (!cache.promise) {
    console.log('Connecting to MongoDB...')
    cache.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      family: 4,
    }).then((m) => {
      console.log('MongoDB connected successfully')
      return m
    }).catch((err) => {
      console.error('MongoDB connection error:', err)
      throw err
    })
  }
  cache.conn = await cache.promise
  return cache.conn
}
