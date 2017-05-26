export const IntParam = (name, value, min = 0, max = 100) => ({name, value, min, max, type: "int"});
export const FloatParam = (name, value, min = 0, max = 1.0) => ({name, value, min, max, type: "float"});
export const BoolParam = (name, value) => ({name, value: !!value, type: "bool"});
export const StringParam = (name, value) => ({name, value: `${value}`, type: "string"});

export class ParamGroup {
  constructor(name, params) {
    this.name = name;
    this.params = params;
  }
}

export class ParamCollection {
  constructor() {
    this.groups = [];
  }

  group(name, params) {
    this.groups.push(new ParamGroup(name, params));
  }

  initialize() {
    const params = {};
    this.groups.forEach((group) => {
      group.params.forEach((param) => {
        params[param.name] = param.value;
      });
    });
    return params;
  }
}
