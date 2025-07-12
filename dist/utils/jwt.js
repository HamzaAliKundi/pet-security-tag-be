"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.generateForgotPasswordToken = exports.generateVerificationToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const chalk_1 = __importDefault(require("chalk"));
if (!env_1.env.JWT_SECRET) {
    console.error(chalk_1.default.red('JWT_SECRET is not defined in environment variables'));
    process.exit(1);
}
const generateToken = (user) => {
    const payload = { _id: user._id, role: user.role };
    const options = {
        expiresIn: '30d'
    };
    return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_SECRET, options);
};
exports.generateToken = generateToken;
const generateVerificationToken = (user) => {
    const payload = { _id: user._id };
    const options = {
        expiresIn: '1h'
    };
    return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_SECRET, options);
};
exports.generateVerificationToken = generateVerificationToken;
const generateForgotPasswordToken = (user) => {
    const payload = { _id: user._id };
    const options = {
        expiresIn: '1h'
    };
    return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_SECRET, options);
};
exports.generateForgotPasswordToken = generateForgotPasswordToken;
const verifyToken = (token) => {
    var _a;
    return (_a = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET)) !== null && _a !== void 0 ? _a : { _id: '' };
};
exports.verifyToken = verifyToken;
