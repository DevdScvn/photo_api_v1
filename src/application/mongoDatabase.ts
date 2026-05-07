import mongoose from 'mongoose'

export async function connectMongo(): Promise<void> {
    await mongoose.connect(process.env.MONGODB_URL!)
}

export interface IPostImage {
    url: string
    key: string
    mimeType?: string
}

export interface IPostExif {
    camera?: string
    lens?: string
    iso?: number
    aperture?: string
    shutter?: string
    takenAt?: Date
    location?: { lat: number; lng: number }
}

export interface IPost {
    title: string
    description?: string
    authorId: string
    images: IPostImage[]
    exif?: IPostExif
    tags: string[]
    likesCount: number
    createdAt: Date
    updatedAt: Date
}

const postSchema = new mongoose.Schema<IPost>({
    title:       { type: String, required: true, maxlength: 200 },
    description: { type: String },
    authorId:    { type: String, required: true },  // username из PostgreSQL
    images: [{
        url:      String,   // URL в MinIO
        key:      String,   // ключ объекта в MinIO (для удаления)
        mimeType: String,
    }],
    exif: {
        camera:    String,
        lens:      String,
        iso:       Number,
        aperture:  String,
        shutter:   String,
        takenAt:   Date,
        location:  { lat: Number, lng: Number },
    },
    tags:       [String],
    likesCount: { type: Number, default: 0 },
}, { timestamps: true })

postSchema.index({ createdAt: -1 })   // сортировка ленты
postSchema.index({ tags: 1 })         // фильтр по тегу
postSchema.index({ authorId: 1 })     // посты автора

export const PostModel = mongoose.model<IPost>('Post', postSchema)