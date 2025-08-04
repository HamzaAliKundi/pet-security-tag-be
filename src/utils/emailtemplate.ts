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
