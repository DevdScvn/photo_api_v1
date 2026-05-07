import { Like } from "@prisma/client"

export type LikeResponse = {
    postMongoId: string
    userId: string
}

export type ToggleLikeResponse = {
    liked: boolean
}

export function toLikeResponse(like: Like): LikeResponse {
    return {
        postMongoId: like.postMongoId,
        userId: like.userId
    }
}
