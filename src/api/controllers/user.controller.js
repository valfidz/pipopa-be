const User = require('../../models/user.model');
const { comparePassword } = require('../../utils/passwordUtils');

class UserController {
    // Create user
    static async createUser(req, res) {
        try {
            if (!req.body.username) {
                return res.status(400).json({ message: 'Username is required' });
            }

            if (!req.body.email) {
                return res.status(400).json({ message: 'Email is required' });
            }

            if (!req.body.password) {
                return res.status(400).json({ message: 'Password is required' });
            }

            if (!req.body.role) {
                return res.status(400).json({ message: 'Role is required' });
            }

            const userId = await User.create(req.body);

            res.status(201).json({ message: 'User created', userId });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Get all user
    static async getAllUser(req, res) {
        try {
            const users = await User.findAllUser();

            const result = users.map(user => ({
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }));

            res.status(200).json({ 
                message: 'Get all user success',
                result
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Get user by id
    static async getUserById(req, res) {
        try {
            const userId = req.params.id ? req.params.id : null;

            if (!userId) {
                return res.status(400).json({ message: 'User ID is required' });
            }

            const user = await User.findById(userId);

            res.status(200).json({
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Get user by email or username
    static async getUser(req, res) {
        try {
            const email = req.body.email;
            const username = req.body.username;
            let user;

            if (email) {
                user = await User.findByEmail(email);
            }

            if (username) {
                user = await User.findByUsername(username);
            }

            if (!email && !username) {
                return res.status(400).json({ message: 'Required parameter is missing' });
            }

            res.status(200).json({
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Get user by email
    // static async getUserByEmail(req, res) {
    //     try {
    //         if (!req.body.email) {
    //             return res.status(400).json({ message: 'Email is required' });
    //         }

    //         const user = await User.findByEmail(req.body.email);

    //         if (!user) {
    //             return res.status(404).json({ message: 'User not found' })
    //         }

    //         res.status(200).json({
    //             id: user.id,
    //             username: user.username,
    //             email: user.email,
    //             role: user.role
    //         });
    //     } catch (error) {
    //         res.status(500).json({ error: error.message });
    //     }
    // }

    // Get user by username
    // static async getUserByUsername(req, res) {
    //     try {
    //         if (!req.body.username) {
    //             return res.status(400).json({ message: 'Username is required' });
    //         }

    //         const user = await User.findByUsername(req.body.username);

    //         if (!user) {
    //             return res.status(404).json({ message: 'User not found' });
    //         }

    //         res.status(200).json({
    //             id: user.id,
    //             username: user.username,
    //             email: user.email,
    //             role: user.role
    //         });
    //     } catch (error) {
    //         res.status(500).json({ error: error.message });
    //     }
    // }

    // Update user
    static async updateUser(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({ message: 'ID is required' });
            }

            const username = req.body.username ? req.body.username : "";
            const email = req.body.email ? req.body.email : "";
            const updateField = {
                username,
                email
            }

            // await User.update(id, req.body);
            await User.update(id, updateField);

            res.status(200).json({ message: 'User updated' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Update password
    static async updatePassword(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({ message: 'ID is required' });
            }

            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const oldpass = req.body.oldpass ? req.body.oldpass : "";
            if (!oldpass) {
                return res.status(400).json({ message: 'Old password is required' })
            }

            const check_oldpass = await comparePassword(oldpass, user.password);
            if(!check_oldpass) {
                return res.status(401).json({ message: 'Old password is not match' })
            }

            const newpass = req.body.newpass ? req.body.newpass : "";

            if (!newpass) {
                return res.status(400).json({ message: 'Password is missing' });
            }

            await User.updatePassword(id, newpass);

            res.status(200).json({ message: 'User updated' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Delete user
    static async deleteUser(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({ message: 'ID is required' });
            }

            await User.delete(id);

            res.status(200).json({ message: 'User deleted' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = UserController;