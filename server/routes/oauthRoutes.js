const express = require("express");
const router = express.Router();
const oauthController = require("../controllers/oauthController");
const { authenticate } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validationMiddleware");
const { unlinkOAuthValidation } = require("../validators/oauthValidator");

router.get("/google", oauthController.googleAuth);
router.get("/google/callback", ...oauthController.googleCallback);
router.get("/github", oauthController.githubAuth);
router.get("/github/callback", ...oauthController.githubCallback);
router.get("/providers", authenticate, oauthController.getUserProviders);
router.delete(
  "/:provider",
  authenticate,
  unlinkOAuthValidation,
  validate,
  oauthController.unlinkProvider,
);

module.exports = router;
