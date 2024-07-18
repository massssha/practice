/// <reference types="@figma/plugin-typings" />

figma.showUI(__html__);

figma.ui.onmessage = async (msg: { type: string, text: string, fontSize: number }) => {
  if (msg.type === 'create-text-box') {
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    const text = figma.createText();
    text.fontSize = msg.fontSize;
    text.characters = msg.text;
    text.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
    figma.currentPage.appendChild(text);

    figma.currentPage.selection = [text];
    figma.viewport.scrollAndZoomIntoView([text]);
  }
  figma.closePlugin();
};
