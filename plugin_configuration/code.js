console.clear();

async function exportToJSON() {
  await figma.loadAllPagesAsync(); 
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const variables = await processVariables(collections);
  const pages = await processPages();
  const components = await processComponents();

  const configuration = {
    variables,
    pages,
    components
  };

  figma.ui.postMessage({ type: "EXPORT_RESULT", file: { fileName: 'configuration.json', body: configuration } });
}

async function processVariables(collections) {
  const variables = [];
  for (const collection of collections) {
    for (const variableId of collection.variableIds) {
      const variable = await figma.variables.getVariableByIdAsync(variableId);
      for (const modeId in variable.valuesByMode) {
        const value = variable.valuesByMode[modeId];
        if (value !== undefined) {
          variables.push({
            name: variable.name,
            value: variable.resolvedType === 'COLOR' ? rgbToHex(value) : value,
            type: variable.resolvedType.toLowerCase()
          });
        }
      }
    }
  }
  return variables;
}

async function processComponents() {
  const components = figma.root.findAllWithCriteria({ types: ['COMPONENT'] });
  return components.map(component => ({
    id: component.id,
    name: component.name
  }));
}

async function processPages() {
  const pages = figma.root.children;
  return await Promise.all(pages.map(async (page) => ({
    id: page.id,
    name: page.name,
    tree: await processTree(page)
  })));
}

async function processTree(node) {
  const children = node.children || [];
  return await Promise.all(children.map(async (child) => {
    let mainComponent = null;
    if (child.type === 'INSTANCE') {
      mainComponent = await child.getMainComponentAsync();
    }
    return {
      node: {
        name: child.name,
        id: child.id,
        x: child.absoluteTransform[0][2],
        y: child.absoluteTransform[1][2],
        typeId: child.type,
        componentId: mainComponent ? mainComponent.id : undefined,
      },
      children: await processTree(child)
    };
  }));
}

figma.ui.onmessage = async (e) => {
  console.log("code received message", e);
  if (e.type === "EXPORT") {
    await exportToJSON();
  }
};

figma.showUI(__uiFiles__["export"], {
  width: 800,
  height: 500,
  themeColors: true,
});


function rgbToHex({ r, g, b, a }) {
  if (a !== 1) {
    return `rgba(${[r, g, b].map((n) => Math.round(n * 255)).join(", ")}, ${a.toFixed(4)})`;
  }
  const toHex = (value) => {
    const hex = Math.round(value * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  const hex = [toHex(r), toHex(g), toHex(b)].join("");
  return `#${hex}`;
}
