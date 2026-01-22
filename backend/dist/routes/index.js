"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.routes = void 0;
const express_1 = require("express");
const health_js_1 = __importDefault(require("./health.js"));
const calculate_js_1 = __importDefault(require("./calculate.js"));
const queue_js_1 = __importDefault(require("./queue.js"));
const progress_js_1 = __importDefault(require("./progress.js"));
const stream_js_1 = __importDefault(require("./stream.js"));
const warmup_js_1 = __importDefault(require("./warmup.js"));
const router = (0, express_1.Router)();
exports.routes = router;
// Mount routes
router.use((req, res, next) => {
    console.log(`[DEBUG] Router Index Hit: ${req.path}`);
    next();
});
router.use('/health', health_js_1.default);
router.use('/warmup', warmup_js_1.default);
router.use('/calculate', calculate_js_1.default);
router.use('/queue/progress', progress_js_1.default); // Order matters: more specific first
router.use('/queue', queue_js_1.default);
router.use('/stream', stream_js_1.default);
//# sourceMappingURL=index.js.map