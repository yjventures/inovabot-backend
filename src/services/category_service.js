// services/categoryService.js
const category = require("../models/category");
const { createError } = require("../common/error");

const createCategory = async (title) => {
  try {
    const existingCategory = await category.findOne({ title: title });
    if (existingCategory) {
      throw createError(401, "This Category already exists");
    }

    const newCategory = await category.create({
      title: title,
    });

    return {
      data: newCategory,
    };
  } catch (error) {
    throw error;
  }
};

const updateCategory = async (id, title) => {
  try {
    const updatedCategory = await category.findByIdAndUpdate(id, {title: title}, {
      new: true,
    });
    if (!updatedCategory) {
      throw createError(401, "Category not found");
    }

    return {
      data:updatedCategory,
      message: "The category has been updated successfully",
    };
  } catch (error) {
    throw error;
  }
};

const deleteCategory = async (id) => {
  try {
    const deletedCategory = await category.findByIdAndDelete(id);
    return { deletedCategory, message: "The Category has been deleted" };
  } catch (error) {
    throw error;
  }
};

const getAllCategories = async () => {
  try {
    const categories = await category.find();
    return { categories };
  } catch (error) {
    throw error;
  }
};

const getSingleCategory = async (id) => {
  // console.log("id", id);
  try {
    const categoryData = await category.findById(id);
    // console.log(categoryData);
    if (!categoryData) {
      throw createError(404, "Category not found");
    }
    return { data: categoryData };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getSingleCategory,
  getAllCategories,
  deleteCategory,
  createCategory,
  updateCategory,
};
