import { ZodType, z } from "zod";
import { RegisterUserRequest, LoginUserRequest, UpdateUserRequest } from "../models/user";

export class UserValidation {
    static readonly REGISTER: ZodType<RegisterUserRequest> = z.object({
        username: z.string().min(1).max(100),
        password: z.string().min(1).max(100),
        name: z.string().min(1).max(100),
    })

    static readonly LOGIN: ZodType<LoginUserRequest> = z.object({
        username: z.string().min(1).max(100),
        password: z.string().min(1).max(100),
    })

    static readonly UPDATE: ZodType<UpdateUserRequest> = z.object({
        password: z.string().min(1).max(100).optional(),
        name: z.string().min(1).max(100).optional(),
    })
    static readonly TOKEN: ZodType<string> = z.string().min(1)
}