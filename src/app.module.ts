import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";

import { swaggerUI } from '@hono/swagger-ui';
import { Module, createModule } from "./wilt/index.js";
import { authMiddleware, requestLogger } from "./wilt/middleware/index.js";
import { environmentMiddleware } from "./wilt/middleware/environment.middleware.js";
import { openApiDoc } from "./openapi/openapi.js";
import { AuthController } from "./modules/app/auth/auth.controller.js";
import { AuthService } from "./modules/app/auth/auth.service.js";
import { BcryptService } from "./modules/shared/helpers/brycpt.service.js";
import { JwtService } from "./modules/shared/helpers/jwt.service.js";
import { ENV } from "./env.js";
import { env } from "hono/adapter";


@Module({
    controllers: [
        AuthController,
    ],

    providers: [
        AuthService,
        BcryptService,
        JwtService,
    ],
})
export class AppModule { }

const app = createModule(AppModule, {
    middlewares: [cors(), secureHeaders(), requestLogger, environmentMiddleware, authMiddleware],
});


app.get("/health", (c) => c.json({
    message: "Success",
    data: ENV
}))
app.get('/example', (c) => {
    // Access environment variables with Context
    const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c)
    return c.text(DATABASE_URL)
})
app.get("/doc", (c) => c.json(openApiDoc));
app.get('/doc-ui', swaggerUI({ url: '/doc' }))



export { app };
