const express = require('express');
const adminSettingsController = require('../controllers/adminSettingsController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get('/', adminSettingsController.getSettings);
router.put('/', adminSettingsController.updateSettings);

module.exports = router;
