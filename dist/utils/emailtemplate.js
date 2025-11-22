"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderDeliveredTemplate = exports.orderCancelledTemplate = exports.orderShippedTemplate = exports.petFoundNotificationTemplate = exports.credentialsEmailTemplate = exports.qrCodeFirstScanTemplate = exports.subscriptionNotificationTemplate = exports.orderConfirmationTemplate = exports.resetPasswordTemplate = exports.verificationEmailTemplate = void 0;
const handlebars_1 = require("handlebars");
exports.verificationEmailTemplate = (0, handlebars_1.compile)(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - Digital Tails</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Helvetica Neue', Arial, sans-serif; 
            background-color: #f8f9fa; 
            line-height: 1.6; 
            color: #2D2D2D;
        }
        .email-container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff; 
            border-radius: 16px; 
            overflow: hidden; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header { 
            background: #4CB2E2; 
            padding: 30px 20px; 
            text-align: center; 
            color: white;
        }
        .logo { 
            font-size: 28px; 
            font-weight: bold; 
            margin-bottom: 10px;
        }
        .tagline { 
            font-size: 16px; 
            opacity: 0.9;
        }
        .content { 
            padding: 40px 30px; 
            text-align: center;
        }
        .welcome-text { 
            font-size: 24px; 
            color: #4CB2E2; 
            margin-bottom: 20px; 
            font-weight: bold;
        }
        .description { 
            font-size: 16px; 
            color: #2D2D2D; 
            margin-bottom: 30px; 
            line-height: 1.8;
        }
        .cta-button { 
            background: #FDD30F; 
            color: #2D2D2D; 
            padding: 16px 32px; 
            text-decoration: none; 
            border-radius: 100px; 
            display: inline-block; 
            font-weight: bold; 
            font-size: 16px; 
            margin: 20px 0; 
            box-shadow: 0 4px 15px rgba(253, 211, 15, 0.3);
            transition: all 0.3s ease;
        }
        .cta-button:hover { 
            background: #FFE135;
            transform: translateY(-2px); 
            box-shadow: 0 6px 20px rgba(253, 211, 15, 0.4);
        }
        .info-box { 
            background-color: #DBEEFF; 
            border-left: 4px solid #4CB2E2; 
            padding: 20px; 
            margin: 30px 0; 
            border-radius: 8px;
        }
        .info-text { 
            color: #0897FF; 
            font-size: 14px; 
            margin: 0;
        }
        .footer { 
            background-color: #f8f9fa; 
            padding: 30px; 
            text-align: center; 
            border-top: 1px solid #e9ecef;
        }
        .footer-text { 
            color: #2D2D2D; 
            font-size: 14px; 
            margin-bottom: 15px;
        }
        .social-links { 
            margin-top: 20px;
        }
        .social-links a { 
            display: inline-block; 
            margin: 0 10px; 
            color: #4CB2E2; 
            text-decoration: none;
        }
        .paw-icon { 
            font-size: 20px; 
            margin-right: 8px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">🐾 DIGITAL TAILS</div>
            <div class="tagline">The Fastest Way To Find Your Pet</div>
        </div>
        
        <div class="content">
            <div class="welcome-text">Welcome to Digital Tails, {{name}}!</div>
            <p class="description">
                Thank you for joining our community of pet lovers! To get started with protecting your furry friend, 
                please verify your email address by clicking the button below.
            </p>
            
            <a href="{{verificationUrl}}" class="cta-button">
                🐕 Verify My Email
            </a>
            
            <div class="info-box">
                <p class="info-text">
                    <strong>🔒 Security Note:</strong> This verification link will expire in 24 hours for your security. 
                    If you didn't create an account with Digital Tails, you can safely ignore this email.
                </p>
            </div>
            
            <p class="description">
                Once verified, you'll be able to order your Digital Tails Pet Tag today and start protecting your pet with 
                instant location alerts and 24/7 support!
            </p>
        </div>
        
        <div class="footer">
            <p class="footer-text">
                <strong>Digital Tails Pet Securities</strong><br>
                Dedicated 24/7 Award Winning Service Team
            </p>
            <p class="footer-text">
                Need help? Contact us via email, WhatsApp, live chat, or phone!
            </p>
            <div class="social-links">
                <a href="mailto:info@digitaltails.com">📧 Email</a> | 
                <a href="https://wa.me/447928239287">💬 WhatsApp</a>
            </div>
            <p class="footer-text" style="margin-top: 20px; font-size: 12px;">
                © Digital Tails 2023. All Rights Reserved.
            </p>
        </div>
    </div>
</body>
</html>
`);
exports.resetPasswordTemplate = (0, handlebars_1.compile)(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password - Digital Tails</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Helvetica Neue', Arial, sans-serif; 
            background-color: #f8f9fa; 
            line-height: 1.6; 
            color: #2D2D2D;
        }
        .email-container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff; 
            border-radius: 16px; 
            overflow: hidden; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header { 
            background: #4CB2E2; 
            padding: 30px 20px; 
            text-align: center; 
            color: white;
        }
        .logo { 
            font-size: 28px; 
            font-weight: bold; 
            margin-bottom: 10px;
        }
        .tagline { 
            font-size: 16px; 
            opacity: 0.9;
        }
        .content { 
            padding: 40px 30px; 
            text-align: center;
        }
        .welcome-text { 
            font-size: 24px; 
            color: #4CB2E2; 
            margin-bottom: 20px; 
            font-weight: bold;
        }
        .description { 
            font-size: 16px; 
            color: #2D2D2D; 
            margin-bottom: 30px; 
            line-height: 1.8;
        }
        .cta-button { 
            background: #FDD30F; 
            color: #2D2D2D; 
            padding: 16px 32px; 
            text-decoration: none; 
            border-radius: 100px; 
            display: inline-block; 
            font-weight: bold; 
            font-size: 16px; 
            margin: 20px 0; 
            box-shadow: 0 4px 15px rgba(253, 211, 15, 0.3);
            transition: all 0.3s ease;
        }
        .cta-button:hover { 
            background: #FFE135;
            transform: translateY(-2px); 
            box-shadow: 0 6px 20px rgba(253, 211, 15, 0.4);
        }
        .warning-box { 
            background-color: #FFF8DC; 
            border-left: 4px solid #FDD30F; 
            padding: 20px; 
            margin: 30px 0; 
            border-radius: 8px;
        }
        .warning-text { 
            color: #856404; 
            font-size: 14px; 
            margin: 0;
        }
        .security-box { 
            background-color: #DBEEFF; 
            border-left: 4px solid #4CB2E2; 
            padding: 20px; 
            margin: 30px 0; 
            border-radius: 8px;
        }
        .security-text { 
            color: #0897FF; 
            font-size: 14px; 
            margin: 0;
        }
        .footer { 
            background-color: #f8f9fa; 
            padding: 30px; 
            text-align: center; 
            border-top: 1px solid #e9ecef;
        }
        .footer-text { 
            color: #2D2D2D; 
            font-size: 14px; 
            margin-bottom: 15px;
        }
        .social-links { 
            margin-top: 20px;
        }
        .social-links a { 
            display: inline-block; 
            margin: 0 10px; 
            color: #4CB2E2; 
            text-decoration: none;
        }
        .paw-icon { 
            font-size: 20px; 
            margin-right: 8px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">🐾 DIGITAL TAILS</div>
            <div class="tagline">The Fastest Way To Find Your Pet</div>
        </div>
        
        <div class="content">
            <div class="welcome-text">Password Reset Request</div>
            <p class="description">
                Hello {{name}},<br><br>
                We received a request to reset your Digital Tails account password. 
                Click the button below to create a new secure password for your account.
            </p>
            
            <a href="{{resetUrl}}" class="cta-button">
                🔐 Reset My Password
            </a>
            
            <div class="warning-box">
                <p class="warning-text">
                    <strong>⚠️ Important:</strong> This reset link will expire in 1 hour for your security. 
                    If you didn't request this password reset, please ignore this email and your password will remain unchanged.
                </p>
            </div>
            
            <div class="security-box">
                <p class="security-text">
                    <strong>🔒 Security Tips:</strong> Choose a strong password with a mix of letters, numbers, and symbols. 
                    Never share your password with anyone, including our support team.
                </p>
            </div>
            
            <p class="description">
                Once you've reset your password, you'll be able to access your Digital Tails account 
                and continue protecting your pets with our PetSecure Tag service.
            </p>
        </div>
        
        <div class="footer">
            <p class="footer-text">
                <strong>Digital Tails Pet Securities</strong><br>
                Dedicated 24/7 Award Winning Service Team
            </p>
            <p class="footer-text">
                Need help? Contact us via email, WhatsApp, live chat, or phone!
            </p>
            <div class="social-links">
                <a href="mailto:info@digitaltails.com">📧 Email</a> | 
                <a href="https://wa.me/447928239287">💬 WhatsApp</a>
            </div>
            <p class="footer-text" style="margin-top: 20px; font-size: 12px;">
                © Digital Tails 2023. All Rights Reserved.
            </p>
        </div>
    </div>
</body>
</html>
`);
exports.orderConfirmationTemplate = (0, handlebars_1.compile)(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation - Digital Tails</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Helvetica Neue', Arial, sans-serif; 
            background-color: #f8f9fa; 
            line-height: 1.6; 
            color: #2D2D2D;
        }
        .email-container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff; 
            border-radius: 16px; 
            overflow: hidden; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header { 
            background: #4CB2E2; 
            padding: 30px 20px; 
            text-align: center; 
            color: white;
        }
        .logo { 
            font-size: 28px; 
            font-weight: bold; 
            margin-bottom: 10px;
        }
        .tagline { 
            font-size: 16px; 
            opacity: 0.9;
        }
        .content { 
            padding: 40px 30px; 
            text-align: center;
        }
        .welcome-text { 
            font-size: 24px; 
            color: #4CB2E2; 
            margin-bottom: 20px; 
            font-weight: bold;
        }
        .description { 
            font-size: 16px; 
            color: #2D2D2D; 
            margin-bottom: 30px; 
            line-height: 1.8;
        }
        .order-details { 
            background-color: #f8f9fa; 
            border: 2px solid #4CB2E2; 
            padding: 25px; 
            margin: 30px 0; 
            border-radius: 16px;
            text-align: left;
        }
        .order-row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 10px; 
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
        }
        .order-row:last-child { 
            border-bottom: none; 
            font-weight: bold; 
            font-size: 18px;
            color: #4CB2E2;
        }
        .order-label { 
            font-weight: bold; 
            color: #2D2D2D;
        }
        .order-value { 
            color: #0F2137;
        }
        .info-box { 
            background-color: #DBEEFF; 
            border-left: 4px solid #4CB2E2; 
            padding: 20px; 
            margin: 30px 0; 
            border-radius: 8px;
        }
        .info-text { 
            color: #0897FF; 
            font-size: 14px; 
            margin: 0;
        }
        .footer { 
            background-color: #f8f9fa; 
            padding: 30px; 
            text-align: center; 
            border-top: 1px solid #e9ecef;
        }
        .footer-text { 
            color: #2D2D2D; 
            font-size: 14px; 
            margin-bottom: 15px;
        }
        .social-links { 
            margin-top: 20px;
        }
        .social-links a { 
            display: inline-block; 
            margin: 0 10px; 
            color: #4CB2E2; 
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">🐾 DIGITAL TAILS</div>
            <div class="tagline">Order Confirmation</div>
        </div>
        
        <div class="content">
            <div class="welcome-text">Thank You for Your Order, {{customerName}}!</div>
            <p class="description">
                Your Digital Tails Tag order has been confirmed and is being processed. 
                We'll send you tracking information once your order ships.
            </p>
            
            <div class="order-details">
                <div class="order-row">
                    <span class="order-label">Order Number:</span>
                    <span class="order-value">{{orderNumber}}</span>
                </div>
                <div class="order-row">
                    <span class="order-label">Pet Name:</span>
                    <span class="order-value">{{petName}}</span>
                </div>
                <div class="order-row">
                    <span class="order-label">Quantity:</span>
                    <span class="order-value">{{quantity}} Tag(s)</span>
                </div>
                <div class="order-row">
                    <span class="order-label">Order Date:</span>
                    <span class="order-value">{{orderDate}}</span>
                </div>
                <div class="order-row">
                    <span class="order-label">Total Amount:</span>
                    <span class="order-value">£{{totalAmount}}</span>
                </div>
            </div>
            
            <div class="info-box">
                <p class="info-text">
                    <strong>📦 What's Next:</strong><br>
                    • Your order is being processed and will ship within 1-2 business days<br>
                    • You'll receive tracking information via email once shipped<br>
                    • Once you receive your tag, activate it through your dashboard<br>
                    • Your pet will be protected 24/7 with our monitoring service
                </p>
            </div>
            
            <p class="description">
                Thank you for choosing Digital Tails to protect your beloved pet. 
                We're here to help keep your furry friend safe and sound!
            </p>
        </div>
        
        <div class="footer">
            <p class="footer-text">
                <strong>Digital Tails Pet Securities</strong><br>
                Dedicated 24/7 Award Winning Service Team
            </p>
            <p class="footer-text">
                Questions about your order? Contact us anytime!
            </p>
            <div class="social-links">
                <a href="mailto:info@digitaltails.com">📧 Email</a> | 
                <a href="https://wa.me/447928239287">💬 WhatsApp</a>
            </div>
            <p class="footer-text" style="margin-top: 20px; font-size: 12px;">
                © Digital Tails 2023. All Rights Reserved.
            </p>
        </div>
    </div>
</body>
</html>
`);
exports.subscriptionNotificationTemplate = (0, handlebars_1.compile)(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Subscription {{action}} - Digital Tails</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Helvetica Neue', Arial, sans-serif; 
            background-color: #f8f9fa; 
            line-height: 1.6; 
            color: #2D2D2D;
        }
        .email-container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff; 
            border-radius: 16px; 
            overflow: hidden; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header { 
            background: #4CB2E2; 
            padding: 30px 20px; 
            text-align: center; 
            color: white;
        }
        .logo { 
            font-size: 28px; 
            font-weight: bold; 
            margin-bottom: 10px;
        }
        .tagline { 
            font-size: 16px; 
            opacity: 0.9;
        }
        .content { 
            padding: 40px 30px; 
            text-align: center;
        }
        .welcome-text { 
            font-size: 24px; 
            color: #4CB2E2; 
            margin-bottom: 20px; 
            font-weight: bold;
        }
        .description { 
            font-size: 16px; 
            color: #2D2D2D; 
            margin-bottom: 30px; 
            line-height: 1.8;
        }
        .subscription-details { 
            background-color: #f8f9fa; 
            border: 2px solid #4CB2E2; 
            padding: 25px; 
            margin: 30px 0; 
            border-radius: 16px;
            text-align: left;
        }
        .subscription-row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 10px; 
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
        }
        .subscription-row:last-child { 
            border-bottom: none; 
            font-weight: bold; 
            font-size: 18px;
            color: #4CB2E2;
        }
        .subscription-label { 
            font-weight: bold; 
            color: #2D2D2D;
        }
        .subscription-value { 
            color: #0F2137;
        }
        .info-box { 
            background-color: #DBEEFF; 
            border-left: 4px solid #4CB2E2; 
            padding: 20px; 
            margin: 30px 0; 
            border-radius: 8px;
        }
        .info-text { 
            color: #0897FF; 
            font-size: 14px; 
            margin: 0;
        }
        .footer { 
            background-color: #f8f9fa; 
            padding: 30px; 
            text-align: center; 
            border-top: 1px solid #e9ecef;
        }
        .footer-text { 
            color: #2D2D2D; 
            font-size: 14px; 
            margin-bottom: 15px;
        }
        .social-links { 
            margin-top: 20px;
        }
        .social-links a { 
            display: inline-block; 
            margin: 0 10px; 
            color: #4CB2E2; 
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">🐾 DIGITAL TAILS</div>
            <div class="tagline">Subscription {{action}} Confirmation</div>
        </div>
        
        <div class="content">
            <div class="welcome-text">Subscription {{action}} Successful, {{customerName}}!</div>
            <p class="description">
                Your subscription has been {{action}}ed successfully. 
                Your pet's protection service is now active and will continue uninterrupted.
            </p>
            
            <div class="subscription-details">
                <div class="subscription-row">
                    <span class="subscription-label">Plan Type:</span>
                    <span class="subscription-value">{{planType}} Plan</span>
                </div>
                <div class="subscription-row">
                    <span class="subscription-label">Amount Paid:</span>
                    <span class="subscription-value">£{{amount}}</span>
                </div>
                <div class="subscription-row">
                    <span class="subscription-label">Valid Until:</span>
                    <span class="subscription-value">{{validUntil}}</span>
                </div>
                <div class="subscription-row">
                    <span class="subscription-label">Payment Date:</span>
                    <span class="subscription-value">{{paymentDate}}</span>
                </div>
            </div>
            
            <div class="info-box">
                <p class="info-text">
                    <strong>🛡️ Your Pet's Protection Includes:</strong><br>
                    • 24/7 monitoring and location tracking<br>
                    • Instant alerts when your pet's tag is scanned<br>
                    • Priority customer support<br>
                    • Automatic renewal (can be disabled in settings)
                </p>
            </div>
            
            <p class="description">
                Thank you for continuing to trust Digital Tails with your pet's safety. 
                We're committed to providing the best protection for your furry family member!
            </p>
        </div>
        
        <div class="footer">
            <p class="footer-text">
                <strong>Digital Tails Pet Securities</strong><br>
                Dedicated 24/7 Award Winning Service Team
            </p>
            <p class="footer-text">
                Need help with your subscription? Contact us anytime!
            </p>
            <div class="social-links">
                <a href="mailto:info@digitaltails.com">📧 Email</a> | 
                <a href="https://wa.me/447928239287">💬 WhatsApp</a>
            </div>
            <p class="footer-text" style="margin-top: 20px; font-size: 12px;">
                © Digital Tails 2023. All Rights Reserved.
            </p>
        </div>
    </div>
</body>
</html>
`);
exports.qrCodeFirstScanTemplate = (0, handlebars_1.compile)(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QR Code Activated - Digital Tails</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Helvetica Neue', Arial, sans-serif; 
            background-color: #f8f9fa; 
            line-height: 1.6; 
            color: #2D2D2D;
        }
        .email-container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff; 
            border-radius: 16px; 
            overflow: hidden; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header { 
            background: #FDD30F; 
            padding: 30px 20px; 
            text-align: center; 
            color: #2D2D2D;
        }
        .logo { 
            font-size: 28px; 
            font-weight: bold; 
            margin-bottom: 10px;
        }
        .tagline { 
            font-size: 16px; 
            opacity: 0.9;
        }
        .content { 
            padding: 40px 30px; 
            text-align: center;
        }
        .welcome-text { 
            font-size: 24px; 
            color: #4CB2E2; 
            margin-bottom: 20px; 
            font-weight: bold;
        }
        .description { 
            font-size: 16px; 
            color: #2D2D2D; 
            margin-bottom: 30px; 
            line-height: 1.8;
        }
        .scan-details { 
            background-color: #FFF8DC; 
            border: 2px solid #FDD30F; 
            padding: 25px; 
            margin: 30px 0; 
            border-radius: 16px;
            text-align: left;
        }
        .scan-row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 10px; 
            padding: 8px 0;
            border-bottom: 1px solid #FFE135;
        }
        .scan-row:last-child { 
            border-bottom: none; 
        }
        .scan-label { 
            font-weight: bold; 
            color: #2D2D2D;
        }
        .scan-value { 
            color: #0F2137;
        }
        .success-box { 
            background-color: #DBEEFF; 
            border-left: 4px solid #4CB2E2; 
            padding: 20px; 
            margin: 30px 0; 
            border-radius: 8px;
        }
        .success-text { 
            color: #0897FF; 
            font-size: 14px; 
            margin: 0;
        }
        .info-box { 
            background-color: #DBEEFF; 
            border-left: 4px solid #4CB2E2; 
            padding: 20px; 
            margin: 30px 0; 
            border-radius: 8px;
        }
        .info-text { 
            color: #0897FF; 
            font-size: 14px; 
            margin: 0;
        }
        .footer { 
            background-color: #f8f9fa; 
            padding: 30px; 
            text-align: center; 
            border-top: 1px solid #e9ecef;
        }
        .footer-text { 
            color: #2D2D2D; 
            font-size: 14px; 
            margin-bottom: 15px;
        }
        .social-links { 
            margin-top: 20px;
        }
        .social-links a { 
            display: inline-block; 
            margin: 0 10px; 
            color: #4CB2E2; 
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">🐾 DIGITAL TAILS</div>
            <div class="tagline">🎉 Your QR Code is Now Active!</div>
        </div>
        
        <div class="content">
            <div class="welcome-text">Congratulations, {{petOwnerName}}!</div>
            <p class="description">
                Your Digital Tails Tag has been successfully activated! Someone has scanned your pet's QR code for the first time, 
                which means your pet's protection service is now fully operational.
            </p>
            
            <div class="scan-details">
                <div class="scan-row">
                    <span class="scan-label">Pet Name:</span>
                    <span class="scan-value">{{petName}}</span>
                </div>
                <div class="scan-row">
                    <span class="scan-label">QR Code:</span>
                    <span class="scan-value">{{qrCode}}</span>
                </div>
                <div class="scan-row">
                    <span class="scan-label">First Scan Date:</span>
                    <span class="scan-value">{{scanDate}}</span>
                </div>
                <div class="scan-row">
                    <span class="scan-label">Scan Location:</span>
                    <span class="scan-value">{{scanLocation}}</span>
                </div>
            </div>
            
            <div class="success-box">
                <p class="success-text">
                    <strong>✅ Activation Complete!</strong><br>
                    Your pet's tag is now live and will send you instant notifications whenever someone scans it. 
                    This means if your pet ever gets lost, anyone who finds them can quickly contact you!
                </p>
            </div>
            
            <div class="info-box">
                <p class="info-text">
                    <strong>🔔 What Happens Next:</strong><br>
                    • You'll receive instant email notifications when your pet's tag is scanned<br>
                    • Anyone who finds your pet can contact you directly<br>
                    • Your pet's location and contact info are always up to date<br>
                    • 24/7 monitoring ensures your pet is always protected
                </p>
            </div>
            
            <p class="description">
                Your pet is now protected with Digital Tails' award-winning service. 
                Rest easy knowing that if your furry friend ever gets lost, they'll find their way back home!
            </p>
        </div>
        
        <div class="footer">
            <p class="footer-text">
                <strong>Digital Tails Pet Securities</strong><br>
                Dedicated 24/7 Award Winning Service Team
            </p>
            <p class="footer-text">
                Questions about your pet's protection? We're here to help 24/7!
            </p>
            <div class="social-links">
                <a href="mailto:info@digitaltails.com">📧 Email</a> | 
                <a href="https://wa.me/447928239287">💬 WhatsApp</a>
            </div>
            <p class="footer-text" style="margin-top: 20px; font-size: 12px;">
                © Digital Tails 2023. All Rights Reserved.
            </p>
        </div>
    </div>
</body>
</html>
`);
exports.credentialsEmailTemplate = (0, handlebars_1.compile)(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Account Credentials - Digital Tails</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Helvetica Neue', Arial, sans-serif; 
            background-color: #f8f9fa; 
            line-height: 1.6; 
            color: #2D2D2D;
        }
        .email-container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff; 
            border-radius: 16px; 
            overflow: hidden; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header { 
            background: #4CB2E2; 
            padding: 30px 20px; 
            text-align: center; 
            color: white;
        }
        .logo { 
            font-size: 28px; 
            font-weight: bold; 
            margin-bottom: 10px;
        }
        .tagline { 
            font-size: 16px; 
            opacity: 0.9;
        }
        .content { 
            padding: 40px 30px; 
            text-align: center;
        }
        .welcome-text { 
            font-size: 24px; 
            color: #4CB2E2; 
            margin-bottom: 20px; 
            font-weight: bold;
        }
        .description { 
            font-size: 16px; 
            color: #2D2D2D; 
            margin-bottom: 30px; 
            line-height: 1.8;
        }
        .credentials-box { 
            background-color: #f8f9fa; 
            border: 2px solid #4CB2E2; 
            padding: 25px; 
            margin: 30px 0; 
            border-radius: 16px;
            text-align: left;
        }
        .credential-row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 15px; 
            padding: 10px 0;
            border-bottom: 1px solid #e9ecef;
        }
        .credential-row:last-child { 
            border-bottom: none; 
        }
        .credential-label { 
            font-weight: bold; 
            color: #2D2D2D;
        }
        .credential-value { 
            color: #0F2137;
            font-family: monospace;
            background-color: #DBEEFF;
            padding: 4px 8px;
            border-radius: 8px;
        }
        .cta-button { 
            background: #4CB2E2; 
            color: white; 
            padding: 16px 32px; 
            text-decoration: none; 
            border-radius: 100px; 
            display: inline-block; 
            font-weight: bold; 
            font-size: 16px; 
            margin: 20px 0; 
            box-shadow: 0 4px 15px rgba(76, 178, 226, 0.3);
            transition: all 0.3s ease;
        }
        .cta-button:hover { 
            background: #3da1d1;
            transform: translateY(-2px); 
            box-shadow: 0 6px 20px rgba(76, 178, 226, 0.4);
        }
        .info-box { 
            background-color: #DBEEFF; 
            border-left: 4px solid #4CB2E2; 
            padding: 20px; 
            margin: 30px 0; 
            border-radius: 8px;
        }
        .info-text { 
            color: #0897FF; 
            font-size: 14px; 
            margin: 0;
        }
        .security-box { 
            background-color: #FFF8DC; 
            border-left: 4px solid #FDD30F; 
            padding: 20px; 
            margin: 30px 0; 
            border-radius: 8px;
        }
        .security-text { 
            color: #856404; 
            font-size: 14px; 
            margin: 0;
        }
        .footer { 
            background-color: #f8f9fa; 
            padding: 30px; 
            text-align: center; 
            border-top: 1px solid #e9ecef;
        }
        .footer-text { 
            color: #2D2D2D; 
            font-size: 14px; 
            margin-bottom: 15px;
        }
        .social-links { 
            margin-top: 20px;
        }
        .social-links a { 
            display: inline-block; 
            margin: 0 10px; 
            color: #4CB2E2; 
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">🐾 DIGITAL TAILS</div>
            <div class="tagline">Your Account is Ready!</div>
        </div>
        
        <div class="content">
            <div class="welcome-text">Welcome to Digital Tails, {{customerName}}!</div>
            <p class="description">
                Your account has been created successfully! We've generated your login credentials 
                so you can access your dashboard and manage your pet's protection.
            </p>
            
            <div class="credentials-box">
                <div class="credential-row">
                    <span class="credential-label">Email:</span>
                    <span class="credential-value">{{email}}</span>
                </div>
                <div class="credential-row">
                    <span class="credential-label">Password:</span>
                    <span class="credential-value">{{password}}</span>
                </div>
            </div>
            
            <a href="{{loginUrl}}" class="cta-button">
                🐕 Access Your Dashboard
            </a>
            
            <div class="security-box">
                <p class="security-text">
                    <strong>🔒 Security Note:</strong> Please change your password after your first login. 
                    Keep your credentials safe and don't share them with anyone.
                </p>
            </div>
            
            <div class="info-box">
                <p class="info-text">
                    <strong>📱 What You Can Do:</strong><br>
                    • View your pet's QR code and status<br>
                    • Update your pet's information<br>
                    • Manage your subscription<br>
                    • Track your order status<br>
                    • Access 24/7 customer support
                </p>
            </div>
            
            <p class="description">
                Your Digital Tails Tag order is being processed and you'll receive tracking information soon. 
                Thank you for choosing Digital Tails to protect your beloved pet!
            </p>
        </div>
        
        <div class="footer">
            <p class="footer-text">
                <strong>Digital Tails Pet Securities</strong><br>
                Dedicated 24/7 Award Winning Service Team
            </p>
            <p class="footer-text">
                Need help? Contact us via email, WhatsApp, live chat, or phone!
            </p>
            <div class="social-links">
                <a href="mailto:info@digitaltails.com">📧 Email</a> | 
                <a href="https://wa.me/447928239287">💬 WhatsApp</a>
            </div>
            <p class="footer-text" style="margin-top: 20px; font-size: 12px;">
                © Digital Tails 2023. All Rights Reserved.
            </p>
        </div>
    </div>
</body>
</html>
`);
exports.petFoundNotificationTemplate = (0, handlebars_1.compile)(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pet Found Alert - Digital Tails</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Helvetica Neue', Arial, sans-serif; 
            background-color: #f8f9fa; 
            line-height: 1.6; 
            color: #2D2D2D;
        }
        .email-container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff; 
            border-radius: 16px; 
            overflow: hidden; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header { 
            background: #4CB2E2; 
            padding: 30px 20px; 
            text-align: center; 
            color: white;
        }
        .logo { 
            font-size: 28px; 
            font-weight: bold; 
            margin-bottom: 10px;
        }
        .alert-text { 
            font-size: 18px; 
            opacity: 0.9;
        }
        .content { 
            padding: 40px 30px; 
            text-align: center;
        }
        .welcome-text { 
            font-size: 24px; 
            color: #4CB2E2; 
            margin-bottom: 20px; 
            font-weight: bold;
        }
        .description { 
            font-size: 16px; 
            color: #2D2D2D; 
            margin-bottom: 30px; 
            line-height: 1.8;
        }
        .location-box { 
            background-color: #DBEEFF; 
            border: 2px solid #4CB2E2; 
            padding: 20px; 
            margin: 30px 0; 
            border-radius: 16px;
        }
        .location-text { 
            color: #0897FF; 
            font-size: 16px; 
            font-weight: bold;
        }
        .cta-button { 
            background: #FDD30F; 
            color: #2D2D2D; 
            padding: 16px 32px; 
            text-decoration: none; 
            border-radius: 100px; 
            display: inline-block; 
            font-weight: bold; 
            font-size: 16px; 
            margin: 20px 0; 
            box-shadow: 0 4px 15px rgba(253, 211, 15, 0.3);
            transition: all 0.3s ease;
        }
        .cta-button:hover { 
            background: #FFE135;
            transform: translateY(-2px); 
            box-shadow: 0 6px 20px rgba(253, 211, 15, 0.4);
        }
        .info-box { 
            background-color: #DBEEFF; 
            border-left: 4px solid #4CB2E2; 
            padding: 20px; 
            margin: 30px 0; 
            border-radius: 8px;
        }
        .info-text { 
            color: #0897FF; 
            font-size: 14px; 
            margin: 0;
        }
        .footer { 
            background-color: #f8f9fa; 
            padding: 30px; 
            text-align: center; 
            border-top: 1px solid #e9ecef;
        }
        .footer-text { 
            color: #2D2D2D; 
            font-size: 14px; 
            margin-bottom: 15px;
        }
        .social-links { 
            margin-top: 20px;
        }
        .social-links a { 
            display: inline-block; 
            margin: 0 10px; 
            color: #4CB2E2; 
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">🐾 DIGITAL TAILS</div>
            <div class="alert-text">🎉 Your Pet Has Been Found!</div>
        </div>
        
        <div class="content">
            <div class="welcome-text">Great News, {{petOwnerName}}!</div>
            <p class="description">
                Someone has found your beloved pet <strong>{{petName}}</strong> and scanned their Digital Tails Tag! 
                We've received a notification and are here to help you reunite with your furry friend.
            </p>
            
            <div class="location-box">
                <p class="location-text">
                    📍 <strong>Location:</strong> {{foundLocation}}<br>
                    🕐 <strong>Time Found:</strong> {{foundTime}}<br>
                    👤 <strong>Finder's Contact:</strong> {{finderContact}}
                </p>
            </div>
            
            <a href="{{contactUrl}}" class="cta-button">
                📞 Contact Finder Now
            </a>
            
            <div class="info-box">
                <p class="info-text">
                    <strong>💡 Quick Tips:</strong> 
                    • Contact the finder as soon as possible<br>
                    • Arrange a safe meeting location<br>
                    • Bring identification to prove ownership<br>
                    • Thank the finder for their kindness
                </p>
            </div>
            
            <p class="description">
                Your Digital Tails Tag worked perfectly! This is exactly why we're here - to ensure 
                your pets always find their way back home safely.
            </p>
        </div>
        
        <div class="footer">
            <p class="footer-text">
                <strong>Digital Tails Pet Securities</strong><br>
                Dedicated 24/7 Award Winning Service Team
            </p>
            <p class="footer-text">
                Need assistance? Our support team is here to help 24/7!
            </p>
            <div class="social-links">
                <a href="mailto:info@digitaltails.com">📧 Email</a> | 
                <a href="https://wa.me/447928239287">💬 WhatsApp</a>
            </div>
            <p class="footer-text" style="margin-top: 20px; font-size: 12px;">
                © Digital Tails 2023. All Rights Reserved.
            </p>
        </div>
    </div>
</body>
</html>
`);
// Order Shipped Email Template
exports.orderShippedTemplate = (0, handlebars_1.compile)(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Order Has Been Shipped - Digital Tails</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Helvetica Neue', Arial, sans-serif; 
            background-color: #f8f9fa; 
            line-height: 1.6; 
            color: #2D2D2D;
        }
        .email-container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff; 
            border-radius: 16px; 
            overflow: hidden; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header { 
            background: #4CB2E2; 
            padding: 30px 20px; 
            text-align: center; 
            color: white;
        }
        .logo { 
            font-size: 28px; 
            font-weight: bold; 
            margin-bottom: 10px;
        }
        .tagline { 
            font-size: 16px; 
            opacity: 0.9;
        }
        .content { 
            padding: 40px 30px; 
            text-align: center;
        }
        .welcome-text { 
            font-size: 24px; 
            color: #4CB2E2; 
            margin-bottom: 20px; 
            font-weight: bold;
        }
        .description { 
            color: #2D2D2D; 
            font-size: 16px; 
            margin-bottom: 30px; 
            line-height: 1.8;
        }
        .order-details { 
            background-color: #f8f9fa; 
            border-radius: 12px; 
            padding: 25px; 
            margin: 30px 0; 
            text-align: left;
        }
        .order-row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 15px; 
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
        }
        .order-row:last-child { 
            border-bottom: none; 
        }
        .order-label { 
            font-weight: bold; 
            color: #2D2D2D;
        }
        .order-value { 
            color: #0F2137;
        }
        .tracking-box { 
            background-color: #DBEEFF; 
            border-left: 4px solid #4CB2E2; 
            padding: 20px; 
            margin: 30px 0; 
            border-radius: 8px;
            text-align: left;
        }
        .tracking-title { 
            color: #0897FF; 
            font-size: 18px; 
            font-weight: bold;
            margin-bottom: 15px;
        }
        .tracking-info { 
            color: #0F2137; 
            font-size: 16px; 
            margin: 8px 0;
        }
        .tracking-number { 
            font-weight: bold; 
            color: #4CB2E2; 
            font-size: 18px;
            word-break: break-all;
        }
        .footer { 
            background-color: #f8f9fa; 
            padding: 30px; 
            text-align: center; 
            border-top: 1px solid #e9ecef;
        }
        .footer-text { 
            color: #2D2D2D; 
            font-size: 14px; 
            margin-bottom: 15px;
        }
        .social-links { 
            margin-top: 20px;
        }
        .social-links a { 
            display: inline-block; 
            margin: 0 10px; 
            color: #4CB2E2; 
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">🐾 DIGITAL TAILS</div>
            <div class="tagline">Your Order Has Been Shipped!</div>
        </div>
        
        <div class="content">
            <div class="welcome-text">Great News, {{customerName}}!</div>
            <p class="description">
                Your Digital Tails pet tag order has been shipped and is on its way to you!
            </p>
            
            <div class="order-details">
                <div class="order-row">
                    <span class="order-label">Order Number:</span>
                    <span class="order-value">{{orderNumber}}</span>
                </div>
                <div class="order-row">
                    <span class="order-label">Pet Name:</span>
                    <span class="order-value">{{petName}}</span>
                </div>
                <div class="order-row">
                    <span class="order-label">Quantity:</span>
                    <span class="order-value">{{quantity}}</span>
                </div>
            </div>
            
            {{#if trackingNumber}}
            <div class="tracking-box">
                <div class="tracking-title">📦 Tracking Information</div>
                {{#if deliveryCompany}}
                <div class="tracking-info">
                    <strong>Delivery Company:</strong> {{deliveryCompany}}
                </div>
                {{/if}}
                <div class="tracking-info">
                    <strong>Tracking Number:</strong>
                    <div class="tracking-number">{{trackingNumber}}</div>
                </div>
                <div class="tracking-info" style="margin-top: 15px; font-size: 14px; color: #636363;">
                    You can use this tracking number on the delivery company's website to track your package.
                </div>
            </div>
            {{/if}}
            
            <p class="description">
                Your order should arrive within the estimated delivery time. Once you receive your tag, 
                simply scan it to activate your pet's profile and start protecting your furry friend!
            </p>
        </div>
        
        <div class="footer">
            <p class="footer-text">
                <strong>Digital Tails Pet Securities</strong><br>
                Dedicated 24/7 Award Winning Service Team
            </p>
            <p class="footer-text">
                Need assistance? Our support team is here to help 24/7!
            </p>
            <div class="social-links">
                <a href="mailto:info@digitaltails.com">📧 Email</a> | 
                <a href="https://wa.me/447928239287">💬 WhatsApp</a>
            </div>
            <p class="footer-text" style="margin-top: 20px; font-size: 12px;">
                © Digital Tails 2023. All Rights Reserved.
            </p>
        </div>
    </div>
</body>
</html>
`);
// Order Cancelled Email Template
exports.orderCancelledTemplate = (0, handlebars_1.compile)(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Cancelled - Digital Tails</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Helvetica Neue', Arial, sans-serif; 
            background-color: #f8f9fa; 
            line-height: 1.6; 
            color: #2D2D2D;
        }
        .email-container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff; 
            border-radius: 16px; 
            overflow: hidden; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header { 
            background: #EF4444; 
            padding: 30px 20px; 
            text-align: center; 
            color: white;
        }
        .logo { 
            font-size: 28px; 
            font-weight: bold; 
            margin-bottom: 10px;
        }
        .tagline { 
            font-size: 16px; 
            opacity: 0.9;
        }
        .content { 
            padding: 40px 30px; 
            text-align: center;
        }
        .welcome-text { 
            font-size: 24px; 
            color: #EF4444; 
            margin-bottom: 20px; 
            font-weight: bold;
        }
        .description { 
            color: #2D2D2D; 
            font-size: 16px; 
            margin-bottom: 30px; 
            line-height: 1.8;
        }
        .order-details { 
            background-color: #f8f9fa; 
            border-radius: 12px; 
            padding: 25px; 
            margin: 30px 0; 
            text-align: left;
        }
        .order-row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 15px; 
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
        }
        .order-row:last-child { 
            border-bottom: none; 
        }
        .order-label { 
            font-weight: bold; 
            color: #2D2D2D;
        }
        .order-value { 
            color: #0F2137;
        }
        .info-box { 
            background-color: #FEE2E2; 
            border-left: 4px solid #EF4444; 
            padding: 20px; 
            margin: 30px 0; 
            border-radius: 8px;
        }
        .info-text { 
            color: #991B1B; 
            font-size: 14px; 
            margin: 0;
        }
        .footer { 
            background-color: #f8f9fa; 
            padding: 30px; 
            text-align: center; 
            border-top: 1px solid #e9ecef;
        }
        .footer-text { 
            color: #2D2D2D; 
            font-size: 14px; 
            margin-bottom: 15px;
        }
        .social-links { 
            margin-top: 20px;
        }
        .social-links a { 
            display: inline-block; 
            margin: 0 10px; 
            color: #4CB2E2; 
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">🐾 DIGITAL TAILS</div>
            <div class="tagline">Order Cancellation Notice</div>
        </div>
        
        <div class="content">
            <div class="welcome-text">Order Cancelled, {{customerName}}</div>
            <p class="description">
                We're sorry to inform you that your order has been cancelled.
            </p>
            
            <div class="order-details">
                <div class="order-row">
                    <span class="order-label">Order Number:</span>
                    <span class="order-value">{{orderNumber}}</span>
                </div>
                <div class="order-row">
                    <span class="order-label">Pet Name:</span>
                    <span class="order-value">{{petName}}</span>
                </div>
                <div class="order-row">
                    <span class="order-label">Quantity:</span>
                    <span class="order-value">{{quantity}}</span>
                </div>
            </div>
            
            <div class="info-box">
                <p class="info-text">
                    <strong>ℹ️ What Happens Next:</strong><br>
                    • If payment was processed, you will receive a full refund within 5-10 business days<br>
                    • The refund will be credited back to your original payment method<br>
                    • If you have any questions, please contact our support team
                </p>
            </div>
            
            <p class="description">
                If you believe this cancellation was made in error, or if you have any questions, 
                please don't hesitate to reach out to our support team. We're here to help!
            </p>
        </div>
        
        <div class="footer">
            <p class="footer-text">
                <strong>Digital Tails Pet Securities</strong><br>
                Dedicated 24/7 Award Winning Service Team
            </p>
            <p class="footer-text">
                Need assistance? Our support team is here to help 24/7!
            </p>
            <div class="social-links">
                <a href="mailto:info@digitaltails.com">📧 Email</a> | 
                <a href="https://wa.me/447928239287">💬 WhatsApp</a>
            </div>
            <p class="footer-text" style="margin-top: 20px; font-size: 12px;">
                © Digital Tails 2023. All Rights Reserved.
            </p>
        </div>
    </div>
</body>
</html>
`);
// Order Delivered Email Template
exports.orderDeliveredTemplate = (0, handlebars_1.compile)(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Order Has Been Delivered - Digital Tails</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Helvetica Neue', Arial, sans-serif; 
            background-color: #f8f9fa; 
            line-height: 1.6; 
            color: #2D2D2D;
        }
        .email-container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff; 
            border-radius: 16px; 
            overflow: hidden; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header { 
            background: #10B981; 
            padding: 30px 20px; 
            text-align: center; 
            color: white;
        }
        .logo { 
            font-size: 28px; 
            font-weight: bold; 
            margin-bottom: 10px;
        }
        .tagline { 
            font-size: 16px; 
            opacity: 0.9;
        }
        .content { 
            padding: 40px 30px; 
            text-align: center;
        }
        .welcome-text { 
            font-size: 24px; 
            color: #10B981; 
            margin-bottom: 20px; 
            font-weight: bold;
        }
        .description { 
            color: #2D2D2D; 
            font-size: 16px; 
            margin-bottom: 30px; 
            line-height: 1.8;
        }
        .order-details { 
            background-color: #f8f9fa; 
            border-radius: 12px; 
            padding: 25px; 
            margin: 30px 0; 
            text-align: left;
        }
        .order-row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 15px; 
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
        }
        .order-row:last-child { 
            border-bottom: none; 
        }
        .order-label { 
            font-weight: bold; 
            color: #2D2D2D;
        }
        .order-value { 
            color: #0F2137;
        }
        .info-box { 
            background-color: #D1FAE5; 
            border-left: 4px solid #10B981; 
            padding: 20px; 
            margin: 30px 0; 
            border-radius: 8px;
        }
        .info-text { 
            color: #065F46; 
            font-size: 14px; 
            margin: 0;
        }
        .footer { 
            background-color: #f8f9fa; 
            padding: 30px; 
            text-align: center; 
            border-top: 1px solid #e9ecef;
        }
        .footer-text { 
            color: #2D2D2D; 
            font-size: 14px; 
            margin-bottom: 15px;
        }
        .social-links { 
            margin-top: 20px;
        }
        .social-links a { 
            display: inline-block; 
            margin: 0 10px; 
            color: #4CB2E2; 
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">🐾 DIGITAL TAILS</div>
            <div class="tagline">Your Order Has Been Delivered!</div>
        </div>
        
        <div class="content">
            <div class="welcome-text">Congratulations, {{customerName}}!</div>
            <p class="description">
                Your Digital Tails pet tag order has been successfully delivered!
            </p>
            
            <div class="order-details">
                <div class="order-row">
                    <span class="order-label">Order Number:</span>
                    <span class="order-value">{{orderNumber}}</span>
                </div>
                <div class="order-row">
                    <span class="order-label">Pet Name:</span>
                    <span class="order-value">{{petName}}</span>
                </div>
                <div class="order-row">
                    <span class="order-label">Quantity:</span>
                    <span class="order-value">{{quantity}}</span>
                </div>
            </div>
            
            <div class="info-box">
                <p class="info-text">
                    <strong>🎉 Next Steps:</strong><br>
                    • Scan your Digital Tails tag to activate your pet's profile<br>
                    • Set up your pet's information in your dashboard<br>
                    • Start protecting your furry friend with 24/7 monitoring<br>
                    • Your pet's safety is now in your hands!
                </p>
            </div>
            
            <p class="description">
                Thank you for choosing Digital Tails to keep your pet safe. We're here to help you 
                every step of the way. If you need any assistance setting up your tag, don't hesitate to reach out!
            </p>
        </div>
        
        <div class="footer">
            <p class="footer-text">
                <strong>Digital Tails Pet Securities</strong><br>
                Dedicated 24/7 Award Winning Service Team
            </p>
            <p class="footer-text">
                Need assistance? Our support team is here to help 24/7!
            </p>
            <div class="social-links">
                <a href="mailto:info@digitaltails.com">📧 Email</a> | 
                <a href="https://wa.me/447928239287">💬 WhatsApp</a>
            </div>
            <p class="footer-text" style="margin-top: 20px; font-size: 12px;">
                © Digital Tails 2023. All Rights Reserved.
            </p>
        </div>
    </div>
</body>
</html>
`);
