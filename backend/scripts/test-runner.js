import fs from 'fs'
import path from 'path'
import vm from 'vm'
import { MongoClient, Int32, Decimal128 } from 'mongodb'

async function runCinemaScript() {
  const client = new MongoClient('mongodb://127.0.0.1:27017')
  await client.connect()
  const db = client.db('CinemaLoyaltyDB')

  console.log('[Script] Preparing sandbox environment for CinemaLoyaltyDB.js...')

  // Create collections helper
  const collectionNames = (await db.listCollections().toArray()).map(c => c.name)

  const dbProxy = {
    getSiblingDB: (name) => client.db(name),
    getCollectionNames: () => collectionNames,
    createCollection: async (name, options) => {
      console.log(`  -> Creating collection: ${name}`)
      try {
        await db.createCollection(name, options)
        if (!collectionNames.includes(name)) collectionNames.push(name)
      } catch (err) {
        if (!err.message.includes('already exists')) {
          console.warn(`     Warning creating collection ${name}:`, err.message)
        }
      }
    }
  }

  // Proxy for collection access: db.khach_hang.insertMany(...)
  const dbHandler = new Proxy(dbProxy, {
    get(target, prop) {
      if (prop in target) return target[prop]
      const col = db.collection(prop)
      return {
        createIndex: async (keys, options) => {
          try {
            await col.createIndex(keys, options)
          } catch (e) {
            // ignore index already exists
          }
        },
        insertMany: async (docs) => {
          console.log(`  -> Inserting ${docs.length} docs into ${prop}`)
          try {
            await col.insertMany(docs, { ordered: false })
          } catch (e) {
            console.warn(`     Insert warning in ${prop}:`, e.message)
          }
        },
        insertOne: async (doc) => {
          try {
            await col.insertOne(doc)
          } catch (e) {
            console.warn(`     Insert warning in ${prop}:`, e.message)
          }
        }
      }
    }
  })

  const context = {
    db: dbHandler,
    NumberInt: (n) => new Int32(parseInt(n, 10)),
    NumberDecimal: (s) => Decimal128.fromString(s.toString()),
    ISODate: (s) => new Date(s),
    Date: Date,
    D: (s) => new Date(s),
    V: (n) => Decimal128.fromString(n.toString()),
    print: console.log,
    console: console,
  }

  vm.createContext(context)

  const scriptPath = path.resolve('..', 'CinemaLoyaltyDB.js')
  console.log(`[Script] Reading script from ${scriptPath}`)
  const scriptCode = fs.readFileSync(scriptPath, 'utf-8')

  // Execute
  // Because the script contains top-level async calls if treated as async, but CinemaLoyaltyDB.js is synchronous shell calls
  // Wait! In mongo shell, db.col.insertMany is blocking. In Node driver it returns promises!
  // Let's wrap each statement in await if we execute an async IIFE, or let's inspect the script.
}
