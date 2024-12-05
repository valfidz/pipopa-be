const CategoryModel = require('../../models/category.model');

class CategoryController {
    async create (req, res) {
        try {
            const name = req.body.name;

            const result = await CategoryModel.createCategory(name);

            return res.status(201).json({ message: 'Category has been added', result })
        } catch (error) {
            console.error('Errror creating category', error);
            return res.status(500).json({ message: 'Error creating category' });
        }
    }

    async getAllCategories (req, res) {
        try {
            const result = await CategoryModel.getCategories();

            return res.status(200).json({ message: 'Fetch categories success', result });
        } catch (error) {
            console.error('Error fetching categories', error);
            return res.status(500).json({ message: 'Error fetching categories' });
        }
    }

    async getCategory (req, res) {
        try {
            const categoryId = parseInt(req.params.id);

            const result = await CategoryModel.getCategory(categoryId);

            return res.status(200).json({ message: 'Fetch category success', result });
        } catch (error) {
            console.error('Error fetching category', error);
            return res.status(500).json({ message: 'Error fetching category' });
        }
    }

    async updateCategory (req, res) {
        try {
            const categoryId = parseInt(req.params.id);
            const name = req.body.name;

            const result = await CategoryModel.updateCategory(categoryId, name);

            return res.status(201).json({ message: 'Update category success', result });
        } catch (error) {
            console.error('Update category failed', error);
            return res.status(500).json({ message: 'Update category failed' })
        }
    }

    async deleteCategory (req, res) {
        try {
            const categoryId = parseInt(req.params.id);

            const result = await CategoryModel.deleteCategory(categoryId);

            return res.status(200).json({ message: 'Delete category success', result });
        } catch (error) {
            console.error('Delete catogry failed', error);
            return res.status(500).json({ message: 'Delete category failed' });
        }
    }
}

module.exports = CategoryController;