import { Comment } from "@prisma/client"

export type CreateCommentRequest = {
    text: string
}

export type CommentResponse = {
    id: number
    text: string
    postMongoId: string
    authorId: string
    createdAt: Date
}

export function toCommentResponse(comment: Comment): CommentResponse {
    return {
        id: comment.id,
        text: comment.text,
        postMongoId: comment.postMongoId,
        authorId: comment.authorId,
        createdAt: comment.createdAt
    }
}
