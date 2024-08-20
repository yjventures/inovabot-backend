// controllers/categoryController.js
const {
  getSingleCategory,
  getAllCategories,
  deleteCategory,
  createCategory,
  updateCategory,
} = require("../services/category_service");

const createCategory = async (req, res) => {
  const { title } = req.body;
  try {
    const result = await createCategory(title);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res) => {
  const categoryId = req.params.id;
  const reqBody = req.body;

  try {
    const result = await updateCategory(categoryId, reqBody);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res) => {
  const categoryId = req.params.id;
  try {
    const result = await deleteCategory(categoryId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getAllCategories = async (req, res) => {
  try {
    const lang = req.headers["accept-language"];
    const result = await getAllCategories(lang);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getSingleCategory = async (req, res) => {
  const id = req.params.id;
  try {
    const result = await getSingleCategory(id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCategory,
  updateCategory,
  deleteCategory,
  getAllCategories,
  getSingleCategory,
};
