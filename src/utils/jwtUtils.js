const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'pass4l0g1n!!@@';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h';

// Generate JWT Token
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRATION }
    )
}

// Verify JWT Token
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET)
    } catch (error) {
        return null
    }
}

module.exports = {
    generateToken,
    verifyToken
}