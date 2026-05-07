import { ZodType, z } from "zod"
import { CreatePostRequest, UpdatePostRequest } from "../models/post"

export class PostValidation {
    static readonly CREATE: ZodType<CreatePostRequest> = z.object({
        title: z.string().min(1).max(200),
        description: z.string().optional(),
        images: z.array(
            z.object({
                url: z.string().url(),
                key: z.string().min(1),
                mimeType: z.string().optional(),
            })
        ).min(1),
        exif: z.object({
            camera:   z.string().optional(),
            lens:     z.string().optional(),
            iso:      z.number().int().positive().optional(),
            aperture: z.string().optional(),
            shutter:  z.string().optional(),
            takenAt:  z.coerce.date().optional(),
            location: z.object({ lat: z.number(), lng: z.number() }).optional(),
        }).optional(),
        tags: z.array(z.string().min(1).max(50)).max(20).optional(),
    })

    static readonly UPDATE: ZodType<UpdatePostRequest> = z.object({
        title:       z.string().min(1).max(200).optional(),
        description: z.string().optional(),
        tags:        z.array(z.string().min(1).max(50)).max(20).optional(),
    })
}
