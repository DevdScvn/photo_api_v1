import { HydratedDocument } from "mongoose"
import { IPost } from "../application/mongoDatabase"

export type PostImage = {
    url: string
    key: string
    mimeType?: string
}

export type PostExif = {
    camera?: string
    lens?: string
    iso?: number
    aperture?: string
    shutter?: string
    takenAt?: Date
    location?: { lat: number; lng: number }
}

export type CreatePostRequest = {
    title: string
    description?: string
    images: PostImage[]
    exif?: PostExif
    tags?: string[]
}

export type UpdatePostRequest = {
    title?: string
    description?: string
    tags?: string[]
}

export type PostResponse = {
    id: string
    title: string
    description?: string
    authorId: string
    images: PostImage[]
    exif?: PostExif
    tags: string[]
    likesCount: number
    createdAt: Date
    updatedAt: Date
}

export function toPostResponse(post: HydratedDocument<IPost>): PostResponse {
    return {
        id: post._id.toString(),
        title: post.title,
        description: post.description,
        authorId: post.authorId,
        images: post.images ?? [],
        exif: post.exif,
        tags: post.tags ?? [],
        likesCount: post.likesCount ?? 0,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
    }
}
