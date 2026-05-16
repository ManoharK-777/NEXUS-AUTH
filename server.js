require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Mock database
const users = [];

// Validation Endpoint
app.post('/api/validate', (req, res) => {
    const { field, value } = req.body;
    
    if (field === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = emailRegex.test(value);
        const exists = users.some(u => u.email === value);
        
        if (!isValid) return res.json({ valid: false, message: 'INVALID FORMAT DETECTED' });
        if (exists) return res.json({ valid: false, message: 'IDENTITY ALREADY REGISTERED' });
        
        return res.json({ valid: true, message: 'CLEARED' });
    }
    
    if (field === 'username') {
        if (value.length < 4) return res.json({ valid: false, message: 'INSUFFICIENT LENGTH' });
        const exists = users.some(u => u.username === value);
        if (exists) return res.json({ valid: false, message: 'ALIAS UNAVAILABLE' });
        
        return res.json({ valid: true, message: 'CLEARED' });
    }
    
    res.json({ valid: true });
});

const nodemailer = require('nodemailer');

// Authentication/Registration Endpoint
app.post('/api/auth', async (req, res) => {
    const { username, email, password, phone, pin } = req.body;
    
    // Server-side validation
    if (!username || !email || !password || !phone || !pin) {
        return res.status(400).json({ success: false, message: 'INCOMPLETE DATA STREAM' });
    }
    
    // Store user (Mock)
    users.push({ username, email, phone, pin });
    
    try {
        // Configure Gmail Transporter
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS // User must provide App Password
            }
        });

        const token = `NEXUS-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        // Send Email (Non-blocking background task)
        transporter.sendMail({
            from: `"NEXUS IDENTITY ENGINE" <${process.env.EMAIL_USER}>`,
            to: email, 
            subject: "IDENTITY CONFIRMED - NEXUS AUTH SYSTEM",
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #050505; color: #00F5FF; padding: 40px; border: 1px solid #00F5FF; border-radius: 10px;">
                    <h1 style="color: #9D4DFF; border-bottom: 2px solid #00F5FF; padding-bottom: 10px; text-transform: uppercase; letter-spacing: 5px;">Identity Confirmed</h1>
                    <p style="font-size: 18px; color: #FFFFFF;">System synchronization complete. Your credentials have been registered in the secure vault.</p>
                    <div style="background: rgba(0, 245, 255, 0.05); padding: 20px; border-radius: 5px; margin-top: 30px;">
                        <p style="margin: 10px 0;"><strong>ALIAS:</strong> <span style="color: #FFFFFF;">${username}</span></p>
                        <p style="margin: 10px 0;"><strong>NODE:</strong> <span style="color: #FFFFFF;">${email}</span></p>
                        <p style="margin: 10px 0;"><strong>TOKEN:</strong> <span style="color: #9D4DFF; letter-spacing: 2px; font-weight: bold;">${token}</span></p>
                    </div>
                    <p style="color: #666; margin-top: 40px; font-size: 12px;">This is an automated transmission. Zero knowledge proof validated.</p>
                </div>
            `,
        }).then(info => console.log("Background Transmission Successful:", info.messageId))
          .catch(err => console.error("Background Transmission Error:", err));

        // Respond immediately to the frontend
        res.json({ 
            success: true, 
            message: 'NEXUS AUTHENTICATION SUCCESSFUL',
            token: token
        });

    } catch (err) {
        console.error("Transmission Error:", err);
        res.status(500).json({ success: false, message: 'EMAIL TRANSMISSION FAILURE' });
    }
});

app.listen(PORT, () => {
    console.log(`[SYSTEM] NEXUS AUTH TERMINAL ACTIVE ON PORT ${PORT}`);
});
