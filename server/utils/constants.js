const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

const USER_ROLES = {
  SUPERADMIN: "superadmin",
  ADMIN: "admin",
  MODERATOR: "moderator",
  USER: "user",
  GUEST: "guest",
};

const OAUTH_PROVIDERS = {
  GOOGLE: "google",
  GITHUB: "github",
};

const TOKEN_TYPES = {
  ACCESS: "access",
  REFRESH: "refresh",
  EMAIL_VERIFICATION: "email_verification",
  PASSWORD_RESET: "password_reset",
};

const RESOURCES = {
  USERS: "users",
  ROLES: "roles",
  POSTS: "posts",
  COMMENTS: "comments",
  SETTINGS: "settings",
  ANALYTICS: "analytics",
  REPORTS: "reports",
  FILES: "files",
  NOTIFICATIONS: "notifications",
  LOGS: "logs",
};

const ACTIONS = {
  CREATE: "create",
  READ: "read",
  UPDATE: "update",
  DELETE: "delete",
  MANAGE: "manage",
};

const TIME = {
  SECOND: 1000,
  MINUTE: 60000,
  HOUR: 3600000,
  DAY: 86400000,
  WEEK: 604800000,
};

const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
};

const REGEX_PATTERNS = {
  EMAIL: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
  PHONE: /^[0-9]{10,15}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
};

module.exports = {
  HTTP_STATUS,
  USER_ROLES,
  OAUTH_PROVIDERS,
  TOKEN_TYPES,
  RESOURCES,
  ACTIONS,
  TIME,
  PAGINATION,
  PASSWORD_REQUIREMENTS,
  REGEX_PATTERNS,
};
