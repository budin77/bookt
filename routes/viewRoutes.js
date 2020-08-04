const express = require('express');
const viewController = require('./../controllers/viewController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.get('/', authController.isLoggedIn, viewController.getIndex);
router.get('/tour/:slug', authController.isLoggedIn, viewController.getTour);
router.get('/login', authController.isLoggedIn, viewController.getLogin);
router.get('/account', authController.protect, viewController.getAccount);
router.post(
  '/update-user-data',
  authController.protect,
  viewController.updateUserDate
);

module.exports = router;
