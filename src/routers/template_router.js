const express = require("express");
const { body } = require("express-validator");
const apiEnum = require("../utils/api_constant");
const templateController = require("../controllers/template_controller");

const router = express.Router();

// ? API to Create a new template
router.post(apiEnum.CREATE,
  [
    body("name", "Name is required"),
    body("category", "Category is required"),
  ],
  templateController.create);

// ? API to Get all templates using querystring
router.get(apiEnum.GET_ALL, templateController.getAllTemplates);

// ? API to Get a template by ID
router.get(apiEnum.GET_BY_ID, templateController.getTemplateByID);

// ? API to Update a template by ID
router.put(apiEnum.UPDATE_BY_ID, templateController.updateTemplateByID);

// ? API to Delete a template by ID
router.delete(apiEnum.DELETE_BY_ID, templateController.deleteTemplateByID);

module.exports = router;
