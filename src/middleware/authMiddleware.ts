import { MiddlewareHandler } from "hono";
import { UserService } from "../services/userService";

export const authMiddleware: MiddlewareHandler = async (c, next) => {
    const raw = c.req.header('Authorization')
    const token = raw?.startsWith('Bearer ') ? raw.slice(7) : raw
    const user = await UserService.get(token)

    c.set('user', user)

    await next()
}