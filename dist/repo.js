"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMigrationFiles = exports.getModifiedSqlFiles = void 0;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const simple_git_1 = __importDefault(require("simple-git"));
function getModifiedSqlFiles(sourcePath, diffBase) {
    return __awaiter(this, void 0, void 0, function* () {
        const normalSourcePath = path_1.default.normalize(sourcePath);
        const git = (0, simple_git_1.default)(normalSourcePath);
        const root = yield git.revparse("--show-toplevel");
        const modifiedFiles = new Set();
        const diffSummary = yield git.diffSummary(diffBase);
        diffSummary.files
            .map((f) => f.file)
            .filter((f) => path_1.default.join(root, f).startsWith(normalSourcePath))
            .filter((f) => f.toLowerCase().endsWith(".sql"))
            .forEach((f) => modifiedFiles.add(f));
        const status = yield git.status();
        status.not_added
            .filter((f) => path_1.default.join(root, f).startsWith(normalSourcePath))
            .filter((f) => f.toLowerCase().endsWith(".sql"))
            .forEach((f) => modifiedFiles.add(f));
        return Array.from(modifiedFiles)
            .filter((subpath) => !subpath.includes("migrations/"))
            .filter((subpath) => (0, fs_1.existsSync)(path_1.default.join(root, subpath)))
            .map((subpath) => path_1.default.join(root, subpath));
    });
}
exports.getModifiedSqlFiles = getModifiedSqlFiles;
function getMigrationFiles(supabaseDir, diffBase) {
    return __awaiter(this, void 0, void 0, function* () {
        const git = (0, simple_git_1.default)(supabaseDir);
        const root = yield git.revparse("--show-toplevel");
        const modifiedFiles = new Set();
        const diffSummary = yield git.diffSummary(diffBase);
        diffSummary.files
            .map((f) => f.file)
            .filter((f) => f.endsWith("/up.sql"))
            .forEach((f) => modifiedFiles.add(f));
        const status = yield git.status();
        status.not_added
            .filter((f) => f.endsWith("/up.sql"))
            .forEach((f) => modifiedFiles.add(f));
        // Filter for only supabase migrations.
        return Array.from(modifiedFiles)
            .filter((subpath) => subpath.includes("migrations/"))
            .map((subpath) => path_1.default.join(root, subpath));
    });
}
exports.getMigrationFiles = getMigrationFiles;
