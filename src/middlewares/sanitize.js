// src/middlewares/sanitize.js
/**
 * Input Sanitization Middleware
 * Prevents NoSQL injection and XSS attacks
 */

/**
 * Recursively sanitize object by removing dangerous characters
 * @param {*} obj - Object to sanitize
 * @returns {*} Sanitized object
 */
function sanitizeObject(obj) {
    if (obj === null || obj === undefined) return obj;

    // Handle arrays
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }

    // Handle objects
    if (typeof obj === 'object' && !(obj instanceof Date)) {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            // Remove keys starting with $ or containing .
            if (key.startsWith('$') || key.includes('.')) {
                continue;
            }
            sanitized[key] = sanitizeObject(value);
        }
        return sanitized;
    }

    // Handle strings - remove potential XSS
    if (typeof obj === 'string') {
        return obj
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '');
    }

    return obj;
}

/**
 * Middleware to sanitize request body, query, and params
 */
export function sanitizeInput(req, _res, next) {
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }

    if (req.query) {
        req.query = sanitizeObject(req.query);
    }

    if (req.params) {
        req.params = sanitizeObject(req.params);
    }

    next();
}

/**
 * Strict sanitization for MongoDB queries
 * Removes all $ operators and . in keys
 */
export function sanitizeMongoQuery(query) {
    if (!query || typeof query !== 'object') return query;

    const sanitized = {};
    for (const [key, value] of Object.entries(query)) {
        // Skip dangerous operators
        if (key.startsWith('$') || key.includes('.')) {
            continue;
        }

        // Recursively sanitize nested objects
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            sanitized[key] = sanitizeMongoQuery(value);
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized;
}
