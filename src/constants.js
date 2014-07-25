module.exports = {
  
  errors: {
    BAD_REQUEST: 1,
    BAD_QUERY_PARAMETER: 2,
    AUTH_REQUIRED: 3,
    AUTH_FAILED: 4,
    GRANT_REQUIRED: 5
  },
  
  events: {
    CREATE: "datastack:create",
    UPDATE: "datastack:update",
    DELETE: "datastack:delete"
  }
  
};