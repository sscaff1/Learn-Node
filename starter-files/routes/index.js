const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const reviewController = require('../controllers/reviewController');
const imageMiddleWare = [storeController.upload, storeController.resize];
// Do work here
router.get('/', storeController.getStores);
router.get('/stores', storeController.getStores);
router.get('/stores/page/:page', storeController.getStores);
router.get('/store/:slug', storeController.getStoreBySlug);
router.get('/add', authController.isLoggedIn, storeController.addStore);
router.get(['/tags', '/tags/:tag'], storeController.getStoresByTag);
router.post('/add', ...imageMiddleWare, storeController.createStore);
router.get('/stores/:id/edit', storeController.editStore);
router.post('/edit/:id', ...imageMiddleWare, storeController.updateStore);

router.get('/login', userController.loginForm);
router.get('/register', userController.registerForm);
router.post(
  '/register',
  userController.validateRegister,
  userController.register,
  authController.login
);

router.get('/logout', authController.logout);
router.post('/login', authController.login);

router.get('/account', authController.isLoggedIn, userController.account);
router.post('/account', userController.updateAccount);
router.post('/account/forgot', authController.forgot);
router.get('/account/reset/:token', authController.reset);
router.post('/account/reset/:token', authController.confirmedPasswords, authController.update);
router.get('/map', storeController.mapPage);
router.post('/reviews/:id', authController.isLoggedIn, reviewController.addReview);
router.get('/top', storeController.getTopStores);

// API
router.get('/api/search', storeController.searchStores);
router.get('/api/stores/near', storeController.mapStores);
router.post('/api/stores/:id/heart', storeController.heartStore);

module.exports = router;
