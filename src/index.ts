import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { swaggerUI } from '@hono/swagger-ui'
import { userController } from './controllers/userController'
import { commentController } from './controllers/commentController'
import { likeController } from './controllers/likeController'
import { postController } from './controllers/postController'
import { uploadController } from './controllers/uploadController'
import { openApiSpec } from './openapi'
import { ensureBucket } from './application/minioClient'
import { connectMongo } from './application/mongoDatabase'
import { HTTPException } from 'hono/http-exception'
import { ZodError } from 'zod'

async function bootstrap() {
    await connectMongo()
    await ensureBucket()
}

await bootstrap()

const app = new Hono()

app.use('*', cors())

app.get('/', () => new Response(Bun.file('./test-client.html')))
app.get('/docs', swaggerUI({ url: '/docs/spec' }))
app.get('/docs/spec', (c) => c.json(openApiSpec))

app.route('/', userController)
app.route('/', commentController)
app.route('/', likeController)
app.route('/', postController)
app.route('/', uploadController)

app.onError(async (error, c) => {
    if (error instanceof HTTPException) {
        c.status(error.status)
        return c.json({
            errors: error.message
        })
    } else if (error instanceof ZodError) {
        c.status(400)
        return c.json({
            errors: error.message
        })
    } else {
        c.status(500)
        return c.json({
            errors: error.message
        })

    }
})

export default app
