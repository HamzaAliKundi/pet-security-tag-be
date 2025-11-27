# Pet Security Tag Backend - Complete Flow Documentation

## 🏗️ Backend Architecture

This is a **Node.js + Express + TypeScript** REST API backend built with:
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT (JSON Web Tokens)
- **Payment Processing**: Stripe
- **File Storage**: Cloudinary (QR codes & images)
- **Email Service**: SendGrid
- **SMS Service**: Twilio
- **QR Code Generation**: QRCode library

---

## 📁 Project Structure

```
src/
├── config/              # Configuration files
│   ├── env.ts          # Environment variables validation
│   └── index.ts        # MongoDB connection
├── controllers/        # Business logic handlers
│   ├── admin/         # Admin-specific controllers
│   │   ├── overview.ts
│   │   ├── users.ts
│   │   ├── pets.ts
│   │   ├── orders.ts
│   │   ├── payments.ts
│   │   └── recentActivity.ts
│   ├── auth.ts        # Authentication controllers
│   ├── user/          # User-facing controllers
│   │   ├── account.ts
│   │   ├── pet.ts
│   │   ├── order.ts
│   │   ├── userPetTagOrder.ts
│   │   ├── subscription.ts
│   │   └── contact.ts
│   ├── qrcode/        # QR code controllers
│   │   ├── qrManagement.ts
│   │   ├── qrScanning.ts
│   │   └── locationShare.ts
│   └── stripe/        # Stripe webhook handler
│       └── webhook.ts
├── middleware/         # Express middleware
│   ├── auth.ts        # JWT authentication middleware
│   └── errorHandler.ts # Global error handler
├── models/            # MongoDB/Mongoose models
│   ├── User.ts
│   ├── Pet.ts
│   ├── PetTagOrder.ts
│   ├── UserPetTagOrder.ts
│   ├── QRCode.ts
│   ├── Subscription.ts
│   └── Contact.ts
├── routes/            # API route definitions
│   ├── index.ts       # Main router
│   ├── auth.ts        # Authentication routes
│   ├── user.ts        # User routes
│   ├── admin.ts       # Admin routes
│   ├── pet.ts         # Pet routes
│   ├── qrcode.ts      # QR code routes
│   └── stripe.ts      # Stripe webhook route
├── utils/             # Utility functions
│   ├── jwt.ts         # JWT token generation/verification
│   ├── stripeService.ts # Stripe API wrapper
│   ├── qrCodeService.ts # QR code generation
│   ├── emailService.ts  # SendGrid email service
│   ├── imageUploadService.ts # Cloudinary image upload
│   └── twilioService.ts    # Twilio SMS service
└── index.ts           # Application entry point
```

---

## 🔄 Complete Application Flow

### 1. **Application Initialization** (`src/index.ts`)

**Startup Sequence:**
```
1. Load environment variables (.env)
2. Connect to MongoDB database
3. Initialize Express app
4. Configure middleware (CORS, Helmet, Morgan, Body Parser)
5. Set up routes
6. Configure error handler
7. Start HTTP server
```

**Middleware Stack:**
```typescript
1. CORS (Cross-Origin Resource Sharing)
   - Allowed origins: localhost:5173, localhost:5174, localhost:5175
   - Production: digitaltails.com domains
   - Credentials: enabled

2. Helmet (Security headers)

3. Morgan (HTTP request logger)

4. Body Parser
   - express.json() - JSON body parsing
   - express.urlencoded() - URL-encoded body parsing
   - Special: /api/v1/stripe/webhook uses express.raw() 
     for Stripe signature verification

5. Routes: /api/v1/*

6. Error Handler (global catch-all)
```

**Health Check:**
- `GET /ping` → Returns `{ message: 'server is running...' }`

---

### 2. **Database Models & Schema**

#### **User Model** (`models/User.ts`)
```typescript
{
  email: string (unique, lowercase)
  password: string (hashed with bcrypt)
  firstName: string
  lastName: string
  role: string (default: 'user')
  status: 'active' | 'inactive' | 'suspended'
  isEmailVerified: boolean
  lastLogin?: Date
  phone?: string
  street, city, state, zipCode, country?: string
  createdAt, updatedAt (timestamps)
}
```

#### **Pet Model** (`models/Pet.ts`)
```typescript
{
  userId: ObjectId (ref: User)
  userPetTagOrderId: ObjectId (ref: UserPetTagOrder/PetTagOrder)
  orderType: 'UserPetTagOrder' | 'PetTagOrder'
  petName: string
  hideName: boolean
  age: number (0-30)
  breed: string
  medication: string
  allergies: string
  notes: string
  image?: string (Cloudinary URL)
  createdAt, updatedAt
}
```

#### **UserPetTagOrder Model** (`models/UserPetTagOrder.ts`)
```typescript
{
  userId: ObjectId (ref: User)
  quantity: number (min: 1)
  petName: string
  totalCostEuro: number
  tagColor: string (backward compatibility)
  tagColors?: string[] (array for multiple tags)
  phone: string
  street, city, state, zipCode, country: string
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
  paymentIntentId?: string
  paymentStatus: 'pending' | 'succeeded' | 'failed' | 'cancelled'
  isReplacement?: boolean
  trackingNumber?: string
  deliveryCompany?: string
  createdAt, updatedAt
}
```

#### **PetTagOrder Model** (`models/PetTagOrder.ts`)
```typescript
{
  email: string
  name: string
  petName: string
  quantity: number
  subscriptionType: 'monthly' | 'yearly'
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
  paymentIntentId?: string
  tagColor?: string
  tagColors?: string[]
  totalCostEuro?: number
  shippingAddress: { street, city, state, zipCode, country }
  phone?: string
  trackingNumber?: string
  deliveryCompany?: string
  termsAccepted?: boolean
  createdAt, updatedAt
}
```

#### **QRCode Model** (`models/QRCode.ts`)
```typescript
{
  code: string (unique) // Format: QR-{timestamp}-{random}
  imageUrl: string (Cloudinary URL)
  hasGiven: boolean
  hasVerified: boolean
  assignedUserId?: ObjectId (ref: User)
  assignedOrderId?: ObjectId (ref: UserPetTagOrder)
  assignedPetId?: ObjectId (ref: Pet)
  status: 'unassigned' | 'assigned' | 'verified' | 'lost'
  scannedCount: number
  lastScannedAt?: Date
  isDownloaded: boolean
  downloadedAt?: Date
  createdAt, updatedAt
}
```

#### **Subscription Model** (`models/Subscription.ts`)
```typescript
{
  userId: ObjectId (ref: User)
  qrCodeId: ObjectId (ref: QRCode)
  type: 'monthly' | 'yearly' | 'lifetime'
  status: 'active' | 'expired' | 'cancelled'
  startDate: Date
  endDate: Date
  stripeSubscriptionId?: string
  paymentIntentId?: string
  amountPaid: number
  currency: string (default: 'eur')
  autoRenew: boolean (default: true)
  createdAt, updatedAt
}
```

#### **Contact Model** (`models/Contact.ts`)
```typescript
{
  fullName: string
  email: string
  purpose: string
  message: string
  isRead: boolean (default: false)
  createdAt, updatedAt
}
```

---

### 3. **Authentication Flow**

#### **Registration** (`POST /api/v1/auth/register`)

**Flow:**
```
1. Validate input: email, password, firstName, lastName
2. Check if user already exists
3. Hash password with bcrypt (SALT_ROUNDS)
4. Create user with isEmailVerified: false
5. Generate verification token (JWT, expires in 1h)
6. Send verification email (SendGrid) - non-blocking
7. Return user data + token
```

**Response:**
```json
{
  "message": "User registered successfully...",
  "status": 201,
  "token": "verification_token",
  "user": { ... }
}
```

#### **Login** (`POST /api/v1/auth/login`)

**Flow:**
```
1. Validate email & password
2. Find user by email
3. Check if email is verified (isEmailVerified must be true)
4. Compare password with bcrypt
5. Generate JWT token (expires in 30 days)
6. Optionally update lastLogin
7. Return token + user data
```

**Response:**
```json
{
  "message": "Login successful",
  "status": 200,
  "token": "jwt_token",
  "user": { _id, email, firstName, lastName, role }
}
```

#### **Email Verification** (`POST /api/v1/auth/verify-email`)

**Flow:**
```
1. Receive verification token
2. Verify JWT token (1h expiry)
3. Find user by decoded _id
4. Check if already verified
5. Set isEmailVerified = true
6. Save user
```

#### **Forgot Password** (`POST /api/v1/auth/forgot-password`)

**Flow:**
```
1. Receive email
2. Find user by email
3. Generate password reset token (JWT, expires in 1h)
4. Send password reset email with link - non-blocking
5. Return success message
```

#### **Reset Password** (`POST /api/v1/auth/reset-password`)

**Flow:**
```
1. Receive token + new password
2. Verify JWT token
3. Find user by decoded _id
4. Hash new password
5. Update user password
6. Save user
```

#### **JWT Token Generation** (`utils/jwt.ts`)

**Token Types:**
- **Auth Token**: 30 days expiry, payload: `{ _id, role }`
- **Verification Token**: 1 hour expiry, payload: `{ _id }`
- **Password Reset Token**: 1 hour expiry, payload: `{ _id }`

---

### 4. **Authentication Middleware** (`middleware/auth.ts`)

**Flow:**
```
1. Extract token from Authorization header: "Bearer <token>"
2. Verify JWT token with JWT_SECRET
3. Find user by decoded _id
4. Attach user to req.user
5. Call next()
6. If error → 401 Unauthorized
```

**Usage:**
- Applied to all routes in `/admin/*`
- Applied to protected routes in `/user/*`
- Optional for public routes

---

### 5. **User Routes & Controllers**

#### **Account Management** (`/api/v1/user/*`)

**Get Single User** (`GET /api/v1/user/get-single-user`)
- Requires: `authMiddleware`
- Returns: Current authenticated user data

**Update User** (`PATCH /api/v1/user/update-single-user`)
- Requires: `authMiddleware`
- Updates: firstName, lastName, phone, address fields

**Delete Account** (`DELETE /api/v1/user/delete-account`)
- Requires: `authMiddleware`
- Soft deletes user account
- Sends account deletion email

#### **Pet Management** (`/api/v1/user/pets`)

**Create Pet** (`POST /api/v1/user/pets`)
- Requires: `authMiddleware`
- Creates pet associated with user
- Links to UserPetTagOrder or PetTagOrder

**Get User Pets** (`GET /api/v1/user/pets`)
- Requires: `authMiddleware`
- Returns all pets for authenticated user

**Get Pet** (`GET /api/v1/user/pets/:petId`)
- Requires: `authMiddleware`
- Returns specific pet (if owned by user)

**Update Pet** (`PUT /api/v1/user/pets/:petId`)
- Requires: `authMiddleware`
- Updates pet information

**Upload Pet Image** (`POST /api/v1/user/pets/:petId/upload-image`)
- Requires: `authMiddleware`
- Uses Multer middleware
- Uploads to Cloudinary
- Updates pet.image field

#### **Order Management**

**Public Order** (`POST /api/v1/user/orders`)
- No authentication required
- Creates `PetTagOrder` for guest checkout
- Returns payment intent for Stripe

**Confirm Public Order Payment** (`POST /api/v1/user/orders/:orderId/confirm-payment`)
- Verifies Stripe payment
- Updates order status to 'paid'
- Sends confirmation email

**User Pet Tag Order** (`POST /api/v1/user/user-pet-tag-orders`)
- Requires: `authMiddleware`
- Validates pet limit (max 5 pets per user)
- Creates `UserPetTagOrder`
- Generates Stripe payment intent
- Returns client secret for payment

**Confirm Payment** (`POST /api/v1/user/user-pet-tag-orders/:orderId/confirm-payment`)
- Requires: `authMiddleware`
- Verifies Stripe payment intent
- Updates order status to 'paid'
- Assigns QR codes to order
- Creates Pet records
- Sends order confirmation email

**Replacement Order** (`POST /api/v1/user/pets/:petId/replacement-order`)
- Requires: `authMiddleware`
- Creates replacement tag order (bypasses 5-pet limit)
- Similar flow to regular order

#### **Subscription Management** (`/api/v1/user/subscriptions`)

**Get User Subscriptions** (`GET /api/v1/user/subscriptions`)
- Requires: `authMiddleware`
- Returns all subscriptions for user

**Renew Subscription** (`POST /api/v1/user/subscriptions/renew`)
- Requires: `authMiddleware`
- Creates Stripe subscription for auto-renewal
- Returns client secret

**Upgrade Subscription** (`POST /api/v1/user/subscriptions/upgrade`)
- Requires: `authMiddleware`
- Changes subscription type (monthly → yearly)
- Updates Stripe subscription
- Prorates billing

**Confirm Subscription Payment** (`POST /api/v1/user/subscriptions/confirm-payment`)
- Requires: `authMiddleware`
- Verifies Stripe subscription payment
- Creates/updates Subscription record
- Links to QR code

#### **Contact Form** (`/api/v1/user/contact`)

**Submit Contact** (`POST /api/v1/user/contact`)
- Public route (no auth required)
- Creates Contact record
- Sends notification email

**Get All Contacts** (`GET /api/v1/user/contact`)
- Public route (may be admin-only in practice)

**Get Contact** (`GET /api/v1/user/contact/:contactId`)
- Public route

**Update Contact Status** (`PUT /api/v1/user/contact/:contactId/status`)
- Public route (typically admin-only)

---

### 6. **Admin Routes & Controllers** (`/api/v1/admin/*`)

**All admin routes require `authMiddleware`**

#### **Overview** (`GET /api/v1/admin/overview`)
- Returns dashboard statistics:
  - Total users
  - Total pets
  - Total orders (UserPetTagOrder + PetTagOrder)
  - Total revenue (sum of all paid orders + subscriptions)

#### **Recent Activity** (`GET /api/v1/admin/recent-activity`)
- Returns recent order activities
- Used for dashboard feed

#### **User Management**
- `GET /api/v1/admin/users` - List users (with pagination, search, filters)
- `GET /api/v1/admin/users/:userId` - Get user details
- `PUT /api/v1/admin/users/:userId/status` - Update user status
- `DELETE /api/v1/admin/users/:userId` - Delete user
- `GET /api/v1/admin/users/stats` - User statistics

#### **Pet Management**
- `GET /api/v1/admin/pets` - List pets
- `GET /api/v1/admin/pets/:petId` - Get pet details
- `DELETE /api/v1/admin/pets/:petId` - Delete pet
- `GET /api/v1/admin/pets/stats` - Pet statistics

#### **Order Management**
- `GET /api/v1/admin/orders` - List orders
- `GET /api/v1/admin/orders/:orderId` - Get order details
- `PUT /api/v1/admin/orders/:orderId/status` - Update order status
- `GET /api/v1/admin/orders/stats` - Order statistics

#### **Payment Management**
- `GET /api/v1/admin/payments` - List payments
- `GET /api/v1/admin/payments/:paymentId` - Get payment details
- `GET /api/v1/admin/payments/stats` - Payment statistics

#### **QR Code Management**
- `POST /api/v1/admin/qr-codes/generate-bulk` - Generate multiple QR codes
- `GET /api/v1/admin/qr-codes` - List QR codes
- `GET /api/v1/admin/qr-codes/stats` - QR code statistics
- `DELETE /api/v1/admin/qr-codes/bulk` - Bulk delete QR codes
- `GET /api/v1/admin/qr-codes/download/csv` - Download QR codes as CSV
- `GET /api/v1/admin/qr-codes/:qrId` - Get QR code details
- `DELETE /api/v1/admin/qr-codes/:qrId` - Delete QR code

#### **Contact Management**
- `GET /api/v1/admin/contacts` - List contacts
- `GET /api/v1/admin/contacts/:contactId` - Get contact details
- `PUT /api/v1/admin/contacts/:contactId/status` - Update contact status (mark as read)

---

### 7. **QR Code Flow**

#### **QR Code Generation** (`utils/qrCodeService.ts`)

**Process:**
```
1. Generate unique code: "QR-{timestamp}-{random6chars}"
2. Create QR URL: {QR_URL}/qr/{code}
3. Generate QR code image (256x256px, PNG)
4. Upload to Cloudinary (folder: pet-security-tags/qr-codes)
5. Save to database with status: 'unassigned'
6. Return: { id, code, imageUrl, qrURL, cloudinaryPublicId, status }
```

**Bulk Generation:**
- Generates multiple QR codes sequentially
- Returns success/failure counts

#### **QR Code Assignment**
- When order is paid, QR codes are assigned:
  - `assignedUserId` → User who owns the order
  - `assignedOrderId` → Order reference
  - `assignedPetId` → Pet reference (after pet is created)
  - `status` → 'assigned'

#### **QR Code Scanning** (`GET /api/v1/qr/scan/:code`)

**Flow:**
```
1. Find QR code by code
2. Check if QR code is assigned
3. Check if QR code has verified subscription
4. If verified:
   - Increment scannedCount
   - Update lastScannedAt
   - Return pet profile information
5. If not verified:
   - Return verification page information
```

#### **QR Code Verification** (`POST /api/v1/qr/verify-subscription`)
- Requires: `authMiddleware`
- Creates subscription for QR code
- Links QR code to user
- Sets `hasVerified = true`
- Updates status to 'verified'

#### **Auto-Verify QR Code** (`POST /api/v1/qr/auto-verify`)
- Requires: `authMiddleware`
- Checks if user has active subscription for QR code
- Auto-verifies if subscription exists

#### **Get Pet Profile** (`GET /api/v1/qr/pet-profile/:petId`)
- Public route
- Returns pet information when QR is scanned
- Used when finder scans verified QR code

#### **Share Location** (`POST /api/v1/qr/share-location`)
- Public route
- Allows finder to share location with pet owner
- Sends SMS/email notification to owner

#### **QR Code Pricing** (`utils/qrCodeService.ts`)
```typescript
{
  monthly: { price: 2.75, currency: 'GBP', duration: '1 month' },
  yearly: { price: 19.99, currency: 'GBP', duration: '12 months', savings: '13.01' },
  lifetime: { price: 99.00, currency: 'GBP', duration: 'Lifetime', savings: 'Maximum value' }
}
```

---

### 8. **Stripe Integration**

#### **Stripe Service** (`utils/stripeService.ts`)

**Payment Intent Creation:**
```typescript
createPaymentIntent({
  amount: number (in cents),
  currency: string,
  metadata: { userId, petName, quantity, tagColor }
})
// Returns: { success, paymentIntentId, clientSecret }
```

**Subscription Creation:**
```typescript
createStripeSubscription({
  customerEmail: string,
  amount: number (in cents),
  currency: string,
  interval: 'month' | 'year',
  metadata: { userId, subscriptionType, qrCodeId },
  paymentMethodId?: string
})
// Returns: { success, subscriptionId, customerId, clientSecret }
```

**Key Functions:**
- `getOrCreateCustomer()` - Creates or retrieves Stripe customer
- `savePaymentMethodToCustomer()` - Saves payment method for future use
- `confirmPaymentIntent()` - Verifies payment status
- `cancelStripeSubscription()` - Cancels subscription
- `updateStripeSubscription()` - Updates subscription (upgrade/downgrade)

#### **Stripe Webhook** (`POST /api/v1/stripe/webhook`)

**Important:**
- Uses `express.raw()` middleware (NOT `express.json()`)
- Verifies webhook signature with `STRIPE_WEBHOOK_SECRET`

**Event Handlers:**

1. **invoice.payment_succeeded**
   - Handles subscription auto-renewal
   - Creates new Subscription record
   - Marks old subscription as expired
   - Sends renewal notification email
   - Prevents duplicate renewals

2. **invoice.payment_failed**
   - Handles failed subscription payments
   - Logs failure for admin review

3. **customer.subscription.updated**
   - Updates subscription status
   - Updates end date if changed

4. **customer.subscription.deleted**
   - Marks subscription as cancelled

5. **customer.subscription.created**
   - Logs subscription creation (usually already handled by frontend)

---

### 9. **Email Service** (`utils/emailService.ts`)

**SendGrid Configuration:**
- Uses SendGrid API
- From email/name from environment variables

**Email Templates:**
1. **Verification Email** - Email verification link
2. **Password Reset Email** - Password reset link
3. **Order Confirmation Email** - Order details
4. **Subscription Notification Email** - Renewal/upgrade notifications
5. **QR Code First Scan Email** - Notifies owner when QR is scanned
6. **Order Shipped Email** - Shipping notification
7. **Order Delivered Email** - Delivery confirmation
8. **Order Cancelled Email** - Cancellation notice
9. **Account Deleted Email** - Account deletion confirmation
10. **Credentials Email** - Admin credentials (if applicable)

**Non-Blocking Emails:**
- Email sending failures don't break the request
- Errors are logged but don't throw exceptions

---

### 10. **Image Upload Service** (`utils/imageUploadService.ts`)

**Cloudinary Configuration:**
- Configured with credentials from environment
- Used for:
  - QR code images
  - Pet profile images

**Multer Configuration:**
- Handles multipart/form-data
- Single file upload: `upload.single('image')`
- File size limits and validation

---

### 11. **Twilio SMS Service** (`utils/twilioService.ts`)

**Features:**
- SMS notifications
- WhatsApp messaging (if configured)
- Location sharing notifications
- Multi-region support (US, UK)

**Configuration:**
- Account SID & Auth Token
- Phone numbers for US/UK
- Alphanumeric sender ID for UK

---

### 12. **Error Handling** (`middleware/errorHandler.ts`)

**Global Error Handler:**
- Catches all unhandled errors
- Development mode: Returns full error stack
- Production mode: Returns sanitized error message
- Operational errors: User-friendly messages
- Programmatic errors: Generic "Something went wrong"

**Error Response Format:**
```json
{
  "status": "error",
  "message": "Error message",
  "error": { ... } // Only in development
}
```

---

### 13. **Environment Variables** (`config/env.ts`)

**Required Variables:**
```env
PORT=5001
NODE_ENV=development|production
MONGODB_URI=mongodb://...
JWT_SECRET=your_secret_key
SALT_ROUNDS=10
SENDGRID_API_KEY=...
SENDGRID_FROM_EMAIL=...
SENDGRID_FROM_NAME=...
FRONTEND_URL=http://localhost:5173
QR_URL=https://yourdomain.com
STRIPE_PUBLISH_KEY=pk_...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_... (optional)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
TWILIO_WHATSAPP_NUMBER=...
```

**Validation:**
- All required variables are validated on startup
- Application exits if any required variable is missing

---

## 🔐 Security Features

1. **Authentication:**
   - JWT tokens with 30-day expiry
   - Password hashing with bcrypt
   - Email verification required for login

2. **Authorization:**
   - Role-based access control (admin vs user)
   - Protected routes via middleware
   - User can only access their own data

3. **API Security:**
   - Helmet for security headers
   - CORS configuration
   - Input validation on all endpoints
   - SQL injection prevention (MongoDB)
   - XSS protection

4. **Payment Security:**
   - Stripe webhook signature verification
   - Payment intent confirmation
   - No direct payment processing on server

---

## 📊 Complete Request Flow Example

### **User Creates Pet Tag Order**

```
1. Frontend → POST /api/v1/user/user-pet-tag-orders
   Headers: { Authorization: "Bearer <token>" }
   Body: { quantity, petName, totalCostEuro, tagColor, ... }

2. authMiddleware:
   - Verifies JWT token
   - Attaches user to req.user

3. createUserPetTagOrder controller:
   - Validates input
   - Checks pet limit (max 5)
   - Creates Stripe payment intent
   - Creates UserPetTagOrder (status: 'pending')
   - Returns: { orderId, clientSecret }

4. Frontend → Stripe SDK:
   - Confirms payment with clientSecret

5. Frontend → POST /api/v1/user/user-pet-tag-orders/:orderId/confirm-payment
   Body: { paymentIntentId }

6. confirmPayment controller:
   - Verifies payment with Stripe
   - Updates order status to 'paid'
   - Assigns QR codes to order
   - Creates Pet records
   - Sends order confirmation email
   - Returns: { order, pets, qrCodes }

7. Response sent to frontend
```

### **QR Code Scanning Flow**

```
1. Scanner → GET /api/v1/qr/scan/:code

2. scanQRCode controller:
   - Finds QR code by code
   - Checks if assigned
   - Checks subscription status
   - If verified:
     - Increments scannedCount
     - Returns pet profile
   - If not verified:
     - Returns verification page info

3. If not verified, user subscribes:
   - Frontend → POST /api/v1/qr/verify-subscription
   - Creates Stripe subscription
   - Creates Subscription record
   - Marks QR as verified

4. When scanned again:
   - Returns pet profile
   - Optionally sends SMS to owner
```

### **Subscription Auto-Renewal Flow**

```
1. Stripe → POST /api/v1/stripe/webhook
   Event: invoice.payment_succeeded
   Signature: verified with STRIPE_WEBHOOK_SECRET

2. handleInvoicePaymentSucceeded:
   - Finds subscription by stripeSubscriptionId
   - Checks if initial payment (skip if < 5 min old)
   - Calculates new end date
   - Creates new Subscription record
   - Marks old subscription as expired
   - Sends renewal notification email

3. Response: { received: true }
```

---

## 🔄 Data Relationships

```
User (1) ──→ (*) UserPetTagOrder
User (1) ──→ (*) Pet
User (1) ──→ (*) Subscription
User (1) ──→ (*) Contact

UserPetTagOrder (1) ──→ (*) Pet
PetTagOrder (1) ──→ (*) Pet

QRCode (1) ──→ (1) User (assignedUserId)
QRCode (1) ──→ (1) UserPetTagOrder (assignedOrderId)
QRCode (1) ──→ (1) Pet (assignedPetId)
QRCode (1) ──→ (*) Subscription (qrCodeId)
```

---

## 📝 Key Business Rules

1. **Pet Limit:**
   - Maximum 5 pets per user account
   - Replacement orders bypass this limit

2. **Order Status Flow:**
   - pending → paid → shipped → delivered
   - Can be cancelled at any time

3. **Payment Status:**
   - pending → succeeded | failed | cancelled

4. **QR Code Status:**
   - unassigned → assigned → verified

5. **Subscription Types:**
   - monthly: 1 month validity
   - yearly: 12 months validity
   - lifetime: 100 years validity

6. **Email Verification:**
   - Required before login
   - Verification token expires in 1 hour

7. **Password Reset:**
   - Reset token expires in 1 hour
   - Single-use token

---

## 🚀 API Endpoints Summary

### **Authentication**
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/verify-email` - Email verification
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password

### **User Routes**
- `GET /api/v1/user/get-single-user` - Get current user
- `PATCH /api/v1/user/update-single-user` - Update user
- `DELETE /api/v1/user/delete-account` - Delete account
- `POST /api/v1/user/pets` - Create pet
- `GET /api/v1/user/pets` - Get user pets
- `GET /api/v1/user/pets/:petId` - Get pet
- `PUT /api/v1/user/pets/:petId` - Update pet
- `POST /api/v1/user/pets/:petId/upload-image` - Upload pet image
- `POST /api/v1/user/orders` - Create public order
- `POST /api/v1/user/orders/:orderId/confirm-payment` - Confirm public order payment
- `POST /api/v1/user/user-pet-tag-orders` - Create user order
- `GET /api/v1/user/user-pet-tag-orders` - Get user orders
- `GET /api/v1/user/user-pet-tag-orders/:orderId` - Get order
- `POST /api/v1/user/user-pet-tag-orders/:orderId/confirm-payment` - Confirm payment
- `POST /api/v1/user/pets/:petId/replacement-order` - Create replacement order
- `GET /api/v1/user/subscriptions` - Get subscriptions
- `POST /api/v1/user/subscriptions/renew` - Renew subscription
- `POST /api/v1/user/subscriptions/upgrade` - Upgrade subscription
- `POST /api/v1/user/subscriptions/confirm-payment` - Confirm subscription payment
- `POST /api/v1/user/contact` - Submit contact form

### **Admin Routes** (All require authentication)
- `GET /api/v1/admin/overview` - Dashboard overview
- `GET /api/v1/admin/recent-activity` - Recent activities
- `GET /api/v1/admin/users` - List users
- `GET /api/v1/admin/users/:userId` - Get user
- `PUT /api/v1/admin/users/:userId/status` - Update user status
- `DELETE /api/v1/admin/users/:userId` - Delete user
- `GET /api/v1/admin/users/stats` - User statistics
- `GET /api/v1/admin/pets` - List pets
- `GET /api/v1/admin/pets/:petId` - Get pet
- `DELETE /api/v1/admin/pets/:petId` - Delete pet
- `GET /api/v1/admin/pets/stats` - Pet statistics
- `GET /api/v1/admin/orders` - List orders
- `GET /api/v1/admin/orders/:orderId` - Get order
- `PUT /api/v1/admin/orders/:orderId/status` - Update order status
- `GET /api/v1/admin/orders/stats` - Order statistics
- `GET /api/v1/admin/payments` - List payments
- `GET /api/v1/admin/payments/:paymentId` - Get payment
- `GET /api/v1/admin/payments/stats` - Payment statistics
- `POST /api/v1/admin/qr-codes/generate-bulk` - Generate QR codes
- `GET /api/v1/admin/qr-codes` - List QR codes
- `GET /api/v1/admin/qr-codes/:qrId` - Get QR code
- `DELETE /api/v1/admin/qr-codes/:qrId` - Delete QR code
- `DELETE /api/v1/admin/qr-codes/bulk` - Bulk delete
- `GET /api/v1/admin/qr-codes/download/csv` - Download CSV
- `GET /api/v1/admin/qr-codes/stats` - QR statistics
- `GET /api/v1/admin/contacts` - List contacts
- `GET /api/v1/admin/contacts/:contactId` - Get contact
- `PUT /api/v1/admin/contacts/:contactId/status` - Update contact status

### **QR Code Routes**
- `GET /api/v1/qr/scan/:code` - Scan QR code (public)
- `GET /api/v1/qr/verify-details/:code` - Get verification details
- `GET /api/v1/qr/pet-profile/:petId` - Get pet profile (public)
- `POST /api/v1/qr/share-location` - Share location (public)
- `POST /api/v1/qr/auto-verify` - Auto-verify QR (protected)
- `POST /api/v1/qr/verify-subscription` - Verify with subscription (protected)
- `POST /api/v1/qr/confirm-subscription` - Confirm subscription payment (protected)

### **Stripe Webhook**
- `POST /api/v1/stripe/webhook` - Stripe webhook handler

---

This completes the comprehensive flow documentation of the Pet Security Tag Backend API.
