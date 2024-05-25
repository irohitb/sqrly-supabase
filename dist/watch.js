"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.watchPath = void 0;
const chalk_1 = __importDefault(require("chalk"));
const chokidar_1 = __importDefault(require("chokidar"));
const path_1 = __importDefault(require("path"));
function watchPath({ sourcePath, fileChanged, log }) {
    const sqlGlob = path_1.default.join(sourcePath, "**", "*.sql");
    log(chalk_1.default.green("->"), `Monitoring changes to ${sqlGlob}`);
    const watcher = chokidar_1.default.watch(sqlGlob, {
        ignoreInitial: true,
    });
    watcher.on("change", (path) => {
        fileChanged(path);
    });
    watcher.on("add", (path) => {
        fileChanged(path);
    });
}
exports.watchPath = watchPath;
