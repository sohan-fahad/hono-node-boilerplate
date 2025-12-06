import 'reflect-metadata'
import 'dotenv/config'
import { serve } from '@hono/node-server'
import { app } from './app.module.js'
import { ENV } from './env.js'
import { testConnection } from './database/connection.js'


app.get('/', (c) => {
  return c.text('Hello Hono!')
})

// Test database connection before starting server
testConnection().then((connected) => {
  if (!connected) {
    console.warn('⚠️  Database connection failed. Server will start but database features may not work.')
  }

  serve({
    fetch: app.fetch,
    port: ENV.PORT
  }, (info) => {
    console.log(`✅ Server is running on http://localhost:${info.port}`)
    console.log(`📦 Environment: ${ENV.NODE_ENV}`)
    console.log(`🗄️  Database: ${connected ? 'Connected' : 'Not Connected'}`)
  })
})

