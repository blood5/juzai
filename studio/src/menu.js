import { GUI } from "dat.gui";
import Swal from "sweetalert2";
import {
  align,
  insertStyle,
  isCtrlDown,
  isShiftDown,
  loadJSON,
  registerImage,
  saveJSON,
} from "./util";
import Table from "./table";

export default class Menu {
  constructor(app) {
    this._app = app;
    this._gui = undefined;
    this.init();
    const table = (this._table = new Table(app));
  }

  init() {
    const app = this._app;
    const gui = (this._gui = new GUI({
      closeOnTop: true,
      autoPlace: true,
      width: 160,
    }));
    gui.domElement.parentElement.style.zIndex = 9999;
    gui.domElement.style.position = "absolute";
    gui.domElement.style.left = "2px";
    gui.domElement.style.top = "2px";
    console.log(app._model);
    console.log(app._model.getSelectionModel());
    const sm = app._model.getSelectionModel();

    insertStyle(`
          .dg .c {
              float: left;
              width: 40%;
              position: relative;
          }
  
          .dg .c input[type='text'] {
                border: 0;
                width: 100%;
               float: right;
          }
          .dg .property-name {
                width: 60%;
          }
          `);

    const options = {
      toolbar: {
        new: () => {
          app.reset();
          console.log("new and reset");
        },
        clear: () => {
          app.clear();
          console.log("clear");
        },
        save: () => {
          app.save();
          console.log("save");
        },
        load: () => {
          app.clear();
          app.load();
          console.log("load");
        },
        delete: () => {
          const model = app._model;
          model?.removeSelection();
        },
        lock: false,
        zoomoverview: () => {
          app.scene?.zoomOverview();
        },
        undo: () => {
          app.undoManager.undo();
        },
        redo: () => {
          app.undoManager.redo();
        },
      },
      draw: {
        default: () => {
          app.scene.viewer.setDefaultInteractions();
          app.scene.viewer.setRectSelectEnabled(false);
          app.scene.viewer.setDragToPan(true);
        },
        rectselect: () => {
          app.scene.viewer.setDefaultInteractions();
          app.scene.viewer.setDragToPan(false);
          app.scene.viewer.setRectSelectEnabled(true);
        },
        edit: () => {
          app.scene.viewer.setEditInteractions();
        },
        drawText: () => {
          console.log("绘制文字");
          app.drawText();
        },
        drawRect: () => {
          console.log("绘制矩形");
          app.drawRect();
        },
        drawCircle: () => {
          console.log("绘制圆形");
          app.drawCircle();
        },
        drawShape: () => {
          console.log("绘制多边形");
          app.drawShape();
        },
        drawCurve: () => {
          console.log("绘制弧线");
          app.drawCurve();
        },
        drawGrid: () => {
          console.log("编排虚拟座位");
          app.drawGrid();
        },
        createSeat: async () => {
          console.log("开始创建座位");
          const { value: rows } = await Swal.fire({
            title: "请输入需要创建座位行数",
            input: "text",
            inputLabel: "请输入需要创建座位行数",
            inputPlaceholder: "请输入需要创建座位行数",
          });

          if (rows > 100) {
            Swal.fire(`行数太多，建议分批创建!`);
          } else {
            console.log(`创建${rows}行座位`);
            this._table.rows = rows;
          }
        },
      },
      align: {
        top: () => {
          app.doAlign("top");
        },
        bottom: () => {
          app.doAlign("bottom");
        },
        left: () => {
          app.doAlign("left");
        },
        right: () => {
          app.doAlign("right");
        },
        horizontalcenter: () => {
          app.doAlign("horizontalcenter");
        },
        verticalcenter: () => {
          app.doAlign("verticalcenter");
        },
      },
      operation: {
        group: () => {
          app.group();
        },
        unGroup: () => {
          app.unGroup();
        },
        mirrorX: () => {
          app._mirrorX();
        },
        mirrorY: () => {
          app._mirrorY();
        },
      },
      business: {
        sort1: () => {
          
        },
        sort2: () => {
          console.log("sort2");
          const model = app._model;
          if (app._selectTarget && app._selectTarget instanceof b2.Group) {
            console.log(app._selectTarget);
            const group = app._selectTarget,
              row = {
                name: group.c("row.name"),
                number: group.c("row.number"),
              };
            console.log(row);
            const grids = app._selectTarget.getChildren();
            let gridsArray = grids.toArray().sort((a, b) => {
              return b.getCenterLocation().x - a.getCenterLocation().x;
            });
            let seats = [],
              seatCount = 0;
            gridsArray.forEach((grid, index) => {
              // grid.setName(index + 1);
              const count = grid.getStyle("grid.column.count");
              for (let i = seatCount; i < seatCount + count; i++) {
                const node = new b2.Follower({
                  name: i + 1,
                  // movable: false,
                  styles: {
                    "body.type": "vector",
                    "vector.shape": "roundrect",
                    // 'vector.fill.color': 'rgba(255,255,255,0.4)',
                    "vector.fill.color": "#E3E3E3",
                    "vector.outline.width": 1,
                    "vector.outline.color": "#000000",
                    "vector.outline.pattern": [1, 1],
                    "label.position": "center",
                    "shadow.xoffset": 0,
                    "shadow.yoffset": 0,
                    "select.padding": 0,
                  },
                  clients: {
                    "column.number": i + 1,
                    "column.name": `${i + 1}号`,
                    "row.column.name": `${row.name}${i + 1}号`,
                    "seat.stats": "未分配",
                    "seat.price": 100,
                    "business.region": "", // 区域
                    "business.tier": "", // 层数
                    "business.row": "", // 排号
                    "business.seat": `${i + 1}号`, //座位号
                  },
                });
                node.setLayerId("top");
                node.setHost(grid);
                node.setParent(grid);
                node.setStyle(
                  "follower.column.index",
                  count - 1 - i + seatCount
                );
                model.add(node);
              }
              seatCount += count;
            });
          }
        },
        sort3: () => {
          console.log("sort3");
          const model = app._model;
          if (app._selectTarget && app._selectTarget instanceof b2.Group) {
            console.log(app._selectTarget);
            console.log(app._selectTarget);
            const group = app._selectTarget,
              row = {
                name: group.c("row.name"),
                number: group.c("row.number"),
              };
            console.log(row);
            const grids = app._selectTarget.getChildren();
            let gridsArray = grids.toArray().sort((a, b) => {
              return a.getCenterLocation().x - b.getCenterLocation().x;
            });
            let seats = [],
              seatCount = 0;
            gridsArray.forEach((grid, index) => {
              // grid.setName(index + 1);
              const count = grid.getStyle("grid.column.count");
              grid.startCount = seatCount;
              seatCount += count;
              grid.endCount = seatCount;
            });
            console.log(seatCount, gridsArray);
            let half = 0;
            if (seatCount % 2 === 0) {
              // seatCount 是偶数
              half = seatCount / 2;
            } else {
              half = (seatCount + 1) / 2;
            }
            let start = 0,
              left = 2,
              right = 3,
              currentIndex = 0;
            gridsArray.forEach((grid, index) => {
              const startCount = grid.startCount,
                endCount = grid.endCount;
              if (half <= endCount && half >= startCount) {
                currentIndex = index;
                // grid.s('grid.fill.color', 'rgba(255,0,0,0.4)');
                const count = grid.getStyle("grid.column.count");
                const offset = half - startCount - 1;
                const node = new b2.Follower({
                  name: 1,
                  // movable: false,
                  styles: {
                    "body.type": "vector",
                    "vector.shape": "roundrect",
                    // 'vector.fill.color': 'rgba(255,255,255,0.4)',
                    "vector.fill.color": "#E3E3E3",
                    "vector.outline.width": 1,
                    "vector.outline.color": "#000000",
                    "vector.outline.pattern": [1, 1],
                    "label.position": "center",
                    "shadow.xoffset": 0,
                    "shadow.yoffset": 0,
                    "select.padding": 0,
                  },
                  clients: {
                    "column.number": 1,
                    "column.name": `${1}号`,
                    "row.column.name": `${row.name}${1}号`,
                    "seat.stats": "未分配",
                    "seat.price": 100,
                    "business.region": "", // 区域
                    "business.tier": "", // 层数
                    "business.row": "", // 排号
                    "business.seat": `${1}号`, //座位号
                  },
                });
                node.setLayerId("top");
                node.setHost(grid);
                node.setParent(grid);
                node.setStyle("follower.column.index", offset);
                model.add(node);
                // sort left
                for (let i = offset - 1; i >= 0; i--) {
                  const node = new b2.Follower({
                    name: left,
                    movable: false,
                    styles: {
                      "body.type": "vector",
                      "vector.shape": "roundrect",
                      // 'vector.fill.color': 'rgba(255,255,255,0.4)',
                      "vector.fill.color": "#E3E3E3",
                      "vector.outline.width": 1,
                      "vector.outline.color": "#000000",
                      "vector.outline.pattern": [1, 1],
                      "label.position": "center",
                      "shadow.xoffset": 0,
                      "shadow.yoffset": 0,
                      "select.padding": 0,
                    },
                    clients: {
                      "column.number": left,
                      "column.name": `${left}号`,
                      "row.column.name": `${row.name}${left}号`,
                      "seat.stats": "未分配",
                      "seat.price": 100,
                      "business.region": "", // 区域
                      "business.tier": "", // 层数
                      "business.row": "", // 排号
                      "business.seat": `${left}号`, //座位号
                    },
                  });
                  left += 2;
                  node.setLayerId("top");
                  node.setHost(grid);
                  node.setParent(grid);
                  node.setStyle("follower.column.index", i);
                  model.add(node);
                }
                // sort right
                for (let i = offset + 1; i <= count - 1; i++) {
                  const node = new b2.Follower({
                    name: right,
                    movable: false,
                    styles: {
                      "body.type": "vector",
                      "vector.shape": "roundrect",
                      // 'vector.fill.color': 'rgba(255,255,255,0.4)',
                      "vector.fill.color": "#E3E3E3",
                      "vector.outline.width": 1,
                      "vector.outline.color": "#000000",
                      "vector.outline.pattern": [1, 1],
                      "label.position": "center",
                      "shadow.xoffset": 0,
                      "shadow.yoffset": 0,
                      "select.padding": 0,
                    },
                    clients: {
                      "column.number": right,
                      "column.name": `${right}号`,
                      "row.column.name": `${row.name}${right}号`,
                      "seat.stats": "未分配",
                      "seat.price": 100,
                      "business.region": "", // 区域
                      "business.tier": "", // 层数
                      "business.row": "", // 排号
                      "business.seat": `${right}号`, //座位号
                    },
                  });
                  right += 2;
                  node.setLayerId("top");
                  node.setHost(grid);
                  node.setParent(grid);
                  node.setStyle("follower.column.index", i);
                  model.add(node);
                }
              }
            });
            console.log(currentIndex);
            for (let i = currentIndex - 1; i >= 0; i--) {
              const grid = gridsArray[i];
              const count = grid.getStyle("grid.column.count");
              for (let j = count - 1; j >= 0; j--) {
                const node = new b2.Follower({
                  name: left,
                  // movable: false,
                  styles: {
                    "body.type": "vector",
                    "vector.shape": "roundrect",
                    // 'vector.fill.color': 'rgba(255,255,255,0.4)',
                    "vector.fill.color": "#E3E3E3",
                    "vector.outline.width": 1,
                    "vector.outline.color": "#000000",
                    "vector.outline.pattern": [1, 1],
                    "label.position": "center",
                    "shadow.xoffset": 0,
                    "shadow.yoffset": 0,
                    "select.padding": 0,
                  },
                  clients: {
                    "column.number": left,
                    "column.name": `${left}号`,
                    "row.column.name": `${row.name}${left}号`,
                    "seat.stats": "未分配",
                    "seat.price": 100,
                    "business.region": "", // 区域
                    "business.tier": "", // 层数
                    "business.row": "", // 排号
                    "business.seat": `${left}号`, //座位号
                  },
                });
                left += 2;
                node.setLayerId("top");
                node.setHost(grid);
                node.setParent(grid);
                node.setStyle("follower.column.index", j);
                model.add(node);
              }
            }
            for (let i = currentIndex + 1; i < gridsArray.length; i++) {
              const grid = gridsArray[i];
              const count = grid.getStyle("grid.column.count");
              for (let j = 0; j < count; j++) {
                const node = new b2.Follower({
                  name: right,
                  movable: false,
                  styles: {
                    "body.type": "vector",
                    "vector.shape": "roundrect",
                    // 'vector.fill.color': 'rgba(255,255,255,0.4)',
                    "vector.fill.color": "#E3E3E3",
                    "vector.outline.width": 1,
                    "vector.outline.color": "#000000",
                    "vector.outline.pattern": [1, 1],
                    "label.position": "center",
                    "shadow.xoffset": 0,
                    "shadow.yoffset": 0,
                    "select.padding": 0,
                  },
                  clients: {
                    "column.number": right,
                    "column.name": `${right}号`,
                    "row.column.name": `${row.name}${right}号`,
                    "seat.stats": "未分配",
                    "seat.price": 100,
                    "business.region": "", // 区域
                    "business.tier": "", // 层数
                    "business.row": "", // 排号
                    "business.seat": `${right}号`, //座位号
                  },
                });
                right += 2;
                node.setLayerId("top");
                node.setHost(grid);
                node.setParent(grid);
                node.setStyle("follower.column.index", j);
                model.add(node);
              }
            }
          }
        },
        sort4: () => {
          console.log("sort4");
          alert("开发中！");
        },
        clear: () => {
          console.log("清空座位");
          const model = app._model;
          if (app._selectTarget && app._selectTarget instanceof b2.Group) {
            const grids = app._selectTarget.getChildren();
            grids.toArray().forEach((grid) => {
              const child = grid.getChildren();
              child.toArray().forEach((c) => {
                model.remove(c);
              });
            });
          }
        },
      },
    };

    let toolbarFolder = gui.addFolder("File");
    toolbarFolder.add(options.toolbar, "new").name("新建场景");
    toolbarFolder.add(options.toolbar, "clear").name("清空场景");
    toolbarFolder.add(options.toolbar, "save").name("保存数据");
    toolbarFolder.add(options.toolbar, "load").name("导入数据");
    toolbarFolder.add(options.toolbar, "delete").name("删除数据");
    toolbarFolder
      .add(options.toolbar, "lock")
      .name("锁定场景")
      .onChange((v) => {
        app._lock = v;
      });
    toolbarFolder.add(options.toolbar, "zoomoverview").name("充满画布");
    toolbarFolder.add(options.toolbar, "undo").name("Undo");
    toolbarFolder.add(options.toolbar, "redo").name("Redo");
    toolbarFolder.open();

    let drawFolder = gui.addFolder("Draw");

    drawFolder.add(options.draw, "default").name("默认交互");
    drawFolder.add(options.draw, "rectselect").name("框选模式");
    drawFolder.add(options.draw, "edit").name("编辑模式");
    drawFolder.add(options.draw, "createSeat").name("创建座位");
    drawFolder.add(options.draw, "drawText").name("绘制文字");
    drawFolder.add(options.draw, "drawRect").name("绘制矩形");
    drawFolder.add(options.draw, "drawCircle").name("绘制圆形");
    drawFolder.add(options.draw, "drawShape").name("绘制多边形");
    // drawFolder.add(options.draw, "drawCurve").name("绘制弧线");
    // drawFolder.add(options.draw, "drawGrid").name("编排虚拟座位");
    drawFolder.open();

    let alignFolder = gui.addFolder("Align");
    alignFolder.add(options.align, "top").name("上对齐");
    alignFolder.add(options.align, "bottom").name("下对齐");
    alignFolder.add(options.align, "left").name("左对齐");
    alignFolder.add(options.align, "right").name("右对齐");
    alignFolder.add(options.align, "horizontalcenter").name("水平居中");
    alignFolder.add(options.align, "verticalcenter").name("垂直居中");
    alignFolder.close();

    let operationFolder = gui.addFolder("Operation");
    operationFolder.add(options.operation, "group").name("分组");
    operationFolder.add(options.operation, "unGroup").name("解除分组");
    // operationFolder.add(options.operation, "mirrorX").name("水平镜像");
    // operationFolder.add(options.operation, "mirrorY").name("垂直镜像");
    operationFolder.close();

    // let businessFolder = gui.addFolder("Business");
    // businessFolder.add(options.business, "sort1").name("向右顺序编号");
    // businessFolder.add(options.business, "sort2").name("向左顺序编号");
    // businessFolder.add(options.business, "sort3").name("单双号编号1");
    // businessFolder.add(options.business, "sort4").name("单双号编号2");
    // businessFolder.add(options.business, "clear").name("清除编号");
    // businessFolder.close();
    // let colorPriceFolder = gui.addFolder("票价配色");
    // for (let key in app._colorMap) {
    //   console.log(key + "---" + app._colorMap[key]);
    //   colorPriceFolder.addColor(app._colorMap, key).name(`￥${key}`);
    // }
    // colorPriceFolder.close();
  }
}
