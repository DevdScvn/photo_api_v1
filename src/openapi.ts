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
            PostImage: {
                type: "object",
                required: ["url", "key"],
                properties: {
                    url:      { type: "string", format: "uri", example: "http://localhost:9000/photos/abc.jpg" },
                    key:      { type: "string", example: "photos/abc.jpg" },
                    mimeType: { type: "string", example: "image/jpeg" },
                },
            },
            PostExif: {
                type: "object",
                properties: {
                    camera:   { type: "string", example: "Sony A7 IV" },
                    lens:     { type: "string", example: "FE 85mm f/1.4" },
                    iso:      { type: "integer", example: 400 },
                    aperture: { type: "string", example: "f/1.8" },
                    shutter:  { type: "string", example: "1/500" },
                    takenAt:  { type: "string", format: "date-time" },
                    location: {
                        type: "object",
                        properties: {
                            lat: { type: "number", example: 55.7558 },
                            lng: { type: "number", example: 37.6173 },
                        },
                    },
                },
            },
            CreatePostRequest: {
                type: "object",
                required: ["title", "images"],
                properties: {
                    title:       { type: "string", maxLength: 200, example: "Golden hour in the mountains" },
                    description: { type: "string", example: "Shot during a hike near Elbrus." },
                    images: {
                        type: "array",
                        minItems: 1,
                        items: { $ref: "#/components/schemas/PostImage" },
                    },
                    exif: { $ref: "#/components/schemas/PostExif" },
                    tags: {
                        type: "array",
                        items: { type: "string" },
                        example: ["landscape", "mountains"],
                    },
                },
            },
            UpdatePostRequest: {
                type: "object",
                properties: {
                    title:       { type: "string", maxLength: 200 },
                    description: { type: "string" },
                    tags: {
                        type: "array",
                        items: { type: "string" },
                    },
                },
            },
            PostResponse: {
                type: "object",
                properties: {
                    id:          { type: "string", example: "664f1a2b3c4d5e6f7a8b9c0d" },
                    title:       { type: "string" },
                    description: { type: "string" },
                    authorId:    { type: "string", example: "john_doe" },
                    images: {
                        type: "array",
                        items: { $ref: "#/components/schemas/PostImage" },
                    },
                    exif:       { $ref: "#/components/schemas/PostExif" },
                    tags:       { type: "array", items: { type: "string" } },
                    likesCount: { type: "integer", example: 42 },
                    createdAt:  { type: "string", format: "date-time" },
                    updatedAt:  { type: "string", format: "date-time" },
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
        "/api/posts": {
            get: {
                tags: ["Posts"],
                summary: "List posts (feed)",
                parameters: [
                    {
                        name: "tag",
                        in: "query",
                        required: false,
                        schema: { type: "string" },
                        description: "Filter by tag",
                    },
                    {
                        name: "page",
                        in: "query",
                        required: false,
                        schema: { type: "integer", default: 1 },
                    },
                ],
                responses: {
                    "200": {
                        description: "List of posts",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        data: {
                                            type: "array",
                                            items: { $ref: "#/components/schemas/PostResponse" },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            post: {
                tags: ["Posts"],
                summary: "Create a post",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/CreatePostRequest" },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "Post created",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        data: { $ref: "#/components/schemas/PostResponse" },
                                    },
                                },
                            },
                        },
                    },
                    "400": { description: "Validation error" },
                    "401": { description: "Unauthorized" },
                },
            },
        },
        "/api/posts/{id}": {
            get: {
                tags: ["Posts"],
                summary: "Get post by ID",
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                        description: "MongoDB ObjectId of the post",
                    },
                ],
                responses: {
                    "200": {
                        description: "Post found",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        data: { $ref: "#/components/schemas/PostResponse" },
                                    },
                                },
                            },
                        },
                    },
                    "404": { description: "Post not found" },
                },
            },
            patch: {
                tags: ["Posts"],
                summary: "Update a post",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/UpdatePostRequest" },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "Post updated",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        data: { $ref: "#/components/schemas/PostResponse" },
                                    },
                                },
                            },
                        },
                    },
                    "401": { description: "Unauthorized" },
                    "403": { description: "Forbidden — not the author" },
                    "404": { description: "Post not found" },
                },
            },
            delete: {
                tags: ["Posts"],
                summary: "Delete a post",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: {
                    "200": {
                        description: "Post deleted",
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
                    "404": { description: "Post not found" },
                },
            },
        },
        "/api/upload": {
            post: {
                tags: ["Upload"],
                summary: "Upload a photo to MinIO",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "multipart/form-data": {
                            schema: {
                                type: "object",
                                required: ["file"],
                                properties: {
                                    file: {
                                        type: "string",
                                        format: "binary",
                                        description: "JPEG, PNG, WebP or GIF, max 20 MB",
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "File uploaded — use url and key in POST /api/posts",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        data: {
                                            type: "object",
                                            properties: {
                                                url: { type: "string", format: "uri", example: "http://localhost:9000/photos/abc.jpg" },
                                                key: { type: "string", example: "photos/550e8400-e29b-41d4-a716-446655440000.jpg" },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    "400": { description: "Missing file field" },
                    "401": { description: "Unauthorized" },
                    "413": { description: "File exceeds 20 MB limit" },
                    "415": { description: "Unsupported media type" },
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
