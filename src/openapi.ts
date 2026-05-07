export const openApiSpec = {
    openapi: "3.0.0",
    info: {
        title: "Photo API",
        version: "1.0.0",
    },
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
            },
        },
        schemas: {
            RegisterRequest: {
                type: "object",
                required: ["username", "password", "name"],
                properties: {
                    username: { type: "string", example: "john_doe" },
                    password: { type: "string", example: "secret123" },
                    name: { type: "string", example: "John Doe" },
                },
            },
            LoginRequest: {
                type: "object",
                required: ["username", "password"],
                properties: {
                    username: { type: "string", example: "john_doe" },
                    password: { type: "string", example: "secret123" },
                },
            },
            UpdateRequest: {
                type: "object",
                properties: {
                    password: { type: "string", example: "newpassword" },
                    name: { type: "string", example: "John Updated" },
                },
            },
            UserResponse: {
                type: "object",
                properties: {
                    username: { type: "string" },
                    name: { type: "string" },
                    token: { type: "string" },
                },
            },
            CreateCommentRequest: {
                type: "object",
                required: ["text"],
                properties: {
                    text: { type: "string", maxLength: 1000, example: "Great shot!" },
                },
            },
            CommentResponse: {
                type: "object",
                properties: {
                    id: { type: "integer" },
                    text: { type: "string" },
                    postMongoId: { type: "string" },
                    authorId: { type: "string" },
                    createdAt: { type: "string", format: "date-time" },
                },
            },
            ToggleLikeResponse: {
                type: "object",
                properties: {
                    liked: { type: "boolean" },
                },
            },
        },
    },
    paths: {
        "/api/users": {
            post: {
                tags: ["Users"],
                summary: "Register a new user",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/RegisterRequest" },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "User registered",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        data: { $ref: "#/components/schemas/UserResponse" },
                                    },
                                },
                            },
                        },
                    },
                    "400": { description: "Username already exists" },
                },
            },
        },
        "/api/users/login": {
            post: {
                tags: ["Users"],
                summary: "Login",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/LoginRequest" },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "Login successful, returns token",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        data: { $ref: "#/components/schemas/UserResponse" },
                                    },
                                },
                            },
                        },
                    },
                    "401": { description: "Invalid credentials" },
                },
            },
        },
        "/api/users/current": {
            get: {
                tags: ["Users"],
                summary: "Get current user",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "Current user",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        data: { $ref: "#/components/schemas/UserResponse" },
                                    },
                                },
                            },
                        },
                    },
                    "401": { description: "Unauthorized" },
                },
            },
            patch: {
                tags: ["Users"],
                summary: "Update current user",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/UpdateRequest" },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "User updated",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        data: { $ref: "#/components/schemas/UserResponse" },
                                    },
                                },
                            },
                        },
                    },
                    "401": { description: "Unauthorized" },
                },
            },
            delete: {
                tags: ["Users"],
                summary: "Logout",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "Logged out",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: { data: { type: "boolean" } },
                                },
                            },
                        },
                    },
                    "401": { description: "Unauthorized" },
                },
            },
        },
        "/api/posts/{postId}/comments": {
            post: {
                tags: ["Comments"],
                summary: "Add a comment to a post",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "postId",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                        description: "MongoDB ObjectId of the post",
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/CreateCommentRequest" },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "Comment created",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        data: { $ref: "#/components/schemas/CommentResponse" },
                                    },
                                },
                            },
                        },
                    },
                    "401": { description: "Unauthorized" },
                    "404": { description: "Post not found" },
                },
            },
            get: {
                tags: ["Comments"],
                summary: "List comments for a post",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "postId",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                        description: "MongoDB ObjectId of the post",
                    },
                ],
                responses: {
                    "200": {
                        description: "List of comments",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        data: {
                                            type: "array",
                                            items: { $ref: "#/components/schemas/CommentResponse" },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    "401": { description: "Unauthorized" },
                    "404": { description: "Post not found" },
                },
            },
        },
        "/api/comments/{commentId}": {
            delete: {
                tags: ["Comments"],
                summary: "Delete a comment",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "commentId",
                        in: "path",
                        required: true,
                        schema: { type: "integer" },
                    },
                ],
                responses: {
                    "200": {
                        description: "Comment deleted",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: { data: { type: "boolean" } },
                                },
                            },
                        },
                    },
                    "401": { description: "Unauthorized" },
                    "403": { description: "Forbidden — not the author" },
                    "404": { description: "Comment not found" },
                },
            },
        },
        "/api/posts/{postId}/likes": {
            post: {
                tags: ["Likes"],
                summary: "Toggle like on a post",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "postId",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                        description: "MongoDB ObjectId of the post",
                    },
                ],
                responses: {
                    "200": {
                        description: "Like toggled",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        data: { $ref: "#/components/schemas/ToggleLikeResponse" },
                                    },
                                },
                            },
                        },
                    },
                    "401": { description: "Unauthorized" },
                    "404": { description: "Post not found" },
                },
            },
        },
    },
}
