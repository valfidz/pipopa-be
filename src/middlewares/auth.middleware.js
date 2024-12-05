const jwt = require('jsonwebtoken');
const { verifyToken } = require('../utils/jwtUtils');
const User = require('../models/user.model');
const { db } = require('../config/database');

const JWT_SECRET =  process.env.JWT_SECRET || 'pass4l0g1n!!@@';

// Middleware to check if user is authenticated
const isAuthenticated = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                error: 'No token. Authorization denied'
            });
        }

        // verify token
        const decoded = verifyToken(token);
        
        if (!decoded) {
            return res.status(401).json({
                error: 'Token is not valid'
            });
        }

        // check if user is still exist
        const user = await User.findByEmail(decoded.email);
        if (!user) {
            return res.status(401).json({
                error: 'User no longer exist'
            });
        }

        // Attach user to request object
        req.user = {
            id: user.id,
            username: user.usernam,
            email: user.email,
            role: user.role
        }
        
        next();
    } catch (error) {
        console.error("Authentication error: ", error);
        res.status(500).json({
            error: 'Authentication failed',
            details: error.message
        })
    }
}

// Middleware to check user authorization
const isAuthorized = (requiredRoles = []) => {
    return async (req, res, next) => {
        try {
            // First, ensure user is authenticated
            if (!req.user) {
                return res.status(401).json({
                    error: 'Authentication required before authorization'
                });
            }

            // if no roles is specified, default to admin-only
            const roles = requiredRoles.length > 0 ? requiredRoles : ['admin'];

            // check if user's role matches any of the required roles
            if (!roles.includes(req.user.role)) {
                return res.status(403).json({
                    error: 'Unauthorized. Insufficient permissions',
                    // requiredRoles: roles,
                    // userRole: req.user.role
                });
            }

            next();
        } catch (error) {
            res.status(500).json({
                error: 'Authorization check failed',
                details: error.message
            })
        }
    };
};

// Middleware to check post ownership for authors
const isPostOwner = async (req, res, next) => {
    try {
        // Ensure user is authenticated first
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required'
            });
        }

        // for admin, always allow access
        if (req.user.role === admin) {
            return next();
        }

        // for authors, check if they own the post
        const postId = req.params.postId || req.body.postId

        if (!postId) {
            return res.status(400).json({
                error: 'Post ID is required'
            });
        }

        // fetch post and check ownership
        const connection = await db.getConnection();
        try {
            const [posts] = await connection.execute(
                'SELECT author FROM posts WHERE id = ?',
                [postId]
            );

            if (posts.length === 0) {
                return res.status(404).json({
                    error: 'Post not found'
                })
            }

            if (posts[0].author != req.user.username) {
                return res.status(403).json({
                    error: 'You are not authorized to modify this post'
                });
            }

            next();
        } finally {
            connection.release();
        }
    } catch (error) {
        res.status(500).json({
            error: 'Post ownership check failed',
            details: error.message
        });
    }
};

// Middleware to check user roles
// const isAuthorized = (roles) => {
//     return (req, res, next) => {
//         if (!req.user) {
//             return res.status(401).json({ error: 'Authentication required' });
//         }

//         if (!roles.includes(req.user.role)) {
//             return res.status(403).json({ error: 'Unauthorized access' });
//         }

//         next()
//     }
// }

module.exports = {
    isAuthenticated,
    isAuthorized,
    isPostOwner
}