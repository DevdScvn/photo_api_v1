import { Hono } from "hono";
import { LoginUserRequest, RegisterUserRequest, toUserResponse, UpdateUserRequest } from "../models/user";
import { UserService } from "../services/userService";
import { User } from "@prisma/client";
import { AppicationVariable } from "../models/app";
import { authMiddleware } from "../middleware/authMiddleware";

export const userController = new Hono<{ Variables: AppicationVariable }>();

userController.post('/api/users', async (c) => {
    const request = await c.req.json() as RegisterUserRequest

    // kirim ke service
    const response = await UserService.register(request)

    // return service
    return c.json({
        data: response
    })
})

userController.post('/api/users/login', async (c) => {
    const request = await c.req.json() as LoginUserRequest
    // kirim ke service
    const response = await UserService.login(request)

    // return service
    return c.json({
        data: response
    })
})


userController.get('/api/users/current', authMiddleware, async (c) => {
    const user = c.get('user') as User

    return c.json({
        data: toUserResponse(user)
    })
})

userController.patch('/api/users/current', authMiddleware, async (c) => {
    const user = c.get('user') as User
    const request = await c.req.json() as UpdateUserRequest

    const response = await UserService.update(user, request)

    return c.json({
        data: response
    })

})

userController.delete('/api/users/current', authMiddleware, async (c) => {
    const user = c.get('user') as User

    const response = await UserService.logout(user)

    return c.json({
        data: response
    })

})


