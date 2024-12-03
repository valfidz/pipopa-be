const User = require('../../models/user.model');

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

    // Get user by email
    static async getUserByEmail(req, res) {
        try {
            if (!req.params.email) {
                return res.status(400).json({ message: 'Email is required' });
            }

            const user = await User.findByEmail(req.params.email);

            if (!user) {
                return res.status(404).json({ message: 'User not found' })
            }

            res.status(200).json({user});
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Get user by username
    static async getUserByUsername(req, res) {
        try {
            if (!req.params.username) {
                return res.status(400).json({ message: 'Username is required' });
            }

            const user = await User.findByUsername(req.params.username);

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.status(200).json(user);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Update user
    static async updateUser(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({ message: 'ID is required' });
            }

            await User.update(id, req.body);

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