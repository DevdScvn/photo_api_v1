export const openApiSpec = {
    openapi: "3.0.0",
    info: {
        title: "User API",
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
    },
}
