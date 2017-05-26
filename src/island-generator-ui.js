import debounce from 'lodash/debounce';
import dat from 'dat.gui/build/dat.gui';
import HeightmapThreeJS from './HeightmapThreeJS';
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
        default:
          throw new Error('unsupported param type');
      }
      guiParam.onChange(debouncedGenerate);
    });
  });
  ig.gui = gui;
  return gui;
}

export default function main() {
  const islandGenerator = new IslandGenerator('dkkkhurf a der3');
  const gui = makeUI(islandGenerator);
  islandGenerator.regenerateAndDraw();
  let heightmapGenerator = null;
  let heightmapDone = false;
  const actions = {
    generateHeightmap() {
      heightmapGenerator = new HeightmapGenerator(islandGenerator, 256, 256);
      heightmapGenerator.startGenerate();
      heightmapDone = false;
      function stepGeneration() {
        if (heightmapGenerator.generateNextLine()) {
          setTimeout(stepGeneration, 1);
        } else {
          heightmapDone = true;
        }
      }

      stepGeneration();
    },
    renderHeightmap() {
      if (!heightmapDone) {
        alert('The heightmap must be generated first.');  // eslint-disable-line
        return;
      }
      const th = new HeightmapThreeJS(heightmapGenerator);
      setInterval(() => th.render(), 1000 / 40.0);
      th.updateMesh();
    },
  };
  gui.add(actions, 'generateHeightmap');
  gui.add(actions, 'renderHeightmap');
  return islandGenerator;
}
