import { prismaClient } from "../application/database";
import { UserResponse, RegisterUserRequest, toUserResponse, LoginUserRequest, UpdateUserRequest } from "../models/user";
import { UserValidation } from "../validations/userValidation";
import { HTTPException } from "hono/http-exception";
import { User } from "@prisma/client";

export class UserService {

    static async register(request: RegisterUserRequest): Promise<UserResponse> {
        request = UserValidation.REGISTER.parse(request)


        const totalUserWithSameUser = await prismaClient.user.count({
            where: {
                username: request.username
            }
        })

        // cek user sudah ada belum
        if (totalUserWithSameUser) {
            throw new HTTPException(400, {
                message: "Username already exist"
            })
        }

        // hashing pw bcrypt
        request.password = await Bun.password.hash(request.password, {
            algorithm: "bcrypt",
            cost: 10
        })


        // save ke db
        const user = await prismaClient.user.create({
            data: request
        })


        // return response
        return toUserResponse(user)
    }

    static async login(request: LoginUserRequest): Promise<UserResponse> {
        //validation
        request = UserValidation.LOGIN.parse(request)

        //cek ke db
        let user = await prismaClient.user.findUnique({
            where: {
                username: request.username
            }
        })

        if (!user) {
            throw new HTTPException(401, {
                message: "Username or password is wrong"
            })
        }

        const validPassword = await Bun.password.verify(request.password, user.password, "bcrypt")
        if (!validPassword) {
            throw new HTTPException(401, {
                message: "username or password is wrong"
            })
        }

        user = await prismaClient.user.update({
            where: {
                username: request.username
            },
            data: {
                token: crypto.randomUUID()
            }
        })

        const response = toUserResponse(user)
        response.token = user.token!
        return response

    }

    static async get(token: string | undefined | null): Promise<User> {
        const result = UserValidation.TOKEN.safeParse(token)

        if (result.error) {
            throw new HTTPException(401, {
                message: "Unauthorized"
            })
        }

        token = result.data

        const user = await prismaClient.user.findFirst({
            where: {
                token: token
            }
        })

        if (!user) {
            throw new HTTPException(401, {
                message: "unauthorized"
            })
        }

        return user
    }

    static async update(user: User, request: UpdateUserRequest): Promise<UserResponse> {
        request = UserValidation.UPDATE.parse(request)

        if (request.name) {
            user.name = request.name
        }

        if (request.password) {
            user.password = await Bun.password.hash(request.password, {
                algorithm: "bcrypt",
                cost: 10
            })
        }

        await prismaClient.user.update({
            where: {
                username: user.username
            },
            data: user
        })

        return toUserResponse(user)

    }

    static async logout(user: User): Promise<boolean> {
        await prismaClient.user.update({
            where: {
                username: user.username
            },
            data: {
                token: null
            }
        })

        return true
    }
}