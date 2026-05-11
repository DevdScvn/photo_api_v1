import { Hono } from "hono"
import { User } from "@prisma/client"
import { ApplicationVariable } from "../models/app"
import { authMiddleware } from "../middleware/authMiddleware"
import { PostService } from "../services/postService"
import { CreatePostRequest, UpdatePostRequest } from "../models/post"

export const postController = new Hono<{ Variables: ApplicationVariable }>()

postController.get('/api/posts', async (c) => {
    const tag  = c.req.query('tag')
    const page = Number(c.req.query('page') ?? 1)

    const response = await PostService.list(tag, page)

    return c.json({ data: response })
})

postController.get('/api/posts/:id', async (c) => {
    const id = c.req.param('id')

    const response = await PostService.findById(id)

    return c.json({ data: response })
})

postController.post('/api/posts', authMiddleware, async (c) => {
    const user    = c.get('user') as User
    const request = await c.req.json() as CreatePostRequest

    const response = await PostService.create(user, request)

    return c.json({ data: response }, 201)
})

postController.patch('/api/posts/:id', authMiddleware, async (c) => {
    const user    = c.get('user') as User
    const id      = c.req.param('id')
    const request = await c.req.json() as UpdatePostRequest

    const response = await PostService.update(user, id, request)

    return c.json({ data: response })
})

postController.delete('/api/posts/:id', authMiddleware, async (c) => {
    const user = c.get('user') as User
    const id   = c.req.param('id')

    await PostService.remove(user, id)

    return c.json({ data: true })
})
