import { Router } from 'express';
import { 
  getDashboardStats, 
  getEvents, createEvent, updateEvent, deleteEvent,
  getGallery, addGalleryImage, updateGalleryImage, deleteGalleryImage,
  getContent, updateContent,
  updateAdminCredentials,
  getAllOrders
} from '../controllers/admin.controller.js';
import { verifyJWT, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();

// Publicly readable endpoints:
router.route('/events').get(getEvents);
router.route('/gallery').get(getGallery);
router.route('/content/:section').get(getContent);

// Admin-only endpoints:
router.use(verifyJWT, authorizeRoles('ADMIN', 'SUPER_ADMIN'));

router.route('/stats').get(getDashboardStats);
router.route('/orders').get(getAllOrders);
router.route('/credentials').put(updateAdminCredentials);

router.route('/events')
  .post(createEvent);
router.route('/events/:id')
  .put(updateEvent)
  .delete(deleteEvent);

router.route('/gallery')
  .post(addGalleryImage);
router.route('/gallery/:id')
  .put(updateGalleryImage)
  .delete(deleteGalleryImage);

router.route('/content/:section')
  .put(updateContent);

import { upload } from '../middlewares/multer.middleware.js';
import { getUsers, sendBroadcast, getBroadcastHistory } from '../controllers/admin.controller.js';

router.route('/users').get(getUsers);
// router.route('/broadcast').post(upload.array('attachments', 5), sendBroadcast);
// router.route('/broadcast/history').get(getBroadcastHistory);

export default router;
