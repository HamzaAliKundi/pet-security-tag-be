"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrderStats = exports.updateOrderStatus = exports.getOrderById = exports.getOrders = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const UserPetTagOrder_1 = __importDefault(require("../../models/UserPetTagOrder"));
const PetTagOrder_1 = __importDefault(require("../../models/PetTagOrder")); // Added import for PetTagOrder
const emailService_1 = require("../../utils/emailService");
// Get all orders with search, filtering, and pagination
exports.getOrders = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', status = 'all', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        // Build search query
        let searchQuery = {};
        if (search) {
            searchQuery.$or = [
                { petName: { $regex: search, $options: 'i' } },
                { paymentIntentId: { $regex: search, $options: 'i' } }
            ];
        }
        // Build status filter
        if (status && status !== 'all') {
            searchQuery.status = status;
        }
        // Build sort object
        const sortObj = {};
        sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;
        // Execute queries for both models with pagination
        const [userOrders, petOrders] = await Promise.all([
            UserPetTagOrder_1.default.find(searchQuery)
                .populate('userId', 'firstName lastName email')
                .sort(sortObj)
                .lean(),
            PetTagOrder_1.default.find(searchQuery)
                .sort(sortObj)
                .lean()
        ]);
        // Combine and sort all orders
        let allOrders = [...userOrders, ...petOrders];
        // Sort combined orders
        allOrders.sort((a, b) => {
            const aValue = a[sortBy];
            const bValue = b[sortBy];
            if (sortOrder === 'desc') {
                return new Date(bValue).getTime() - new Date(aValue).getTime();
            }
            else {
                return new Date(aValue).getTime() - new Date(bValue).getTime();
            }
        });
        // Get total count for pagination
        const totalOrders = allOrders.length;
        // Check if requested page is valid
        const totalPages = Math.ceil(totalOrders / limitNum);
        // Handle case when there are no orders
        if (totalOrders === 0) {
            res.status(200).json({
                message: 'No orders found',
                status: 200,
                orders: [],
                pagination: {
                    currentPage: 1,
                    totalPages: 0,
                    totalOrders: 0,
                    ordersPerPage: limitNum,
                    hasNextPage: false,
                    hasPrevPage: false
                }
            });
            return;
        }
        // Check if requested page is valid
        if (pageNum > totalPages) {
            res.status(400).json({
                message: 'Invalid page number',
                error: `Page ${pageNum} does not exist. Total pages: ${totalPages}`,
                status: 400
            });
            return;
        }
        // Apply pagination to combined results
        const paginatedOrders = allOrders.slice(skip, skip + limitNum);
        // Transform orders data to match frontend requirements
        const transformedOrders = paginatedOrders.map((order) => {
            var _a, _b, _c, _d, _e;
            // Check if it's a UserPetTagOrder (has userId) or PetTagOrder (has email/name)
            if (order.userId) {
                // UserPetTagOrder
                const user = order.userId;
                return {
                    id: order._id,
                    orderId: order.paymentIntentId || `ORD-${order._id.toString().slice(-6).toUpperCase()}`,
                    customer: user ? `${user.firstName} ${user.lastName}` : 'Unknown Customer',
                    email: user ? user.email : 'No Email',
                    items: order.quantity || 1,
                    total: `€${(order.totalCostEuro || 0).toFixed(2)}`,
                    status: order.status || 'pending',
                    date: new Date(order.createdAt).toISOString().split('T')[0],
                    tracking: order.paymentIntentId || 'N/A',
                    petName: order.petName || 'Unknown Pet',
                    tagColor: order.tagColor || (order.tagColors && order.tagColors.length > 0 ? order.tagColors[0] : 'Unknown'),
                    tagColors: order.tagColors || (order.tagColor ? [order.tagColor] : []),
                    phone: order.phone || 'No Phone',
                    street: order.street || '',
                    city: order.city || '',
                    state: order.state || '',
                    zipCode: order.zipCode || '',
                    country: order.country || '',
                    paymentStatus: order.paymentStatus || 'pending',
                    orderType: 'UserPetTagOrder',
                    createdAt: order.createdAt,
                    updatedAt: order.updatedAt
                };
            }
            else {
                // PetTagOrder
                return {
                    id: order._id,
                    orderId: order.paymentIntentId || `ORD-${order._id.toString().slice(-6).toUpperCase()}`,
                    customer: order.name || 'No Name',
                    email: order.email || 'No Email',
                    items: order.quantity || 1,
                    total: `€${(order.totalCostEuro || 0).toFixed(2)}`,
                    status: order.status || 'pending',
                    date: new Date(order.createdAt).toISOString().split('T')[0],
                    tracking: order.paymentIntentId || 'N/A',
                    petName: order.petName || 'Unknown Pet',
                    tagColor: order.tagColor || (order.tagColors && order.tagColors.length > 0 ? order.tagColors[0] : 'Unknown'),
                    tagColors: order.tagColors || (order.tagColor ? [order.tagColor] : []),
                    phone: order.phone || 'No Phone',
                    street: ((_a = order.shippingAddress) === null || _a === void 0 ? void 0 : _a.street) || '',
                    city: ((_b = order.shippingAddress) === null || _b === void 0 ? void 0 : _b.city) || '',
                    state: ((_c = order.shippingAddress) === null || _c === void 0 ? void 0 : _c.state) || '',
                    zipCode: ((_d = order.shippingAddress) === null || _d === void 0 ? void 0 : _d.zipCode) || '',
                    country: ((_e = order.shippingAddress) === null || _e === void 0 ? void 0 : _e.country) || '',
                    paymentStatus: 'pending', // PetTagOrder doesn't have paymentStatus
                    orderType: 'PetTagOrder',
                    createdAt: order.createdAt,
                    updatedAt: order.updatedAt
                };
            }
        });
        res.status(200).json({
            message: 'Orders retrieved successfully',
            status: 200,
            orders: transformedOrders,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(totalOrders / limitNum),
                totalOrders,
                ordersPerPage: limitNum,
                hasNextPage: pageNum < Math.ceil(totalOrders / limitNum),
                hasPrevPage: pageNum > 1
            }
        });
    }
    catch (error) {
        console.error('Error getting orders:', error);
        console.error('Request query:', req.query);
        res.status(500).json({
            message: 'Failed to get orders',
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
});
// Get single order by ID
exports.getOrderById = (0, express_async_handler_1.default)(async (req, res) => {
    var _a, _b, _c, _d, _e, _f;
    try {
        const { orderId } = req.params;
        // Search in both models
        let order = await UserPetTagOrder_1.default.findById(orderId)
            .populate('userId', 'firstName lastName email')
            .lean();
        let orderType = 'UserPetTagOrder';
        if (!order) {
            // If not found in UserPetTagOrder, search in PetTagOrder
            order = await PetTagOrder_1.default.findById(orderId).lean();
            orderType = 'PetTagOrder';
        }
        if (!order) {
            res.status(404).json({
                message: 'Order not found',
                error: 'Order does not exist'
            });
            return;
        }
        let transformedOrder;
        if (orderType === 'UserPetTagOrder') {
            // UserPetTagOrder
            const user = order.userId;
            transformedOrder = {
                id: order._id,
                orderId: order.paymentIntentId || `ORD-${order._id.toString().slice(-6).toUpperCase()}`,
                customer: user ? `${user.firstName} ${user.lastName}` : 'Unknown Customer',
                email: user ? user.email : 'No Email',
                items: order.quantity,
                total: `€${(order.totalCostEuro || 0).toFixed(2)}`,
                status: order.status,
                date: new Date(order.createdAt).toISOString().split('T')[0],
                tracking: order.paymentIntentId || 'N/A',
                petName: order.petName,
                tagColor: order.tagColor || (order.tagColors && order.tagColors.length > 0 ? order.tagColors[0] : 'Unknown'),
                tagColors: order.tagColors || (order.tagColor ? [order.tagColor] : []),
                phone: order.phone,
                street: order.street,
                city: order.city,
                state: order.state,
                zipCode: order.zipCode,
                country: order.country,
                paymentStatus: order.paymentStatus,
                orderType: 'UserPetTagOrder',
                createdAt: order.createdAt,
                updatedAt: order.updatedAt
            };
        }
        else {
            // PetTagOrder
            const petOrder = order;
            transformedOrder = {
                id: petOrder._id,
                orderId: petOrder.paymentIntentId || `ORD-${petOrder._id.toString().slice(-6).toUpperCase()}`,
                customer: petOrder.name || 'No Name',
                email: petOrder.email || 'No Email',
                items: petOrder.quantity,
                total: `€${((_a = petOrder.totalCostEuro) === null || _a === void 0 ? void 0 : _a.toFixed(2)) || '0.00'}`,
                status: petOrder.status,
                date: new Date(petOrder.createdAt).toISOString().split('T')[0],
                tracking: petOrder.paymentIntentId || 'N/A',
                petName: petOrder.petName,
                tagColor: petOrder.tagColor || (petOrder.tagColors && petOrder.tagColors.length > 0 ? petOrder.tagColors[0] : 'Unknown'),
                tagColors: petOrder.tagColors || (petOrder.tagColor ? [petOrder.tagColor] : []),
                phone: petOrder.phone,
                street: ((_b = petOrder.shippingAddress) === null || _b === void 0 ? void 0 : _b.street) || '',
                city: ((_c = petOrder.shippingAddress) === null || _c === void 0 ? void 0 : _c.city) || '',
                state: ((_d = petOrder.shippingAddress) === null || _d === void 0 ? void 0 : _d.state) || '',
                zipCode: ((_e = petOrder.shippingAddress) === null || _e === void 0 ? void 0 : _e.zipCode) || '',
                country: ((_f = petOrder.shippingAddress) === null || _f === void 0 ? void 0 : _f.country) || '',
                paymentStatus: 'pending', // PetTagOrder doesn't have paymentStatus
                orderType: 'PetTagOrder',
                createdAt: petOrder.createdAt,
                updatedAt: petOrder.updatedAt
            };
        }
        res.status(200).json({
            message: 'Order retrieved successfully',
            status: 200,
            order: transformedOrder
        });
    }
    catch (error) {
        console.error('Error getting order:', error);
        res.status(500).json({
            message: 'Failed to get order',
            error: 'Internal server error'
        });
    }
});
// Update order status
exports.updateOrderStatus = (0, express_async_handler_1.default)(async (req, res) => {
    var _a, _b, _c, _d, _e;
    try {
        const { orderId } = req.params;
        const { status, trackingNumber, deliveryCompany } = req.body;
        if (!status || !['pending', 'paid', 'shipped', 'delivered', 'cancelled'].includes(status)) {
            res.status(400).json({
                message: 'Invalid status',
                error: 'Status must be one of: pending, paid, shipped, delivered, cancelled'
            });
            return;
        }
        // Check if order exists in UserPetTagOrder first
        let order = await UserPetTagOrder_1.default.findById(orderId);
        let orderType = 'UserPetTagOrder';
        // If not found, check PetTagOrder
        if (!order) {
            order = await PetTagOrder_1.default.findById(orderId);
            orderType = 'PetTagOrder';
        }
        if (!order) {
            res.status(404).json({
                message: 'Order not found',
                error: 'Order does not exist'
            });
            return;
        }
        // Prepare update data
        const updateData = { status };
        if (trackingNumber) {
            updateData.trackingNumber = trackingNumber.trim();
        }
        if (deliveryCompany) {
            updateData.deliveryCompany = deliveryCompany.trim();
        }
        // Update order status
        let updatedOrder;
        if (orderType === 'UserPetTagOrder') {
            updatedOrder = await UserPetTagOrder_1.default.findByIdAndUpdate(orderId, updateData, { new: true }).populate('userId', 'firstName lastName email');
        }
        else {
            updatedOrder = await PetTagOrder_1.default.findByIdAndUpdate(orderId, updateData, { new: true });
        }
        if (!updatedOrder) {
            res.status(500).json({
                message: 'Failed to update order',
                error: 'Order update failed'
            });
            return;
        }
        // Get customer info for email
        let customerName = 'Valued Customer';
        let customerEmail = '';
        if (orderType === 'UserPetTagOrder') {
            const user = updatedOrder.userId;
            customerName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Valued Customer' : 'Valued Customer';
            customerEmail = user ? user.email : '';
        }
        else {
            customerName = updatedOrder.name || 'Valued Customer';
            customerEmail = updatedOrder.email || '';
        }
        // Send email notifications (non-blocking)
        if (customerEmail && (status === 'shipped' || status === 'delivered' || status === 'cancelled')) {
            try {
                const orderNumber = updatedOrder.orderId || updatedOrder.paymentIntentId || `ORD-${updatedOrder._id.toString().slice(-6).toUpperCase()}`;
                if (status === 'shipped') {
                    await (0, emailService_1.sendOrderShippedEmail)(customerEmail, {
                        customerName,
                        orderNumber,
                        petName: updatedOrder.petName,
                        quantity: updatedOrder.quantity,
                        trackingNumber: updatedOrder.trackingNumber,
                        deliveryCompany: updatedOrder.deliveryCompany
                    });
                }
                else if (status === 'delivered') {
                    await (0, emailService_1.sendOrderDeliveredEmail)(customerEmail, {
                        customerName,
                        orderNumber,
                        petName: updatedOrder.petName,
                        quantity: updatedOrder.quantity
                    });
                }
                else if (status === 'cancelled') {
                    await (0, emailService_1.sendOrderCancelledEmail)(customerEmail, {
                        customerName,
                        orderNumber,
                        petName: updatedOrder.petName,
                        quantity: updatedOrder.quantity,
                        totalAmount: updatedOrder.totalCostEuro || 0
                    });
                }
            }
            catch (emailError) {
                console.error('Failed to send status update email:', emailError);
                // Don't fail the order update if email fails
            }
        }
        // Transform order for response
        let transformedOrder;
        if (orderType === 'UserPetTagOrder') {
            const user = updatedOrder.userId;
            transformedOrder = {
                id: updatedOrder._id,
                orderId: updatedOrder.orderId || updatedOrder.paymentIntentId || `ORD-${updatedOrder._id.toString().slice(-6).toUpperCase()}`,
                customer: user ? `${user.firstName} ${user.lastName}` : 'Unknown Customer',
                email: user ? user.email : 'No Email',
                items: updatedOrder.quantity,
                total: `€${(updatedOrder.totalCostEuro || 0).toFixed(2)}`,
                status: updatedOrder.status,
                date: new Date(updatedOrder.createdAt).toISOString().split('T')[0],
                tracking: updatedOrder.trackingNumber || updatedOrder.paymentIntentId || 'N/A',
                petName: updatedOrder.petName,
                tagColor: updatedOrder.tagColor || (updatedOrder.tagColors && updatedOrder.tagColors.length > 0 ? updatedOrder.tagColors[0] : 'Unknown'),
                tagColors: updatedOrder.tagColors || (updatedOrder.tagColor ? [updatedOrder.tagColor] : []),
                phone: updatedOrder.phone,
                street: updatedOrder.street,
                city: updatedOrder.city,
                state: updatedOrder.state,
                zipCode: updatedOrder.zipCode,
                country: updatedOrder.country,
                paymentStatus: updatedOrder.paymentStatus,
                trackingNumber: updatedOrder.trackingNumber,
                deliveryCompany: updatedOrder.deliveryCompany,
                createdAt: updatedOrder.createdAt,
                updatedAt: updatedOrder.updatedAt
            };
        }
        else {
            transformedOrder = {
                id: updatedOrder._id,
                orderId: updatedOrder.orderId || updatedOrder.paymentIntentId || `ORD-${updatedOrder._id.toString().slice(-6).toUpperCase()}`,
                customer: updatedOrder.name || 'Unknown Customer',
                email: updatedOrder.email || 'No Email',
                items: updatedOrder.quantity,
                total: `€${(updatedOrder.totalCostEuro || 0).toFixed(2)}`,
                status: updatedOrder.status,
                date: new Date(updatedOrder.createdAt).toISOString().split('T')[0],
                tracking: updatedOrder.trackingNumber || updatedOrder.paymentIntentId || 'N/A',
                petName: updatedOrder.petName,
                tagColor: updatedOrder.tagColor || (updatedOrder.tagColors && updatedOrder.tagColors.length > 0 ? updatedOrder.tagColors[0] : 'Unknown'),
                tagColors: updatedOrder.tagColors || (updatedOrder.tagColor ? [updatedOrder.tagColor] : []),
                phone: updatedOrder.phone,
                street: ((_a = updatedOrder.shippingAddress) === null || _a === void 0 ? void 0 : _a.street) || '',
                city: ((_b = updatedOrder.shippingAddress) === null || _b === void 0 ? void 0 : _b.city) || '',
                state: ((_c = updatedOrder.shippingAddress) === null || _c === void 0 ? void 0 : _c.state) || '',
                zipCode: ((_d = updatedOrder.shippingAddress) === null || _d === void 0 ? void 0 : _d.zipCode) || '',
                country: ((_e = updatedOrder.shippingAddress) === null || _e === void 0 ? void 0 : _e.country) || '',
                paymentStatus: updatedOrder.paymentStatus || 'pending',
                trackingNumber: updatedOrder.trackingNumber,
                deliveryCompany: updatedOrder.deliveryCompany,
                createdAt: updatedOrder.createdAt,
                updatedAt: updatedOrder.updatedAt
            };
        }
        res.status(200).json({
            message: 'Order status updated successfully',
            status: 200,
            order: transformedOrder
        });
    }
    catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({
            message: 'Failed to update order status',
            error: 'Internal server error'
        });
    }
});
// Get order statistics
exports.getOrderStats = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        // Get counts from both models
        const [userTotalOrders, petTotalOrders] = await Promise.all([
            UserPetTagOrder_1.default.countDocuments(),
            PetTagOrder_1.default.countDocuments()
        ]);
        const totalOrders = userTotalOrders + petTotalOrders;
        // Get status breakdown from both models
        const [userStatusStats, petStatusStats] = await Promise.all([
            UserPetTagOrder_1.default.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]),
            PetTagOrder_1.default.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ])
        ]);
        // Combine status stats
        const combinedStatusStats = [...userStatusStats, ...petStatusStats];
        const statusBreakdown = {};
        combinedStatusStats.forEach((stat) => {
            if (statusBreakdown[stat._id]) {
                statusBreakdown[stat._id] += stat.count;
            }
            else {
                statusBreakdown[stat._id] = stat.count;
            }
        });
        // Calculate total revenue from successful payments (UserPetTagOrder has paymentStatus)
        const userRevenueStats = await UserPetTagOrder_1.default.aggregate([
            {
                $match: {
                    paymentStatus: 'succeeded'
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$totalCostEuro' }
                }
            }
        ]);
        // PetTagOrder doesn't have paymentStatus, so we'll count all as potential revenue
        const petRevenueStats = await PetTagOrder_1.default.aggregate([
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$totalCostEuro' }
                }
            }
        ]);
        const userRevenue = userRevenueStats.length > 0 ? userRevenueStats[0].totalRevenue : 0;
        const petRevenue = petRevenueStats.length > 0 ? petRevenueStats[0].totalRevenue : 0;
        const totalRevenue = userRevenue + petRevenue;
        // Transform status stats to object (already done above)
        res.status(200).json({
            message: 'Order statistics retrieved successfully',
            status: 200,
            stats: {
                total: totalOrders,
                statusBreakdown,
                totalRevenue: parseFloat(totalRevenue.toFixed(2))
            }
        });
    }
    catch (error) {
        console.error('Error getting order statistics:', error);
        res.status(500).json({
            message: 'Failed to get order statistics',
            error: 'Internal server error'
        });
    }
});
