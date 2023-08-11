const express = require('express');
const router = express.Router();
const boardController = require('../controllers/boards');
const authMiddleware = require('../middlewares/authentication');

router.use(authMiddleware);

router.post('/', boardController.createBoard);

router.get('/:id', boardController.getBoard);

router.put('/:id', boardController.updateBoard);

router.delete('/:id', boardController.deleteBoard);

router.get('/workspace/:workspaceId', boardController.getAllBoardsInWorkspace);

module.exports = router;