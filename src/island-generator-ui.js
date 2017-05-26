import debounce from 'lodash/debounce';
import dat from 'dat.gui/build/dat.gui';
import {HeightmapThreeJS} from './HeightmapThreeJS';
import IslandGenerator from './IslandGenerator';
import HeightmapGenerator from './HeightmapGenerator';

function makeUI(ig) {
  const debouncedGenerate = debounce(() => ig.regenerateAndDraw(), 50);
  const gui = new dat.GUI();
  IslandGenerator.PARAMS.groups.forEach((group) => {
    let folder = gui;
    if (group.name) {
      folder = gui.addFolder(group.name);
    }
    group.params.forEach((param) => {
      let guiParam = null;
      switch (param.type) {
        case 'int':
          guiParam = folder.add(ig.params, param.name, param.min, param.max).step(1);
          break;
        case 'float':
          guiParam = folder.add(ig.params, param.name, param.min, param.max);
          break;
        case 'bool':
          guiParam = folder.add(ig.params, param.name);
          break;
        case 'string':
          guiParam = folder.add(ig.params, param.name);
          break;
      }
      guiParam.onChange(debouncedGenerate);
    });
  });
  ig.gui = gui;
}

function makeButton(text, handler) {
  const button = document.createElement('button');
  button.innerHTML = text;
  button.addEventListener('click', handler, false);
  document.body.appendChild(button);
  return button;
}

export function main() {
  const ig = window.ig = new IslandGenerator("dkkkhurf a der3");
  makeUI(ig);
  ig.regenerateAndDraw();
  const generateHeightMap = function () {
    const hmg = new HeightmapGenerator(ig, 256, 256);
    hmg.startGenerate();
    const stepGeneration = function () {
      if (hmg.generateNextLine()) {
        setTimeout(stepGeneration, 1);
      }
    };
    stepGeneration();
    const enableWebGL = function () {
      const th = new HeightmapThreeJS(hmg);
      setInterval(() => th.render(), 1000 / 40.0);
      th.updateMesh();
    };
    makeButton("WebGL", enableWebGL);
  };
  makeButton("Generate Heightmap", generateHeightMap);
  document.body.appendChild(document.createElement("br"));
}
