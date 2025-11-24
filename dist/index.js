"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const routes_1 = __importDefault(require("./routes"));
const errorHandler_1 = require("./middleware/errorHandler");
const config_1 = __importDefault(require("./config"));
const env_1 = require("./config/env");
(0, config_1.default)();
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:5173', // Main frontend
        'http://localhost:5174', // User dashboard
        'http://localhost:5175', // Admin panel (if different port)
        'https://admin.digitaltails.com',
        'https://user.digitaltails.com',
        'https://digitaltails.com'
    ],
    credentials: true
}));
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)('dev'));
// Stripe webhook needs raw body for signature verification
// This must be BEFORE express.json() middleware
app.use('/api/v1/stripe/webhook', express_1.default.raw({ type: 'application/json' }));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.get('/ping', (req, res) => res.json({ message: 'server is running...' }));
app.use('/api/v1', routes_1.default);
app.use(errorHandler_1.errorHandler);
app.listen(env_1.env.PORT, () => console.log(`Server is running on port ${env_1.env.PORT}`));
