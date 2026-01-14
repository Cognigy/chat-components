/**
 * Pre-import modules in the correct order to avoid circular dependency issues
 * This ensures CollateMessage is initialized before any components try to use it
 */

// Import matcher first (it depends on messages but not utils)
// Then import utils which depends on matcher
// This breaks the circular dependency initialization

// Force the imports in this specific order
import "../src/messages/types";
import "../src/matcher";
import "../src/utils";
import "../src/messages/collation";
import "../src/messages/Message";

// Export nothing, this is just for side effects
export {};
