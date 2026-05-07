import { User } from "@prisma/client";
import { HTTPException } from "hono/http-exception";
import { prismaClient } from "../application/database";
import { PostModel } from "../application/mongoDatabase";
import { ToggleLikeResponse } from "../models/like";

export class LikeService {

    static async toggle(user: User, postMongoId: string): Promise<ToggleLikeResponse> {
        const post = await PostModel.findById(postMongoId)
        if (!post) {
            throw new HTTPException(404, { message: "Post not found" })
        }

        const existing = await prismaClient.like.findUnique({
            where: {
                postMongoId_userId: { postMongoId, userId: user.username }
            }
        })

        if (existing) {
            await prismaClient.like.delete({
                where: {
                    postMongoId_userId: { postMongoId, userId: user.username }
                }
            })
            await PostModel.findByIdAndUpdate(postMongoId, { $inc: { likesCount: -1 } })
            return { liked: false }
        }

        await prismaClient.like.create({
            data: { postMongoId, userId: user.username }
        })
        await PostModel.findByIdAndUpdate(postMongoId, { $inc: { likesCount: 1 } })
        return { liked: true }
    }
}
