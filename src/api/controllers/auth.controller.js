const User = require('../../models/user.model');
const { comparePassword } = require('../../utils/passwordUtils');
const { generateToken } = require('../../utils/jwtUtils');

class AuthController {
    // User Registration
    static async register(req, res) {
        try {
            const { username, email, password, role } = req.body;

            // check if user already exist
            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                return res.status(400).json({ error: 'User already exist' });
            }

            // Create new user
            const userId = await User.create({
                username,
                email,
                password,
                role: role || 'author'
            });

            if (!userId) {
                return res.status(500).json({
                    error: 'User creation failed'
                })
            }

            // Generate JWT token
            const user = await User.findByEmail(email);
            const token = generateToken(user);

            res.status(201).json({
                message: 'User registered successfully',
                userId,
                token
            });
        } catch (error) {
            res.status(500).json({ error: 'Registration failed', details: error.message });
        }
    }

    // User Login
    static async login(req, res) {
        try {
            const { email, password } = req.body;

            // Find user by email
            const user = await User.findByEmail(email);
            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Check password
            const isMatch = await comparePassword(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ error: 'Invalid Credentials' });
            }

            // Generate JWT Token
            const token = generateToken(user);

            res.json({
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (error) {
            res.status(500).json({ error: 'Login failed', details: error.message});
        }
    }
}

module.exports = AuthController;