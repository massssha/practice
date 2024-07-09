"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const readline_1 = __importDefault(require("readline"));
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const CONFIG_PATH = path_1.default.join(__dirname, '..', '.figma-access-conf');
[];
[];
[];
// Функции для работы с конфигурацией
const saveConfig = (token, documentId) => {
    const config = { token, documentId };
    fs_1.default.writeFileSync(CONFIG_PATH, JSON.stringify(config));
};
const loadConfig = () => {
    if (!fs_1.default.existsSync(CONFIG_PATH))
        return null;
    return JSON.parse(fs_1.default.readFileSync(CONFIG_PATH, 'utf-8'));
};
// Функции для взаимодействия с API Figma
const API_BASE_URL = 'https://api.figma.com/v1';
const fetchFigmaData = async (token, documentId) => {
    const headers = {
        'X-Figma-Token': token,
    };
    const documentResponse = await axios_1.default.get(`${API_BASE_URL}/files/${documentId}`, { headers });
    const documentData = documentResponse.data;
    const variables = extractVariables(documentData);
    const components = extractComponents(documentData);
    const pages = await Promise.all(documentData.document.children.map(async (page) => {
        const pageDataResponse = await axios_1.default.get(`${API_BASE_URL}/files/${documentId}/nodes?ids=${page.id}`, { headers });
        const pageData = pageDataResponse.data.nodes[page.id].document;
        return {
            id: page.id,
            name: page.name,
            tree: parseTree(pageData, components),
        };
    }));
    return { variables, pages, components };
};
const extractVariables = (documentData) => {
    return [];
};
const extractComponents = (documentData) => {
    const components = [];
    const processComponent = (node) => {
        if (node.type === 'COMPONENT' || node.type === 'INSTANCE') {
            components.push({
                id: node.id,
                name: node.name,
            });
        }
        if (node.children) {
            node.children.forEach((child) => processComponent(child));
        }
    };
    documentData.document.children.forEach((page) => {
        processComponent(page);
    });
    return components;
};
const parseTree = (node, components) => {
    var _a, _b, _c;
    const treeNode = [
        {
            node: {
                name: node.name,
                id: node.id,
                x: ((_a = node.absoluteBoundingBox) === null || _a === void 0 ? void 0 : _a.x) || 0,
                y: ((_b = node.absoluteBoundingBox) === null || _b === void 0 ? void 0 : _b.y) || 0,
                typeId: node.type,
                componentId: ((_c = components.find((component) => component.id === node.id)) === null || _c === void 0 ? void 0 : _c.id) || undefined,
                meta: node.pluginData ? { metaField: node.pluginData.metaField } : undefined,
            },
            children: node.children ? node.children.map((child) => parseTree(child, components)) : [],
        },
    ];
    return treeNode;
};
const ask = (query) => {
    const rl = readline_1.default.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise(resolve => {
        rl.question(query, answer => {
            rl.close();
            resolve(answer);
        });
    });
};
const getCredentials = async () => {
    let config = loadConfig();
    if (!config) {
        const token = await ask('Enter your Figma API token: ');
        const documentId = await ask('Enter the Figma document ID: ');
        saveConfig(token, documentId);
        return { token, documentId };
    }
    return config;
};
// Основная функция
const main = async () => {
    const { token, documentId } = await getCredentials();
    const configuration = await fetchFigmaData(token, documentId);
    fs_1.default.writeFileSync(path_1.default.join(__dirname, '..', 'configuration.json'), JSON.stringify(configuration, null, 2));
    console.log('Configuration file generated.');
};
main().catch(console.error);
