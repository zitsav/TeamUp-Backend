const express = require('express');
const router = express.Router();
const cardController = require('../controllers/card');
const authMiddleware = require('../middlewares/authentication');

router.use(authMiddleware);

router.post('/', cardController.createCard);

router.get('/:id', cardController.getCard);

router.put('/:id', cardController.updateCard);

router.delete('/:id', cardController.deleteCard);

router.get('/board/:id', cardController.getAllCardsInBoard);

router.put('/position/:id', cardController.changeCardPosition);

router.put('/move/:id', cardController.moveCardToDifferentBoard);

module.exports = router;