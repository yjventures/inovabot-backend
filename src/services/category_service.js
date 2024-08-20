// services/categoryService.js
const category = require("../models/category");
const { createError } = require("../common/error");

const createCategory = async (title) => {
  try {
    const existingCategory = await category.findOne({ category_title: title });
    if (existingCategory) {
      throw createError(401, "This Category already exists");
    }

    const newCategory = await category.create({
      category_title: title,
    });

    return {
      newCategory,
    };
  } catch (error) {
    throw error;
  }
};

const updateCategory = async (id, updateData) => {
  try {
    const updatedCategory = await category.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    if (!updatedCategory) {
      throw createError(401, "Category not found");
    }

    return {
      updatedCategory,
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

const getAllCategories = async (lang) => {
  try {
    category.setDefaultLanguage(lang);
    const categories = await category.find();
    return { categories };
  } catch (error) {
    throw error;
  }
};

const getSingleCategory = async (id) => {
  try {
    const category = await category.findById(id).lean().exec();
    if (!category) {
      return [];
    }

    return { category };
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
