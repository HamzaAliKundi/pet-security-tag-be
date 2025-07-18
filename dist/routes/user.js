"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const order_1 = require("../controllers/user/order");
const contact_1 = require("../controllers/user/contact");
const router = (0, express_1.Router)();
// Pet tag order endpoints
router.post('/orders', order_1.createOrder);
// Contact form endpoints
router.post('/contact', contact_1.submitContact);
router.get('/contact', contact_1.getAllContacts);
router.get('/contact/:contactId', contact_1.getContact);
router.put('/contact/:contactId/status', contact_1.updateContactStatus);
exports.default = router;
