import { Hono } from "hono";
import { User } from "@prisma/client";
import { AppicationVariable } from "../models/app";
import { authMiddleware } from "../middleware/authMiddleware";
import { LikeService } from "../services/likeService";

export const likeController = new Hono<{ Variables: AppicationVariable }>();

likeController.post('/api/posts/:postId/likes', authMiddleware, async (c) => {
    const user = c.get('user') as User
    const postId = c.req.param('postId')

    const response = await LikeService.toggle(user, postId)

    return c.json({ data: response })
})
