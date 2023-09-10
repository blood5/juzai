import { GUI } from "dat.gui";
export default class Table {
  constructor(app, element) {
    this._app = app;
    this._element = element;
    this._init();
  }

  _init() {}

  set rows(count) {
    const app = this._app;
    if (!app) return;

    if (this._gui) {
      this._gui.destroy();
      this._gui = undefined;
    }
    const gui = (this._gui = new GUI({
      autoPlace: true,
      width: 320,
    }));
    gui.domElement.style.position = "absolute";
    gui.domElement.style.right = "2px";
    gui.domElement.style.top = "2px";

    let config = {};

    for (var i = 0; i < count; i++) {
      config[i] = parseInt(Math.random()*40);
    }
    for (var i = 0; i < count; i++) {
      gui.add(config, `${i}`).name(`第${i}排`);
    }
    const config2 = {
      conform: () => {
        app.createSeat(config);
        this._gui.destroy();
        this._gui = undefined;
      },
    };
    gui.add(config2, "conform").name("确认创建");
  }
}
