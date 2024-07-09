"use strict";
/// <reference types="@figma/plugin-typings" />
figma.showUI(__html__);
figma.ui.onmessage = msg => {
    if (msg.type === 'save-meta') {
        const { nodeId, metaField } = msg;
        const node = figma.getNodeById(nodeId);
        if (node && 'setPluginData' in node) {
            node.setPluginData('metaField', metaField);
        }
    }
};
figma.on('selectionchange', () => {
    const selection = figma.currentPage.selection[0];
    if (selection && selection.type === 'INSTANCE') {
        figma.ui.postMessage({
            type: 'show-input',
            nodeId: selection.id,
            metaField: selection.getPluginData('metaField') || ''
        });
    }
});
