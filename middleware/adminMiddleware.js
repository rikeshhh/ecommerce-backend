const isAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res
      .status(403)
      .json({ message: "Forbidden: Admin access required" });
  }
  next();
};

module.exports = { isAdmin };
