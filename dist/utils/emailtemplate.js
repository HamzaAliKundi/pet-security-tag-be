"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordTemplate = exports.verificationEmailTemplate = void 0;
const handlebars_1 = require("handlebars");
exports.verificationEmailTemplate = (0, handlebars_1.compile)(`
<!DOCTYPE html>
<html>
<head>
    <style>
        .container { padding: 20px; font-family: Arial, sans-serif; }
        .button { 
            background-color: #4CAF50; 
            color: white; 
            padding: 10px 20px; 
            text-decoration: none; 
            border-radius: 5px; 
            display: inline-block; 
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>Verify Your Email</h2>
        <p>Hello {{name}},</p>
        <p>Please click the button below to verify your email address:</p>
        <a href="{{verificationUrl}}" class="button">Verify Email</a>
        <p>If you didn't create an account, you can safely ignore this email.</p>
        <p>This link will expire in 24 hours.</p>
    </div>
</body>
</html>
`);
exports.resetPasswordTemplate = (0, handlebars_1.compile)(`
<!DOCTYPE html>
<html>
<head>
    <style>
        .container { padding: 20px; font-family: Arial, sans-serif; }
        .button { 
            background-color: #4CAF50; 
            color: white; 
            padding: 10px 20px; 
            text-decoration: none; 
            border-radius: 5px; 
            display: inline-block; 
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>Reset Your Password</h2>
        <p>Hello {{name}},</p>
        <p>We received a request to reset your password. Click the button below to reset it:</p>
        <a href="{{resetUrl}}" class="button">Reset Password</a>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
    </div>
</body>
</html>
`);
