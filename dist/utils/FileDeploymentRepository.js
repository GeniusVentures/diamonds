"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileDeploymentRepository = void 0;
const jsonFileHandler_1 = require("./jsonFileHandler");
class FileDeploymentRepository {
    loadDeployInfo(path, createNew) {
        return (0, jsonFileHandler_1.readDeployFile)(path, createNew);
    }
    saveDeployInfo(path, info) {
        (0, jsonFileHandler_1.writeDeployInfo)(path, info);
    }
    loadFacetsConfig(path) {
        return (0, jsonFileHandler_1.readFacetsConfig)(path);
    }
}
exports.FileDeploymentRepository = FileDeploymentRepository;
//# sourceMappingURL=FileDeploymentRepository.js.map