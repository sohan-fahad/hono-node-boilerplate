import { z } from "zod";


export const RegisterSchema = z.object({
    name: z.string()
        .min(1, "Name is required")
        .max(100, "Name must be at most 100 characters"),

    email: z.email("Invalid email format")
        .min(1, "Email is required"),

    phoneNumber: z.string()
        .min(10, "Phone number must be at least 10 digits")
        .max(15, "Phone number must be at most 15 digits")
        .regex(/^\+?[\d\s\-\(\)]+$/, "Invalid phone number format"),

    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .max(100, "Password must be at most 100 characters"),
    // .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),

    organization: z.object({
        name: z.string()
            .min(1, "Organization name is required")
            .max(200, "Organization name must be at most 200 characters"),

        description: z.string().optional(),
    }),
});

export const LoginSchema = z.object({
    email: z.email("Invalid email format"),
    password: z.string()
        .min(1, "Password is required"),
})

export const VerifyOtpSchema = z.object({
    email: z.email("Invalid email format"),
    otp: z.string().min(1, "OTP is required"),
    hash: z.string().min(1, "Hash is required"),
});

export const SendOtpSchema = z.object({
    email: z.email("Invalid email format"),
});



// Password reset request schema
export const ForgotPasswordSchema = z.object({
    email: z.email("Invalid email format"),
});

// Reset password schema
export const ResetPasswordSchema = z.object({
    token: z.string().min(1, "Reset token is required"),
    password: z.string()
        .min(8, "Password must be at least 8 characters")
});

// Change password schema
export const ChangePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string()
        .min(8, "Password must be at least 8 characters")
        .max(100, "Password must be at most 100 characters")
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
});


// Refresh token schema
export const RefreshTokenSchema = z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
});

// Export types
export type RegisterDto = z.infer<typeof RegisterSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;
export type ForgotPasswordDto = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordDto = z.infer<typeof ResetPasswordSchema>;
export type ChangePasswordDto = z.infer<typeof ChangePasswordSchema>;
export type RefreshTokenDto = z.infer<typeof RefreshTokenSchema>;
export type VerifyOtpDto = z.infer<typeof VerifyOtpSchema>;
export type SendOtpDto = z.infer<typeof SendOtpSchema>;
