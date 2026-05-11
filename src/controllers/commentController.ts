import { Hono } from "hono";
import { User } from "@prisma/client";
import { ApplicationVariable } from "../models/app";
import { authMiddleware } from "../middleware/authMiddleware";
import { CommentService } from "../services/commentService";
import { CreateCommentRequest } from "../models/comment";

export const commentController = new Hono<{ Variables: ApplicationVariable }>();

commentController.post('/api/posts/:postId/comments', authMiddleware, async (c) => {
    const user = c.get('user') as User
    const postId = c.req.param('postId')
    const request = await c.req.json() as CreateCommentRequest

    const response = await CommentService.create(user, postId, request)

    return c.json({ data: response }, 201)
})

commentController.get('/api/posts/:postId/comments', async (c) => {
    const postId = c.req.param('postId')

    const response = await CommentService.list(postId)

    return c.json({ data: response })
})

commentController.delete('/api/comments/:commentId', authMiddleware, async (c) => {
    const user = c.get('user') as User
    const commentId = Number(c.req.param('commentId'))

    await CommentService.remove(user, commentId)

    return c.json({ data: true })
})
