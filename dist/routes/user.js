"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const order_1 = require("../controllers/user/order");
const contact_1 = require("../controllers/user/contact");
const auth_1 = require("../middleware/auth");
const account_1 = require("../controllers/user/account");
const router = (0, express_1.Router)();
// Pet tag order endpoints (public)
router.post('/orders', order_1.createOrder);
// Contact form endpoints (public)
router.post('/contact', contact_1.submitContact);
router.get('/contact', contact_1.getAllContacts);
router.get('/contact/:contactId', contact_1.getContact);
router.put('/contact/:contactId/status', contact_1.updateContactStatus);
// User dashbaord (Private)
router.get("/get-single-user", auth_1.authMiddleware, account_1.getSingleUser);
router.patch("/update-single-user", auth_1.authMiddleware, account_1.updateSingleUser);
exports.default = router;
