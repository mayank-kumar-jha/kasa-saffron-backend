import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import prisma from '../config/db.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { getCache, setCache, clearCachePrefix } from '../utils/cache.util.js';

const createProduct = asyncHandler(async (req, res) => {
  const { name, tagline, description, notes, ingredients, spanishName, price500g, price1kg, stock, sku, categoryId, status, image } = req.body;

  let finalImage = image || "";
  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    const uploadResult = await uploadOnCloudinary(req.files[0].path);
    if (uploadResult?.secure_url) {
      finalImage = uploadResult.secure_url;
    }
  }

  const product = await prisma.product.create({
    data: {
      name: name || {},
      tagline: tagline || {},
      description: description || {},
      notes: notes || {},
      ingredients: ingredients || {},
      spanishName: spanishName || "",
      price500g: parseFloat(price500g || 0),
      price1kg: parseFloat(price1kg || 0),
      stock: parseInt(stock || 0, 10),
      sku,
      categoryId,
      status: status || 'ACTIVE',
      image: finalImage,
    },
  });

  clearCachePrefix('products_');
  return res.status(201).json(new ApiResponse(201, product, 'Product created successfully'));
});

const getAllProducts = asyncHandler(async (req, res) => {
  const { category, search, page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const cacheKey = `products_all_${category || 'all'}_${search || 'none'}_${page}_${limit}`;
  const cached = getCache(cacheKey);
  if (cached) return res.status(200).json(new ApiResponse(200, cached, 'Products fetched successfully'));

  const where = {
    deletedAt: null,
    ...(category && { category: { slug: category } }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const products = await prisma.product.findMany({
    where,
    skip,
    take: parseInt(limit),
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  });

  const total = await prisma.product.count({ where });

  const result = { products, total, page, limit };
  setCache(cacheKey, result, 300);

  // Instruct Vercel Edge Network to cache this API response for 5 minutes globally
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=59');
  return res.status(200).json(new ApiResponse(200, result, 'Products fetched successfully'));
});

const getProductBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const cacheKey = `products_slug_${slug}`;
  const cached = getCache(cacheKey);
  if (cached) return res.status(200).json(new ApiResponse(200, cached, 'Product fetched successfully'));

  const product = await prisma.product.findFirst({
    where: { slug, deletedAt: null },
    include: { category: true, reviews: true },
  });

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  setCache(cacheKey, product, 300);
  // Instruct Vercel Edge Network to cache this API response for 5 minutes globally
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=59');
  return res.status(200).json(new ApiResponse(200, product, 'Product fetched successfully'));
});

const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, tagline, description, notes, ingredients, spanishName, price500g, price1kg, stock, sku, categoryId, status, image } = req.body;

  let imageUrls = [];
  if (req.files && Array.isArray(req.files)) {
    for (const file of req.files) {
      const uploadResult = await uploadOnCloudinary(file.path);
      if (uploadResult?.secure_url) {
        imageUrls.push(uploadResult.secure_url);
      }
    }
  }

  const productToUpdate = await prisma.product.findFirst({ where: { id } });
  if (!productToUpdate) {
    throw new ApiError(404, 'Product not found');
  }

  // Build only the fields that are explicitly provided
  const dataToUpdate = {};
  if (name !== undefined) dataToUpdate.name = name;
  if (tagline !== undefined) dataToUpdate.tagline = tagline;
  if (description !== undefined) dataToUpdate.description = description;
  if (notes !== undefined) dataToUpdate.notes = notes;
  if (ingredients !== undefined) dataToUpdate.ingredients = ingredients;
  if (spanishName !== undefined) dataToUpdate.spanishName = spanishName;
  if (price500g !== undefined) dataToUpdate.price500g = parseFloat(price500g);
  if (price1kg !== undefined) dataToUpdate.price1kg = parseFloat(price1kg);
  if (stock !== undefined) dataToUpdate.stock = parseInt(stock, 10);
  if (sku !== undefined) dataToUpdate.sku = sku;
  if (categoryId !== undefined) dataToUpdate.categoryId = categoryId;
  if (status !== undefined) dataToUpdate.status = status;
  if (image !== undefined || imageUrls.length > 0) {
    dataToUpdate.image = imageUrls.length > 0 ? imageUrls[0] : image;
  }

  const product = await prisma.product.update({
    where: { id },
    data: dataToUpdate,
  });

  clearCachePrefix('products_');
  return res.status(200).json(new ApiResponse(200, product, 'Product updated successfully'));
});

const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Soft delete
  await prisma.product.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  clearCachePrefix('products_');
  return res.status(200).json(new ApiResponse(200, null, 'Product deleted successfully'));
});

export { createProduct, getAllProducts, getProductBySlug, updateProduct, deleteProduct };
