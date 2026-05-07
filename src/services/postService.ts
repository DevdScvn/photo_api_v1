import { User } from "@prisma/client"
import { HTTPException } from "hono/http-exception"
import { DeleteObjectCommand } from "@aws-sdk/client-s3"
import { PostModel } from "../application/mongoDatabase"
import { s3 } from "../application/minioClient"
import { CreatePostRequest, UpdatePostRequest, PostResponse, toPostResponse } from "../models/post"
import { PostValidation } from "../validations/postValidation"

const BUCKET = process.env.MINIO_BUCKET!

export class PostService {

    static async create(user: User, request: CreatePostRequest): Promise<PostResponse> {
        request = PostValidation.CREATE.parse(request)

        const post = await PostModel.create({
            ...request,
            authorId: user.username,
        })

        return toPostResponse(post)
    }

    static async findById(id: string): Promise<PostResponse> {
        const post = await PostModel.findById(id)
        if (!post) {
            throw new HTTPException(404, { message: "Post not found" })
        }
        return toPostResponse(post)
    }

    static async list(tag?: string, page: number = 1, limit: number = 20): Promise<PostResponse[]> {
        const filter = tag ? { tags: tag } : {}
        const posts = await PostModel.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)

        return posts.map(toPostResponse)
    }

    static async update(user: User, id: string, request: UpdatePostRequest): Promise<PostResponse> {
        request = PostValidation.UPDATE.parse(request)

        const post = await PostModel.findById(id)
        if (!post) {
            throw new HTTPException(404, { message: "Post not found" })
        }
        if (post.authorId !== user.username) {
            throw new HTTPException(403, { message: "Forbidden" })
        }

        const updated = await PostModel.findByIdAndUpdate(id, { $set: request }, { new: true })
        return toPostResponse(updated!)
    }

    static async remove(user: User, id: string): Promise<void> {
        const post = await PostModel.findById(id)
        if (!post) {
            throw new HTTPException(404, { message: "Post not found" })
        }
        if (post.authorId !== user.username) {
            throw new HTTPException(403, { message: "Forbidden" })
        }

        await Promise.all(
            post.images.map((img) =>
                s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: img.key }))
            )
        )

        await PostModel.findByIdAndDelete(id)
    }
}
