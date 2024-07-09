import fs from 'fs';
import path from 'path';
import readline from 'readline';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const CONFIG_PATH = path.join(__dirname, '..', '.figma-access-conf');

// Типы данных
interface Variable {
  name: string;
  value: string;
  type: 'color' | 'string' | 'number';
}[];


interface Page {
  id: string;
  name: string;
  tree: Tree;
}[];

interface Component {
  id: string;
  name: string;
}[];

interface Configuration {
  variables: Variable[];
  pages: Page[];
  components: Component[];
}

type DocumentNode = {
  name: string;
  id: string;
  x: number;
  y: number;
  typeId: string;
  componentId?: string;
  meta?: {
    metaField: string;
  };
}

type Tree = {
  node: DocumentNode;
  children?: Tree[];
}[];

// Функции для работы с конфигурацией
const saveConfig = (token: string, documentId: string): void => {
  const config = { token, documentId };
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config));
};

const loadConfig = (): { token: string; documentId: string } | null => {
  if (!fs.existsSync(CONFIG_PATH)) return null;
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
};


// Функции для взаимодействия с API Figma
const API_BASE_URL = 'https://api.figma.com/v1';

const fetchFigmaData = async (token: string, documentId: string): Promise<Configuration> => {
  const headers = {
    'X-Figma-Token': token,
  };

  const documentResponse = await axios.get(`${API_BASE_URL}/files/${documentId}`, { headers });
  const documentData = documentResponse.data;

  const variables: Variable[] = extractVariables(documentData);
  const components: Component[] = extractComponents(documentData);

  const pages: Page[] = await Promise.all(
    documentData.document.children.map(async (page: any) => {
      const pageDataResponse = await axios.get(`${API_BASE_URL}/files/${documentId}/nodes?ids=${page.id}`, { headers });
      const pageData = pageDataResponse.data.nodes[page.id].document;

      return {
        id: page.id,
        name: page.name,
        tree: parseTree(pageData, components),
      };
    })
  );

  return { variables, pages, components };
};

const extractVariables = (documentData: any): Variable[] => {
  
  return [];
};

const extractComponents = (documentData: any): Component[] => {
  const components: Component[] = [];
  const processComponent = (node: any) => {
    if (node.type === 'COMPONENT' || node.type === 'INSTANCE') {
      components.push({
        id: node.id,
        name: node.name,
      });
    }

    if (node.children) {
      node.children.forEach((child: any) => processComponent(child));
    }
  };
  documentData.document.children.forEach((page: any) => {
    processComponent(page);
  });
  return components;
};

const parseTree = (node: any, components: Component[]): Tree => {
  const treeNode: Tree = [
    {
      node: {
        name: node.name,
        id: node.id,
        x: node.absoluteBoundingBox?.x || 0,
        y: node.absoluteBoundingBox?.y || 0,
        typeId: node.type,
        componentId: components.find((component) => component.id === node.id)?.id || undefined,
        meta: node.pluginData ? { metaField: node.pluginData.metaField } : undefined,
      },
      children: node.children ? node.children.map((child: any) => parseTree(child, components)) : [],
    },
  ];
  return treeNode;
};

const ask = (query: string): Promise<string> => {
  const rl = readline.createInterface({
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

const getCredentials = async (): Promise<{ token: string; documentId: string }> => {
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
  fs.writeFileSync(path.join(__dirname, '..', 'configuration.json'), JSON.stringify(configuration, null, 2));
  console.log('Configuration file generated.');
};

main().catch(console.error);