const express = require('express');
const adminBlockedController = require('../controllers/adminBlockedController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get('/', adminBlockedController.listBlocked);
router.post('/', adminBlockedController.blockNumber);
router.get('/all', adminBlockedController.getBlocked);
router.delete('/all', adminBlockedController.unblockAll);
router.get('/:idOrKey', adminBlockedController.getBlocked);
router.delete('/:idOrKey', adminBlockedController.unblockNumber);

module.exports = router;
