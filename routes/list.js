const express = require('express');
const router = express.Router();
const listController = require('../controllers/list');
const authMiddleware = require('../middlewares/authentication');

router.use(authMiddleware);

router.post('/', listController.createList);

router.get('/:id', listController.getList);

router.put('/:id', listController.updateList);

router.delete('/:id', listController.deleteList);

router.get('/card/:id', listController.getAllListsInCard);

module.exports = router;