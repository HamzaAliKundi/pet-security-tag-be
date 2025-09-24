import { compile } from 'handlebars';

export const verificationEmailTemplate = compile(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - Digital Tails</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Arial', sans-serif; 
            background-color: #f8f9fa; 
            line-height: 1.6; 
            color: #333;
        }
        .email-container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff; 
            border-radius: 12px; 
            overflow: hidden; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header { 
            background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); 
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
            color: #007bff; 
            margin-bottom: 20px; 
            font-weight: bold;
        }
        .description { 
            font-size: 16px; 
            color: #666; 
            margin-bottom: 30px; 
            line-height: 1.8;
        }
        .cta-button { 
            background: linear-gradient(135deg, #ffc107 0%, #ff8f00 100%); 
            color: #333; 
            padding: 16px 32px; 
            text-decoration: none; 
            border-radius: 50px; 
            display: inline-block; 
            font-weight: bold; 
            font-size: 16px; 
            margin: 20px 0; 
            box-shadow: 0 4px 15px rgba(255, 193, 7, 0.3);
            transition: all 0.3s ease;
        }
        .cta-button:hover { 
            transform: translateY(-2px); 
            box-shadow: 0 6px 20px rgba(255, 193, 7, 0.4);
        }
        .info-box { 
            background-color: #e3f2fd; 
            border-left: 4px solid #007bff; 
            padding: 20px; 
            margin: 30px 0; 
            border-radius: 8px;
        }
        .info-text { 
            color: #1976d2; 
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
            color: #6c757d; 
            font-size: 14px; 
            margin-bottom: 15px;
        }
        .social-links { 
            margin-top: 20px;
        }
        .social-links a { 
            display: inline-block; 
            margin: 0 10px; 
            color: #007bff; 
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
                Once verified, you'll be able to order your PetSecure Tag and start protecting your pet with 
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
                <a href="#">📧 Email</a> | 
                <a href="#">💬 WhatsApp</a> | 
                <a href="#">📞 Phone</a>
            </div>
            <p class="footer-text" style="margin-top: 20px; font-size: 12px;">
                © Digital Tails 2023. All Rights Reserved.
            </p>
        </div>
    </div>
</body>
</html>
`);

export const resetPasswordTemplate = compile(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password - Digital Tails</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Arial', sans-serif; 
            background-color: #f8f9fa; 
            line-height: 1.6; 
            color: #333;
        }
        .email-container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff; 
            border-radius: 12px; 
            overflow: hidden; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header { 
            background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); 
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
            color: #007bff; 
            margin-bottom: 20px; 
            font-weight: bold;
        }
        .description { 
            font-size: 16px; 
            color: #666; 
            margin-bottom: 30px; 
            line-height: 1.8;
        }
        .cta-button { 
            background: linear-gradient(135deg, #ffc107 0%, #ff8f00 100%); 
            color: #333; 
            padding: 16px 32px; 
            text-decoration: none; 
            border-radius: 50px; 
            display: inline-block; 
            font-weight: bold; 
            font-size: 16px; 
            margin: 20px 0; 
            box-shadow: 0 4px 15px rgba(255, 193, 7, 0.3);
            transition: all 0.3s ease;
        }
        .cta-button:hover { 
            transform: translateY(-2px); 
            box-shadow: 0 6px 20px rgba(255, 193, 7, 0.4);
        }
        .warning-box { 
            background-color: #fff3cd; 
            border-left: 4px solid #ffc107; 
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
            background-color: #e3f2fd; 
            border-left: 4px solid #007bff; 
            padding: 20px; 
            margin: 30px 0; 
            border-radius: 8px;
        }
        .security-text { 
            color: #1976d2; 
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
            color: #6c757d; 
            font-size: 14px; 
            margin-bottom: 15px;
        }
        .social-links { 
            margin-top: 20px;
        }
        .social-links a { 
            display: inline-block; 
            margin: 0 10px; 
            color: #007bff; 
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
                <a href="#">📧 Email</a> | 
                <a href="#">💬 WhatsApp</a> | 
                <a href="#">📞 Phone</a>
            </div>
            <p class="footer-text" style="margin-top: 20px; font-size: 12px;">
                © Digital Tails 2023. All Rights Reserved.
            </p>
        </div>
    </div>
</body>
</html>
`);

export const orderConfirmationTemplate = compile(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation - Digital Tails</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Arial', sans-serif; 
            background-color: #f8f9fa; 
            line-height: 1.6; 
            color: #333;
        }
        .email-container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff; 
            border-radius: 12px; 
            overflow: hidden; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header { 
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%); 
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
            color: #28a745; 
            margin-bottom: 20px; 
            font-weight: bold;
        }
        .description { 
            font-size: 16px; 
            color: #666; 
            margin-bottom: 30px; 
            line-height: 1.8;
        }
        .order-details { 
            background-color: #f8f9fa; 
            border: 2px solid #e9ecef; 
            padding: 25px; 
            margin: 30px 0; 
            border-radius: 8px;
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
            color: #28a745;
        }
        .order-label { 
            font-weight: bold; 
            color: #495057;
        }
        .order-value { 
            color: #212529;
        }
        .info-box { 
            background-color: #e3f2fd; 
            border-left: 4px solid #007bff; 
            padding: 20px; 
            margin: 30px 0; 
            border-radius: 8px;
        }
        .info-text { 
            color: #1976d2; 
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
            color: #6c757d; 
            font-size: 14px; 
            margin-bottom: 15px;
        }
        .social-links { 
            margin-top: 20px;
        }
        .social-links a { 
            display: inline-block; 
            margin: 0 10px; 
            color: #007bff; 
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
                Your PetSecure Tag order has been confirmed and is being processed. 
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
                <a href="#">📧 Email</a> | 
                <a href="#">💬 WhatsApp</a> | 
                <a href="#">📞 Phone</a>
            </div>
            <p class="footer-text" style="margin-top: 20px; font-size: 12px;">
                © Digital Tails 2023. All Rights Reserved.
            </p>
        </div>
    </div>
</body>
</html>
`);

export const subscriptionNotificationTemplate = compile(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Subscription {{action}} - Digital Tails</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Arial', sans-serif; 
            background-color: #f8f9fa; 
            line-height: 1.6; 
            color: #333;
        }
        .email-container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff; 
            border-radius: 12px; 
            overflow: hidden; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header { 
            background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); 
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
            color: #007bff; 
            margin-bottom: 20px; 
            font-weight: bold;
        }
        .description { 
            font-size: 16px; 
            color: #666; 
            margin-bottom: 30px; 
            line-height: 1.8;
        }
        .subscription-details { 
            background-color: #f8f9fa; 
            border: 2px solid #e9ecef; 
            padding: 25px; 
            margin: 30px 0; 
            border-radius: 8px;
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
            color: #007bff;
        }
        .subscription-label { 
            font-weight: bold; 
            color: #495057;
        }
        .subscription-value { 
            color: #212529;
        }
        .info-box { 
            background-color: #e3f2fd; 
            border-left: 4px solid #007bff; 
            padding: 20px; 
            margin: 30px 0; 
            border-radius: 8px;
        }
        .info-text { 
            color: #1976d2; 
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
            color: #6c757d; 
            font-size: 14px; 
            margin-bottom: 15px;
        }
        .social-links { 
            margin-top: 20px;
        }
        .social-links a { 
            display: inline-block; 
            margin: 0 10px; 
            color: #007bff; 
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
                <a href="#">📧 Email</a> | 
                <a href="#">💬 WhatsApp</a> | 
                <a href="#">📞 Phone</a>
            </div>
            <p class="footer-text" style="margin-top: 20px; font-size: 12px;">
                © Digital Tails 2023. All Rights Reserved.
            </p>
        </div>
    </div>
</body>
</html>
`);

export const qrCodeFirstScanTemplate = compile(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QR Code Activated - Digital Tails</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Arial', sans-serif; 
            background-color: #f8f9fa; 
            line-height: 1.6; 
            color: #333;
        }
        .email-container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff; 
            border-radius: 12px; 
            overflow: hidden; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header { 
            background: linear-gradient(135deg, #ffc107 0%, #ff8f00 100%); 
            padding: 30px 20px; 
            text-align: center; 
            color: #333;
        }
        .logo { 
            font-size: 28px; 
            font-weight: bold; 
            margin-bottom: 10px;
        }
        .tagline { 
            font-size: 16px; 
            opacity: 0.8;
        }
        .content { 
            padding: 40px 30px; 
            text-align: center;
        }
        .welcome-text { 
            font-size: 24px; 
            color: #ff8f00; 
            margin-bottom: 20px; 
            font-weight: bold;
        }
        .description { 
            font-size: 16px; 
            color: #666; 
            margin-bottom: 30px; 
            line-height: 1.8;
        }
        .scan-details { 
            background-color: #fff3cd; 
            border: 2px solid #ffc107; 
            padding: 25px; 
            margin: 30px 0; 
            border-radius: 8px;
            text-align: left;
        }
        .scan-row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 10px; 
            padding: 8px 0;
            border-bottom: 1px solid #ffeaa7;
        }
        .scan-row:last-child { 
            border-bottom: none; 
        }
        .scan-label { 
            font-weight: bold; 
            color: #856404;
        }
        .scan-value { 
            color: #856404;
        }
        .success-box { 
            background-color: #d4edda; 
            border-left: 4px solid #28a745; 
            padding: 20px; 
            margin: 30px 0; 
            border-radius: 8px;
        }
        .success-text { 
            color: #155724; 
            font-size: 14px; 
            margin: 0;
        }
        .info-box { 
            background-color: #e3f2fd; 
            border-left: 4px solid #007bff; 
            padding: 20px; 
            margin: 30px 0; 
            border-radius: 8px;
        }
        .info-text { 
            color: #1976d2; 
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
            color: #6c757d; 
            font-size: 14px; 
            margin-bottom: 15px;
        }
        .social-links { 
            margin-top: 20px;
        }
        .social-links a { 
            display: inline-block; 
            margin: 0 10px; 
            color: #007bff; 
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
                Your PetSecure Tag has been successfully activated! Someone has scanned your pet's QR code for the first time, 
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
                <a href="#">📧 Email</a> | 
                <a href="#">💬 WhatsApp</a> | 
                <a href="#">📞 Phone</a>
            </div>
            <p class="footer-text" style="margin-top: 20px; font-size: 12px;">
                © Digital Tails 2023. All Rights Reserved.
            </p>
        </div>
    </div>
</body>
</html>
`);

export const petFoundNotificationTemplate = compile(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pet Found Alert - Digital Tails</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Arial', sans-serif; 
            background-color: #f8f9fa; 
            line-height: 1.6; 
            color: #333;
        }
        .email-container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff; 
            border-radius: 12px; 
            overflow: hidden; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header { 
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%); 
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
            color: #28a745; 
            margin-bottom: 20px; 
            font-weight: bold;
        }
        .description { 
            font-size: 16px; 
            color: #666; 
            margin-bottom: 30px; 
            line-height: 1.8;
        }
        .location-box { 
            background-color: #d4edda; 
            border: 2px solid #28a745; 
            padding: 20px; 
            margin: 30px 0; 
            border-radius: 8px;
        }
        .location-text { 
            color: #155724; 
            font-size: 16px; 
            font-weight: bold;
        }
        .cta-button { 
            background: linear-gradient(135deg, #ffc107 0%, #ff8f00 100%); 
            color: #333; 
            padding: 16px 32px; 
            text-decoration: none; 
            border-radius: 50px; 
            display: inline-block; 
            font-weight: bold; 
            font-size: 16px; 
            margin: 20px 0; 
            box-shadow: 0 4px 15px rgba(255, 193, 7, 0.3);
            transition: all 0.3s ease;
        }
        .cta-button:hover { 
            transform: translateY(-2px); 
            box-shadow: 0 6px 20px rgba(255, 193, 7, 0.4);
        }
        .info-box { 
            background-color: #e3f2fd; 
            border-left: 4px solid #007bff; 
            padding: 20px; 
            margin: 30px 0; 
            border-radius: 8px;
        }
        .info-text { 
            color: #1976d2; 
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
            color: #6c757d; 
            font-size: 14px; 
            margin-bottom: 15px;
        }
        .social-links { 
            margin-top: 20px;
        }
        .social-links a { 
            display: inline-block; 
            margin: 0 10px; 
            color: #007bff; 
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
                Someone has found your beloved pet <strong>{{petName}}</strong> and scanned their PetSecure Tag! 
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
                Your PetSecure Tag worked perfectly! This is exactly why we're here - to ensure 
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
                <a href="#">📧 Email</a> | 
                <a href="#">💬 WhatsApp</a> | 
                <a href="#">📞 Phone</a>
            </div>
            <p class="footer-text" style="margin-top: 20px; font-size: 12px;">
                © Digital Tails 2023. All Rights Reserved.
            </p>
        </div>
    </div>
</body>
</html>
`);
