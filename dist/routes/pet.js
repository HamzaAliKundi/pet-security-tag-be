"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const pet_1 = require("../controllers/user/pet");
const router = (0, express_1.Router)();
// All pet routes require authentication
router.use(auth_1.authMiddleware);
// Pet management endpoints
router.post('/', pet_1.createPet);
router.get('/', pet_1.getUserPets);
router.get('/:petId', pet_1.getPet);
router.put('/:petId', pet_1.updatePet);
exports.default = router;
