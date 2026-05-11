import { Hono } from "hono";
import { User } from "@prisma/client";
import { ApplicationVariable } from "../models/app";
import { authMiddleware } from "../middleware/authMiddleware";
import { LikeService } from "../services/likeService";

export const likeController = new Hono<{ Variables: ApplicationVariable }>();

likeController.post('/api/posts/:postId/likes', authMiddleware, async (c) => {
    const user = c.get('user') as User
    const postId = c.req.param('postId')

    const response = await LikeService.toggle(user, postId)

    return c.json({ data: response })
})
