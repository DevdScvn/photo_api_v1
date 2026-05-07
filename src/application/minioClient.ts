import { S3Client, PutObjectCommand, DeleteObjectCommand, CreateBucketCommand, HeadBucketCommand, PutBucketPolicyCommand } from '@aws-sdk/client-s3'

export const s3 = new S3Client({
    endpoint: process.env.MINIO_ENDPOINT,
    region: 'us-east-1',
    credentials: {
        accessKeyId:     process.env.MINIO_ACCESS_KEY!,
        secretAccessKey: process.env.MINIO_SECRET_KEY!,
    },
    forcePathStyle: true,
})

export async function ensureBucket(): Promise<void> {
    const bucket = process.env.MINIO_BUCKET!

    try {
        await s3.send(new HeadBucketCommand({ Bucket: bucket }))
    } catch {
        await s3.send(new CreateBucketCommand({ Bucket: bucket }))
    }

    // Разрешаем публичное чтение объектов, чтобы <img src="..."> работал в браузере
    await s3.send(new PutBucketPolicyCommand({
        Bucket: bucket,
        Policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [{
                Effect:    'Allow',
                Principal: { AWS: ['*'] },
                Action:    ['s3:GetObject'],
                Resource:  [`arn:aws:s3:::${bucket}/*`],
            }],
        }),
    }))
}