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
const router = (0, express_1.Router)();
exports.routes = router;
// Mount routes
router.use('/health', health_js_1.default);
router.use('/calculate', calculate_js_1.default);
router.use('/queue', queue_js_1.default);
router.use('/queue/progress', progress_js_1.default);
//# sourceMappingURL=index.js.map