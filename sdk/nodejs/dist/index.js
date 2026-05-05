"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SABError = exports.SabClient = void 0;
var client_1 = require("./client");
Object.defineProperty(exports, "SabClient", { enumerable: true, get: function () { return client_1.SabClient; } });
var error_1 = require("./error");
Object.defineProperty(exports, "SABError", { enumerable: true, get: function () { return error_1.SABError; } });
__exportStar(require("./models"), exports);
__exportStar(require("./services"), exports);
__exportStar(require("./types"), exports);
__exportStar(require("./utils"), exports);
/**
 * SAB Node.js SDK
 *
 * A TypeScript/JavaScript SDK for interacting with the SAB job scheduling platform.
 *
 * @example
 * ```typescript
 * import { SabClient } from '@learnerview/sab-sdk';
 *
 * const client = SabClient.builder()
 *   .baseUrl('http://localhost:8080')
 *   .apiKey('your-api-key')
 *   .tenantId('your-tenant-id')
 *   .build();
 *
 * // Submit a job
 * const job = await client.submitJobAsync({
 *   jobType: 'webhook',
 *   priority: 'NORMAL',
 *   payload: { message: 'Hello World' },
 *   execution: {
 *     type: 'HTTP',
 *     endpoint: 'https://example.com/webhook',
 *     timeoutSeconds: 30
 *   }
 * });
 *
 * console.log('Job submitted:', job.jobId);
 * ```
 */
//# sourceMappingURL=index.js.map