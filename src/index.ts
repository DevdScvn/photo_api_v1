import { Hono } from 'hono'
import { swaggerUI } from '@hono/swagger-ui'
import { userController } from './controllers/userController'
import { openApiSpec } from './openapi'
import { HTTPException } from 'hono/http-exception'
import { ZodError } from 'zod'

const app = new Hono()

app.get('/docs', swaggerUI({ url: '/docs/spec' }))
app.get('/docs/spec', (c) => c.json(openApiSpec))

app.route('/', userController)

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
