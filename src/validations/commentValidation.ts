import { ZodType, z } from "zod";
import { CreateCommentRequest } from "../models/comment";

export class CommentValidation {
    static readonly CREATE: ZodType<CreateCommentRequest> = z.object({
        text: z.string().min(1).max(1000),
    })
}
