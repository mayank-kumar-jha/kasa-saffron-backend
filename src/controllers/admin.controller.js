import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import prisma from '../config/db.js';
import bcrypt from 'bcryptjs';
import { getCache, setCache, clearCachePrefix } from '../utils/cache.util.js';

const getDashboardStats = asyncHandler(async (req, res) => {
  // Aggregate sales
  const totalRevenueResult = await prisma.order.aggregate({
    _sum: { totalAmount: true },
    where: { status: { in: ['PAID', 'DELIVERED'] } },
  });
  const totalRevenue = totalRevenueResult._sum.totalAmount || 0;

  // Order Counts
  const totalOrders = await prisma.order.count({ where: { status: { in: ['PAID', 'DELIVERED'] } } });
  const pendingOrders = await prisma.order.count({ where: { status: 'PENDING' } });
  const completedOrders = await prisma.order.count({ where: { status: 'DELIVERED' } });

  // Customers
  const totalCustomers = await prisma.user.count({ where: { role: 'CUSTOMER' } });

  // Recent Orders
  const recentOrders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true, email: true } } },
  });

  // Calculate Product Sales for Bar Chart
  const orderItems = await prisma.orderItem.findMany({
    where: { order: { status: { in: ['PAID', 'DELIVERED'] } } },
    include: { product: true }
  });

  const productSalesMap = {};
  orderItems.forEach(item => {
    if (!item.product) return;
    const prodId = item.productId;
    // Extract English name or default
    const nameStr = typeof item.product.name === 'object' && item.product.name !== null ? (item.product.name.en || 'Unknown') : (item.product.name || 'Unknown');
    if (!productSalesMap[prodId]) {
      productSalesMap[prodId] = { name: nameStr, shortName: nameStr.split(' ')[0] || nameStr, units: 0, revenue: 0 };
    }
    productSalesMap[prodId].units += item.quantity;
    productSalesMap[prodId].revenue += item.price * item.quantity;
  });
  const productSales = Object.values(productSalesMap).sort((a, b) => b.units - a.units).slice(0, 10);

  // Calculate Monthly Data for Line Chart
  const allOrders = await prisma.order.findMany({
    where: { status: { in: ['PAID', 'DELIVERED'] } },
    select: { createdAt: true, totalAmount: true },
    orderBy: { createdAt: 'asc' }
  });

  const monthlyMap = {};
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  allOrders.forEach(order => {
    const date = new Date(order.createdAt);
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = { month: `${monthNames[date.getMonth()]} ${date.getFullYear()}`, orders: 0, revenue: 0, sortKey: date.getTime() };
    }
    monthlyMap[monthKey].orders += 1;
    monthlyMap[monthKey].revenue += order.totalAmount;
  });
  const monthlyData = Object.values(monthlyMap).sort((a, b) => a.sortKey - b.sortKey).slice(-12).map(m => ({ month: m.month, orders: m.orders, revenue: m.revenue }));

  // Fallback for empty data
  if (productSales.length === 0) {
    productSales.push({ name: 'No Data', shortName: 'N/A', units: 0, revenue: 0 });
  }
  if (monthlyData.length === 0) {
    monthlyData.push({ month: monthNames[new Date().getMonth()], orders: 0, revenue: 0 });
  }

  return res.status(200).json(new ApiResponse(200, {
    totalRevenue,
    totalOrders,
    pendingOrders,
    completedOrders,
    totalCustomers,
    recentOrders,
    productSales,
    monthlyData
  }, 'Dashboard stats fetched'));
});

const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true, email: true } },
      orderItems: { include: { product: true } }
    }
  });
  return res.status(200).json(new ApiResponse(200, orders, 'All orders fetched'));
});

// ─── Events ──────────────────────────────────────────────────────────────────

const getEvents = asyncHandler(async (req, res) => {
  const cached = getCache('admin_events');
  if (cached) return res.status(200).json(new ApiResponse(200, cached, 'Events fetched'));

  const events = await prisma.event.findMany({ orderBy: { createdAt: 'desc' } });
  // Transform to match frontend expected format (nested objects for multilingual)
  const formattedEvents = events.map(e => ({
    id: e.id,
    title: { en: e.titleEn, es: e.titleEs, cat: e.titleCat },
    date: e.date,
    time: e.time,
    location: e.location,
    description: { en: e.descEn, es: e.descEs, cat: e.descCat },
    image: e.image,
  }));
  setCache('admin_events', formattedEvents, 300);
  return res.status(200).json(new ApiResponse(200, formattedEvents, 'Events fetched'));
});

const createEvent = asyncHandler(async (req, res) => {
  const { title, date, time, location, description, image } = req.body;
  const event = await prisma.event.create({
    data: {
      titleEn: title?.en || '', titleEs: title?.es || '', titleCat: title?.cat || '',
      descEn: description?.en || '', descEs: description?.es || '', descCat: description?.cat || '',
      date, time: time || '', location: location || '', image: image || ''
    }
  });
  const formattedEvent = {
    id: event.id, title, date, time: event.time, location: event.location, description, image: event.image
  };
  clearCachePrefix('admin_events');
  return res.status(201).json(new ApiResponse(201, formattedEvent, 'Event created'));
});

const updateEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, date, time, location, description, image } = req.body;
  const event = await prisma.event.update({
    where: { id },
    data: {
      titleEn: title?.en || '', titleEs: title?.es || '', titleCat: title?.cat || '',
      descEn: description?.en || '', descEs: description?.es || '', descCat: description?.cat || '',
      date, time: time || '', location: location || '', image: image || ''
    }
  });
  const formattedEvent = {
    id: event.id, title, date, time: event.time, location: event.location, description, image: event.image
  };
  clearCachePrefix('admin_events');
  return res.status(200).json(new ApiResponse(200, formattedEvent, 'Event updated'));
});

const deleteEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.event.delete({ where: { id } });
  clearCachePrefix('admin_events');
  return res.status(200).json(new ApiResponse(200, null, 'Event deleted'));
});

// ─── Gallery ─────────────────────────────────────────────────────────────────

const getGallery = asyncHandler(async (req, res) => {
  const cached = getCache('admin_gallery');
  if (cached) return res.status(200).json(new ApiResponse(200, cached, 'Gallery fetched'));

  const images = await prisma.galleryImage.findMany({ orderBy: { sortOrder: 'asc' } });
  const formatted = images.map(img => ({
    id: img.id,
    name: { en: img.nameEn, es: img.nameEs, cat: img.nameCat },
    tagline: { en: img.taglineEn, es: img.taglineEs, cat: img.taglineCat },
    image: img.imageUrl,
  }));
  setCache('admin_gallery', formatted, 300);
  return res.status(200).json(new ApiResponse(200, formatted, 'Gallery fetched'));
});

const addGalleryImage = asyncHandler(async (req, res) => {
  const { name, tagline, image } = req.body;
  const newImg = await prisma.galleryImage.create({
    data: {
      nameEn: name?.en || '', nameEs: name?.es || '', nameCat: name?.cat || '',
      taglineEn: tagline?.en || '', taglineEs: tagline?.es || '', taglineCat: tagline?.cat || '',
      imageUrl: image || '',
    }
  });
  const formatted = {
    id: newImg.id, name, tagline, image: newImg.imageUrl
  };
  clearCachePrefix('admin_gallery');
  return res.status(201).json(new ApiResponse(201, formatted, 'Gallery image added'));
});

const updateGalleryImage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, tagline, image } = req.body;
  const updated = await prisma.galleryImage.updateMany({
    where: { id },
    data: {
      nameEn: name?.en || '', nameEs: name?.es || '', nameCat: name?.cat || '',
      taglineEn: tagline?.en || '', taglineEs: tagline?.es || '', taglineCat: tagline?.cat || '',
      imageUrl: image || '',
    }
  });
  const formatted = { id, name, tagline, image };
  clearCachePrefix('admin_gallery');
  return res.status(200).json(new ApiResponse(200, formatted, 'Gallery image updated'));
});

const deleteGalleryImage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.galleryImage.deleteMany({ where: { id } });
  clearCachePrefix('admin_gallery');
  return res.status(200).json(new ApiResponse(200, null, 'Gallery image deleted'));
});

// ─── CMS Content ─────────────────────────────────────────────────────────────

const getContent = asyncHandler(async (req, res) => {
  const { section } = req.params;
  
  const cacheKey = `admin_content_${section}`;
  const cached = getCache(cacheKey);
  if (cached) return res.status(200).json(new ApiResponse(200, cached, 'Content fetched'));

  const items = await prisma.siteContent.findMany({ where: { section } });

  // Reconstruct nested JSON format matching frontend:
  // e.g., { intro1: { en: "...", es: "..." }, feat1Title: { en: "..." } }
  const data = {};
  for (const item of items) {
    if (!data[item.key]) data[item.key] = {};
    data[item.key][item.lang] = item.value;
  }

  const result = Object.keys(data).length > 0 ? data : null;
  setCache(cacheKey, result, 300);
  return res.status(200).json(new ApiResponse(200, result, 'Content fetched'));
});

const updateContent = asyncHandler(async (req, res) => {
  const { section } = req.params;
  const contentData = req.body; // e.g. { intro1: { en: "...", es: "..." } }

  const promises = [];

  // Upsert all keys
  for (const [key, langs] of Object.entries(contentData)) {
    if (typeof langs === 'object') {
      for (const [lang, value] of Object.entries(langs)) {
        promises.push(prisma.siteContent.upsert({
          where: { section_lang_key: { section, lang, key } },
          update: { value },
          create: { section, lang, key, value }
        }));
      }
    } else {
      promises.push(prisma.siteContent.upsert({
        where: { section_lang_key: { section, lang: 'en', key } },
        update: { value: String(langs) },
        create: { section, lang: 'en', key, value: String(langs) }
      }));
    }
  }

  await Promise.all(promises);
  clearCachePrefix(`admin_content_${section}`);

  return res.status(200).json(new ApiResponse(200, null, 'Content updated'));
});

const updateAdminCredentials = asyncHandler(async (req, res) => {
  const { currentPassword, newEmail, newPassword } = req.body;
  const userId = req.user.id;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return res.status(404).json(new ApiResponse(404, null, 'User not found'));
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isPasswordValid) {
    return res.status(400).json(new ApiResponse(400, null, 'Invalid current password'));
  }

  const dataToUpdate = {};
  if (newEmail) dataToUpdate.email = newEmail;
  if (newPassword) dataToUpdate.password = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: dataToUpdate
  });

  return res.status(200).json(new ApiResponse(200, null, 'Credentials updated successfully'));
});

// ─── Mass Mailing / Broadcasts ───────────────────────────────────────────────

const getUsers = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'desc' }
  });
  return res.status(200).json(new ApiResponse(200, users, 'Users fetched'));
});

import { sendCustomEmail } from '../utils/email.js';

const sendBroadcast = asyncHandler(async (req, res) => {
  const { subject, body, userIds } = req.body;
  let targetUserIds = [];
  
  if (!subject || !body || !userIds) {
    return res.status(400).json(new ApiResponse(400, null, 'Subject, body, and userIds are required.'));
  }

  // Parse userIds (could be a JSON string array or the string 'ALL')
  let parsedIds = userIds;
  try {
    if (typeof userIds === 'string' && userIds !== 'ALL') {
      parsedIds = JSON.parse(userIds);
    }
  } catch (e) {
    return res.status(400).json(new ApiResponse(400, null, 'Invalid userIds format.'));
  }

  if (parsedIds === 'ALL') {
    const allUsers = await prisma.user.findMany({ select: { id: true } });
    targetUserIds = allUsers.map(u => u.id);
  } else if (Array.isArray(parsedIds)) {
    targetUserIds = parsedIds;
  }

  if (targetUserIds.length === 0) {
    return res.status(400).json(new ApiResponse(400, null, 'No valid users selected.'));
  }

  // Fetch target users
  const targetUsers = await prisma.user.findMany({
    where: { id: { in: targetUserIds } },
    select: { id: true, email: true, name: true }
  });

  // Create Campaign
  const campaign = await prisma.emailCampaign.create({
    data: { subject, body }
  });

  // Format attachments for nodemailer
  const attachments = (req.files || []).map(file => ({
    filename: file.originalname,
    path: file.path
  }));

  const logsData = [];
  for (const user of targetUsers) {
    const result = await sendCustomEmail(user.email, subject, body, attachments);
    logsData.push({
      campaignId: campaign.id,
      userId: user.id,
      email: user.email,
      status: result.success ? 'SENT' : 'FAILED',
      errorMsg: result.success ? null : String(result.error || 'Unknown error'),
    });
  }

  // Save logs
  await prisma.emailLog.createMany({ data: logsData });
  
  // Cleanup temp files
  const fs = await import('fs');
  for (const file of req.files || []) {
    fs.unlink(file.path, () => {});
  }

  // On Vercel Serverless, we MUST send the response AFTER processing finishes,
  // otherwise the process is frozen and background tasks are killed immediately.
  res.status(200).json(new ApiResponse(200, { campaignId: campaign.id, count: targetUsers.length }, 'Broadcast finished'));
});

const getBroadcastHistory = asyncHandler(async (req, res) => {
  const campaigns = await prisma.emailCampaign.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      logs: {
        select: { status: true, errorMsg: true, user: { select: { name: true, email: true } } }
      }
    }
  });

  const formatted = campaigns.map(c => {
    const sentCount = c.logs.filter(l => l.status === 'SENT').length;
    const failedCount = c.logs.filter(l => l.status === 'FAILED').length;
    return {
      id: c.id,
      subject: c.subject,
      body: c.body,
      createdAt: c.createdAt,
      sentCount,
      failedCount,
      logs: c.logs
    };
  });

  return res.status(200).json(new ApiResponse(200, formatted, 'Broadcast history fetched'));
});

export {
  getDashboardStats, getAllOrders,
  getEvents, createEvent, updateEvent, deleteEvent,
  getGallery, addGalleryImage, updateGalleryImage, deleteGalleryImage,
  getContent, updateContent,
  updateAdminCredentials,
  getUsers, sendBroadcast, getBroadcastHistory
};
