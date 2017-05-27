const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const imageMiddleWare = [storeController.upload, storeController.resize];
// Do work here
router.get('/', storeController.getStores);
router.get('/stores', storeController.getStores);
router.get('/store/:slug', storeController.getStoreBySlug);
router.get('/add', storeController.addStore);
router.get(['/tags', '/tags/:tag'], storeController.getStoresByTag);
router.post('/add', ...imageMiddleWare, storeController.createStore);
router.get('/stores/:id/edit', storeController.editStore);
router.post('/edit/:id', ...imageMiddleWare, storeController.updateStore);

module.exports = router;
