"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const overview_1 = require("../controllers/admin/overview");
const recentActivity_1 = require("../controllers/admin/recentActivity");
const router = (0, express_1.Router)();
// All admin routes require authentication
router.use(auth_1.authMiddleware);
// Admin overview endpoint
router.get('/overview', overview_1.getOverview);
// Admin recent activity endpoint
router.get('/recent-activity', recentActivity_1.getRecentActivity);
exports.default = router;
