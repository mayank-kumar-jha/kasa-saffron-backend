import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import prisma from '../config/db.js';

const createCategory = asyncHandler(async (req, res) => {
  const { name, slug, description } = req.body;

  const existingCategory = await prisma.category.findUnique({ where: { slug } });
  if (existingCategory) {
    throw new ApiError(409, 'Category with this slug already exists');
  }

  const category = await prisma.category.create({
    data: { name, slug, description },
  });

  return res.status(201).json(new ApiResponse(201, category, 'Category created successfully'));
});

const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return res.status(200).json(new ApiResponse(200, categories, 'Categories fetched successfully'));
});

const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, slug, description } = req.body;

  const category = await prisma.category.update({
    where: { id },
    data: { name, slug, description },
  });

  return res.status(200).json(new ApiResponse(200, category, 'Category updated successfully'));
});

const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await prisma.category.delete({
    where: { id },
  });

  return res.status(200).json(new ApiResponse(200, null, 'Category deleted successfully'));
});

export { createCategory, getAllCategories, updateCategory, deleteCategory };
