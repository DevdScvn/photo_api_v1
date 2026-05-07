import { Hono } from "hono"
import { HTTPException } from "hono/http-exception"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { User } from "@prisma/client"
import { AppicationVariable } from "../models/app"
import { authMiddleware } from "../middleware/authMiddleware"
import { s3 } from "../application/minioClient"

const BUCKET    = process.env.MINIO_BUCKET!
const ENDPOINT  = process.env.MINIO_ENDPOINT!

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])
const MAX_BYTES    = 20 * 1024 * 1024  // 20 MB

export const uploadController = new Hono<{ Variables: AppicationVariable }>()

uploadController.post('/api/upload', authMiddleware, async (c) => {
    c.get('user') as User  // гарантируем аутентификацию

    const formData = await c.req.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
        throw new HTTPException(400, { message: "Field 'file' is required" })
    }

    if (!ALLOWED_MIME.has(file.type)) {
        throw new HTTPException(415, { message: `Unsupported media type: ${file.type}` })
    }

    const buffer = await file.arrayBuffer()

    if (buffer.byteLength > MAX_BYTES) {
        throw new HTTPException(413, { message: "File exceeds 20 MB limit" })
    }

    const ext = file.type.split('/')[1].replace('jpeg', 'jpg')
    const key = `photos/${crypto.randomUUID()}.${ext}`

    await s3.send(new PutObjectCommand({
        Bucket:      BUCKET,
        Key:         key,
        Body:        Buffer.from(buffer),
        ContentType: file.type,
    }))

    const url = `${ENDPOINT}/${BUCKET}/${key}`

    return c.json({ data: { url, key } }, 201)
})
