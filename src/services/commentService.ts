import { User } from "@prisma/client";
import { HTTPException } from "hono/http-exception";
import { prismaClient } from "../application/database";
import { PostModel } from "../application/mongoDatabase";
import { CreateCommentRequest, CommentResponse, toCommentResponse } from "../models/comment";
import { CommentValidation } from "../validations/commentValidation";

export class CommentService {

    static async create(user: User, postMongoId: string, request: CreateCommentRequest): Promise<CommentResponse> {
        request = CommentValidation.CREATE.parse(request)

        const post = await PostModel.findById(postMongoId)
        if (!post) {
            throw new HTTPException(404, { message: "Post not found" })
        }

        const comment = await prismaClient.comment.create({
            data: {
                text: request.text,
                postMongoId,
                authorId: user.username,
            }
        })

        return toCommentResponse(comment)
    }

    static async list(postMongoId: string): Promise<CommentResponse[]> {
        const post = await PostModel.findById(postMongoId)
        if (!post) {
            throw new HTTPException(404, { message: "Post not found" })
        }

        const comments = await prismaClient.comment.findMany({
            where: { postMongoId },
            orderBy: { createdAt: "desc" },
        })

        return comments.map(toCommentResponse)
    }

    static async remove(user: User, commentId: number): Promise<void> {
        const comment = await prismaClient.comment.findUnique({
            where: { id: commentId }
        })

        if (!comment) {
            throw new HTTPException(404, { message: "Comment not found" })
        }

        if (comment.authorId !== user.username) {
            throw new HTTPException(403, { message: "Forbidden" })
        }

        await prismaClient.comment.delete({ where: { id: commentId } })
    }
}
