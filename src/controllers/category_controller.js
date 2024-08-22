// controllers/categoryController.js
const {
  getSingleCategory,
  getAllCategories,
  deleteCategory,
  createCategory,
  updateCategory,
} = require("../services/category_service");

const create = async (req, res, next) => {
  const { title } = req.body;
  console.log(title)
  try {
    const result = await createCategory(title);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  const categoryId = req.params.id;
  const title = req.body.title;

  try {
    const result = await updateCategory(categoryId, title);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const deleteCategoryController = async (req, res, next) => {
  const categoryId = req.params.id;
  try {
    const result = await deleteCategory(categoryId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getAllCategoriesController = async (req, res, next) => {
  try {
    const result = await getAllCategories();
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getSingleCategoryController = async (req, res, next) => {
  const id = req.params.id;
  // console.log(id)
  try {
    const result = await getSingleCategory(id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  create,
  update,
  deleteCategoryController,
  getAllCategoriesController,
  getSingleCategoryController,
};
