const crypto = require("crypto");

const generateRandomString = (length = 32) =>
  crypto.randomBytes(length).toString("hex");

const hashString = (str) =>
  crypto.createHash("sha256").update(str).digest("hex");

const slugify = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

const capitalizeFirst = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";

const formatFullName = (firstName, lastName) =>
  `${firstName} ${lastName}`.trim();

const truncateString = (str, maxLength = 100) => {
  if (!str || str.length <= maxLength) return str;
  return str.substring(0, maxLength) + "...";
};

const parseUserAgent = (userAgent) => {
  if (!userAgent)
    return { browser: "Unknown", os: "Unknown", device: "Desktop" };

  const result = { browser: "Unknown", os: "Unknown", device: "Desktop" };

  if (userAgent.includes("Chrome")) result.browser = "Chrome";
  else if (userAgent.includes("Firefox")) result.browser = "Firefox";
  else if (userAgent.includes("Safari")) result.browser = "Safari";
  else if (userAgent.includes("Edge")) result.browser = "Edge";

  if (userAgent.includes("Windows")) result.os = "Windows";
  else if (userAgent.includes("Mac")) result.os = "macOS";
  else if (userAgent.includes("Linux")) result.os = "Linux";
  else if (userAgent.includes("Android")) result.os = "Android";
  else if (userAgent.includes("iOS")) result.os = "iOS";

  if (userAgent.includes("Mobile")) result.device = "Mobile";
  else if (userAgent.includes("Tablet")) result.device = "Tablet";

  return result;
};

const getIpAddress = (req) =>
  req.headers["x-forwarded-for"]?.split(",")[0] ||
  req.headers["x-real-ip"] ||
  req.connection.remoteAddress ||
  req.socket.remoteAddress ||
  "Unknown";

const formatDate = (date, format = "short") => {
  if (!date) return "";
  const d = new Date(date);

  switch (format) {
    case "short":
      return d.toLocaleDateString();
    case "long":
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    case "iso":
      return d.toISOString();
    default:
      return d.toLocaleDateString();
  }
};

const getTimeDifference = (date) => {
  const diff = Date.now() - new Date(date);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) return `${years} year${years > 1 ? "s" : ""} ago`;
  if (months > 0) return `${months} month${months > 1 ? "s" : ""} ago`;
  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  return "Just now";
};

const maskEmail = (email) => {
  if (!email) return "";
  const [username, domain] = email.split("@");
  return `${username[0]}***${username[username.length - 1]}@${domain}`;
};

const maskPhoneNumber = (phone) => {
  if (!phone) return "";
  return phone.slice(0, -4).replace(/\d/g, "*") + phone.slice(-4);
};

const isValidEmail = (email) =>
  /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);

const validatePasswordStrength = (password) => {
  const result = { isValid: true, strength: 0, feedback: [] };

  if (password.length < 8) {
    result.isValid = false;
    result.feedback.push("Min 8 characters");
  } else result.strength++;

  if (!/[A-Z]/.test(password)) result.feedback.push("Add uppercase");
  else result.strength++;

  if (!/[a-z]/.test(password)) result.feedback.push("Add lowercase");
  else result.strength++;

  if (!/[0-9]/.test(password)) result.feedback.push("Add numbers");
  else result.strength++;

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
    result.feedback.push("Add special chars");
  else result.strength++;

  return result;
};

const generatePaginationInfo = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  return {
    currentPage: page,
    itemsPerPage: limit,
    totalItems: total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
    nextPage: page < totalPages ? page + 1 : null,
    previousPage: page > 1 ? page - 1 : null,
  };
};

const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

const removeUndefined = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = {
  generateRandomString,
  hashString,
  slugify,
  capitalizeFirst,
  formatFullName,
  truncateString,
  parseUserAgent,
  getIpAddress,
  formatDate,
  getTimeDifference,
  maskEmail,
  maskPhoneNumber,
  isValidEmail,
  validatePasswordStrength,
  generatePaginationInfo,
  deepClone,
  removeUndefined,
  sleep,
};
