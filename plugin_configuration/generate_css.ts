import * as fs from 'fs';
import * as path from 'path';

interface Variable {
  name: string;
  value: string;
  type: string;
}

interface Configuration {
  variables: Variable[];
}

function generateCSS(configuration: Configuration): string {
  let cssContent = ":root {\n";
  for (const variable of configuration.variables) {
    if (variable.type === 'color') {
        cssContent += `  --${variable.name}: ${variable.value};\n`;
      }
  }
  cssContent += "}\n";
  return cssContent;
}

function main() {
  const filePath = path.resolve(__dirname, 'configuration.json');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading JSON file:', err);
      return;
    }

    const configuration: Configuration = JSON.parse(data);
    const cssContent = generateCSS(configuration);

    const outputFilePath = path.resolve(__dirname, 'variables.css');
    fs.writeFile(outputFilePath, cssContent, (err) => {
      if (err) {
        console.error('Error writing CSS file:', err);
        return;
      }

      console.log('CSS file generated successfully:', outputFilePath);
    });
  });
}

main();
