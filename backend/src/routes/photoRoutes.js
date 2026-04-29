const express = require("express");
const router = express.Router();
const photoController = require("../controllers/photoController");
const authMiddleware = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");

router.use(authMiddleware);

// Routes
router.post(
  "/upload",
  upload.single("photo"),
  photoController.handleMulterError,
  photoController.uploadPhoto,
);
router.get("/me", photoController.getMyPhotos);
router.get("/user/:id", photoController.getUserPhotos);
router.put("/profile/:photoId", photoController.setProfilePhoto);
router.delete("/:photoId", photoController.deletePhoto);

module.exports = router;
