const express = require('express');
const router = express.Router();
const userController = require('../controllers/user');
const authMiddleware = require('../middlewares/authentication');

router.use(authMiddleware);

router.put('/:id', userController.updateUser);

router.post('/profile/:id', userController.uploadProfilePicture);

module.exports = router;
