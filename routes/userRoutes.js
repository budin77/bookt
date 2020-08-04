const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router(authController.signup);

//signup & login routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

//forget & reset password routes
router.post('/forgetPassword', authController.forgetPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

//!!!middleware - protect routes after this line
router.use(authController.protect);

//update password - if user is login
router.patch('/updateMyPassword', authController.updatePassword);

//get me
router.get('/me', userController.getMe, userController.getUser);

//update me - other user info (no password) - if user is login
router.patch('/updateMe', userController.updateMe);

//delete me (set the account to inactive)
router.delete('/deleteMe', userController.deleteMe);

//!!!middleware - protect routes only for admin after this line
router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
