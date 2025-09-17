"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const order_1 = require("../controllers/user/order");
const userPetTagOrder_1 = require("../controllers/user/userPetTagOrder");
const contact_1 = require("../controllers/user/contact");
const auth_1 = require("../middleware/auth");
const account_1 = require("../controllers/user/account");
const pet_1 = require("../controllers/user/pet");
const subscription_1 = require("../controllers/user/subscription");
const imageUploadService_1 = require("../utils/imageUploadService");
const router = (0, express_1.Router)();
// Pet tag order endpoints (public)
router.post('/orders', order_1.createOrder);
// Contact form endpoints (public)
router.post('/contact', contact_1.submitContact);
router.get('/contact', contact_1.getAllContacts);
router.get('/contact/:contactId', contact_1.getContact);
router.put('/contact/:contactId/status', contact_1.updateContactStatus);
// User dashboard (Private)
router.get("/get-single-user", auth_1.authMiddleware, account_1.getSingleUser);
router.patch("/update-single-user", auth_1.authMiddleware, account_1.updateSingleUser);
// Authenticated user pet tag order endpoints (Private)
router.post('/user-pet-tag-orders', auth_1.authMiddleware, userPetTagOrder_1.createUserPetTagOrder);
router.get('/user-pet-tag-orders', auth_1.authMiddleware, userPetTagOrder_1.getUserPetTagOrders);
router.get('/user-pet-tag-orders/:orderId', auth_1.authMiddleware, userPetTagOrder_1.getUserPetTagOrder);
router.put('/user-pet-tag-orders/:orderId', auth_1.authMiddleware, userPetTagOrder_1.updateUserPetTagOrder);
router.post('/user-pet-tag-orders/:orderId/confirm-payment', auth_1.authMiddleware, userPetTagOrder_1.confirmPayment);
// Pet management endpoints (Private)
router.post('/pets', auth_1.authMiddleware, pet_1.createPet);
router.get('/pets', auth_1.authMiddleware, pet_1.getUserPets);
router.get('/pets/:petId', auth_1.authMiddleware, pet_1.getPet);
router.put('/pets/:petId', auth_1.authMiddleware, pet_1.updatePet);
router.post('/pets/:petId/upload-image', auth_1.authMiddleware, imageUploadService_1.upload.single('image'), pet_1.uploadPetImage);
// Subscription endpoints (Private)
router.get('/subscriptions', auth_1.authMiddleware, subscription_1.getUserSubscriptions);
router.get('/subscriptions/stats', auth_1.authMiddleware, subscription_1.getSubscriptionStats);
exports.default = router;
