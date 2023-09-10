import { GUI } from "dat.gui";
import Swal from "sweetalert2";
import { testdatas } from "./datas";
import Menu from "./menu";
import Property from "./property";
import Scene from "./scene";
import { vec2 } from "gl-matrix";

import {
  align,
  insertStyle,
  isCtrlDown,
  isShiftDown,
  loadJSON,
  registerImage,
  saveJSON,
} from "./util";

export default class Application {
  constructor() {
    this._scene = new Scene(this);
    this._model = this._scene.model;
    this._sm = this._selectionModel = this._model.getSelectionModel();
    this._initLayer();
    this._initOverview();
    this._undoManager = this._model.getUndoManager();
    this._undoManager.setEnabled(true);

    this._menu = new Menu(this);
    this._property = new Property(this);
    // this._selectTarget = null;
    this._initEvent();
    this._initPopupMenu();
    // // this._registerImages();
    // this._lastData = null;
    // this._lastPoint = null;
    this._gridWidth = 20;
    this._gridHeight = 20;
    // this._groups = [];
    // this._lock = false;

    // this._setting = new b2.SerializationSettings();
    // this._setting.setPropertyType("name2", "string");
    // this._setting.setPropertyType("angle", "number");
    // this._setting.setClientType("row.number", "number");
    // this._setting.setClientType("row.name", "string");
    // this._setting.setClientType("column.number", "number");
    // this._setting.setClientType("column.name", "string");
    // this._setting.setClientType("row.column.name", "string");
    // this._setting.setClientType("seat.stats", "string");
    // this._setting.setClientType("seat.price", "number");
    // this._setting.setClientType("movable", "boolean");
    // this._setting.setClientType("rect.select", "boolean");
    // this._setting.setClientType("business.region", "string");
    // this._setting.setClientType("business.tier", "string");
    // this._setting.setClientType("business.row", "string");
    // this._setting.setClientType("business.seat", "string");
    // this._colorMap = {
    //   180: "#2A7FFF",
    //   280: "#9720F2",
    //   380: "#FF2A78",
    //   480: "#00AE5C",
    //   580: "#E8E009",
    //   680: "#E35E2C",
    //   780: "#D42424",
    //   880: "#2AC5FF",
    //   980: "#713DEE",
    //   1080: "#F536E8",
    // };
    // this.loadTest();
  }

  get menu() {
    return this._menu;
  }

  get property() {
    return this._property;
  }

  get scene() {
    return this._scene;
  }

  get model() {
    return this._model;
  }

  get undoManager() {
    return this._undoManager;
  }

  _initPane() {
    const pane = (this._pane = new Pane({
      title: "菜单",
      expanded: true,
    }));
    pane.element.parentElement.style.zIndex = 9999;
    pane.element.parentElement.style.position = "absolute";
    pane.element.parentElement.style.left = "0px";
    pane.element.parentElement.style.top = "0px";

    const PARAMS = {
      factor: 123,
      title: "hello",
      color: "#ff0055",
      speed: 100,
      acceleration: 100,
      randomness: 100,
    };

    // pane.addBinding(PARAMS, "factor");
    // pane.addBinding(PARAMS, "title");
    // pane.addBinding(PARAMS, "color");

    const f1 = pane.addFolder({
      title: "Basic",
      expanded: true,
    });
    f1.addBinding(PARAMS, "speed");

    const f2 = pane.addFolder({
      title: "Advanced",
      expanded: false,
    });
    f2.addBinding(PARAMS, "acceleration");
    f2.addBinding(PARAMS, "randomness");

    const btn = pane
      .addButton({
        title: "Click",
        label: "Click",
      })
      .on("click", () => {
        console.log("click");
      });
  }

  _initLayer() {
    const layerBox = this._model.getLayerBox();
    const layer1 = new b2.Layer("bottom", "bottom layer");
    // layer1.setMovable(false);
    // layer1.setEditable(false);
    // layer1.setVisible(false);
    const layer2 = new b2.Layer("center", "center layer");
    const layer3 = new b2.Layer("top", "top Layer");
    layerBox.add(layer1);
    layerBox.add(layer2);
    layerBox.add(layer3);
  }
  /**
   * init events
   */
  _initEvent() {
    // this._model.addDataBoxChangeListener((e) => {
    //   const kind = e.kind,
    //     data = e.data;
    //   if (kind == "add") {
    //   }
    // }, this);

    document.addEventListener("keydown", (e) => {
      console.log(e);
      if (isCtrlDown(e)) {
        if (e.key === "c") {
          //ctrl+c
          this._copySelection(e);
        } else if (e.key === "v") {
          //ctrl+v
          this._pasteSelection();
        } else if (e.key === "z") {
          this._undoManager.undo();
        } else if (e.key === "y") {
          this._undoManager.redo();
        } else if (e.key === "g") {
          this.group();
        } else if (isShiftDown(e) && e.key === "G") {
          this.unGroup();
        }
      }
      if (isShiftDown(e)) {
        this._shiftDown = true;
      }
      // if (e.key === "Backspace" || e.key === 'Delete') {
      //  const view =  this.scene.viewer.getView();
      //  console.log(view);
      //   // this.model.removeSelection();
      // }
    });

    document.addEventListener("keyup", (e) => {
      this._shiftDown = false;
    });
  }

  _initPopupMenu() {
    const app = this,
      viewer = this._scene.viewer,
      model = this._model,
      sm = this._sm;

    var lastData, lastPoint;
    const popupMenu = new b2.controls.PopupMenu(viewer);
    popupMenu.onMenuShowing = function (e) {
      lastData = viewer.getSelectionModel().getLastData();
      lastPoint = viewer.getLogicalPoint(e);
      return true;
    };
    popupMenu.onAction = async (menuItem) => {
      switch (menuItem.label) {
        case "新增":
          const node = new b2.Follower({
            name: "空位置",
            size: { width: 20, height: 20 },
            styles: {
              "body.type": "vector",
              "vector.shape": "circle",
              "vector.fill.color": "rgba(255,255,255,0.4)",
              "vector.outline.width": 1,
              "vector.outline.color": "#000000",
              "vector.outline.pattern": [10, 0],
              "label.position": "center",
              "label.font": "10",
              "shadow.xoffset": 0,
              "shadow.yoffset": 0,
              "select.padding": 0,
            },
          });
          node.setCenterLocation(lastPoint);
          model.add(node);
          break;
        case "删除":
          model.removeSelection();
          break;
        case "清空":
          app?.clear();
          break;
        case "全选":
          sm.selectAll();
          break;
        case "分组":
          app.group();
          break;
        case "解散分组":
          app.unGroup();
          break;
        case "旋转分组":
          const { value: angle } = await Swal.fire({
            title: "请输入旋转角度",
            icon: "question",
            input: "range",
            inputLabel: "角度",
            inputAttributes: {
              min: -180,
              max: +180,
              step: 1,
            },
            inputValue: 0,
          });
          app.rotateGroup(angle);
          break;
        case "左右编号":
          console.log("左右编号");
          app.sortLeftRight();
          break;
        case "右左编号":
          console.log("右左编号");
          app.sortRightLeft();
          break;
        case "左单右双编号":
          console.log("左单右双编号");
          app.sortLeftSingleRightDouble();
          break;
        case "左双右单编号":
          console.log("左双右单编号");
          app.sortLeftDoubleRightSingle();
          break;
      }

      return;
      if (
        menuItem.label === "Expand Group" ||
        menuItem.label === "Collapse Group"
      ) {
        lastData.reverseExpanded();
      }
      if (menuItem.label === "Enter SubNetwork") {
        viewer.setCurrentSubNetwork(lastData);
      }
      if (menuItem.label === "Up SubNetwork") {
        viewer.upSubNetwork();
      }
      if (
        menuItem.label === "Expand LinkBundle" ||
        menuItem.label === "Collapse LinkBundle"
      ) {
        lastData.reverseBundleExpanded();
      }
      if (menuItem.label === "Critical") {
        lastData.getAlarmState().increaseNewAlarm(b2.AlarmSeverity.CRITICAL, 1);
      }
      if (menuItem.label === "Major") {
        lastData.getAlarmState().increaseNewAlarm(b2.AlarmSeverity.MAJOR, 1);
      }
      if (menuItem.label === "Minor") {
        lastData.getAlarmState().increaseNewAlarm(b2.AlarmSeverity.MINOR, 1);
      }
      if (menuItem.label === "Warning") {
        lastData.getAlarmState().increaseNewAlarm(b2.AlarmSeverity.WARNING, 1);
      }
      if (menuItem.label === "Indeterminate") {
        lastData
          .getAlarmState()
          .increaseNewAlarm(b2.AlarmSeverity.INDETERMINATE, 1);
      }
      if (menuItem.label === "Clear Alarm") {
      }
    };
    popupMenu.isVisible = function (menuItem) {
      if (lastData) {
        switch (menuItem.group) {
          case "Group":
            return lastData instanceof b2.Group;
            break;
          case "Link":
            return lastData instanceof b2.Link;
            break;
          default:
            return menuItem.group === "Element";
        }
      } else {
        return menuItem.group === "none";
      }
    };
    /*
     * {id, type, icon, label, visible, enabled, separator, action, items, selected, groupName}
     */
    popupMenu.isEnabled = function (menuItem) {
      if (lastData) {
        if (lastData instanceof b2.Group) {
          if (menuItem.group === "Group") {
            var expanded = lastData.isExpanded();
            return menuItem.expand ? !expanded : expanded;
          } else {
            return false;
          }
        }
      } else {
        if (menuItem.label === "清空") {
          return app.model.size() > 0;
        }
        if (menuItem.label === "全选") {
          return app.model.size() > 0;
        }
      }
      return true;
    };
    popupMenu.setMenuItems([
      {
        label: "新增",
        group: "none",
      },
      {
        label: "全选",
        group: "none",
      },
      {
        label: "清空",
        group: "none",
      },
      {
        label: "删除",
        group: "Element",
      },
      {
        label: "分组",
        group: "Element",
      },

      {
        label: "座位编号",
        group: "Element",
        groupName: "Element",
        items: [
          // {
          //   label: "Critical",
          //   group: "Element",
          //   items: [
          //     {
          //       label: "Critical2",
          //       group: "Element",
          //     },
          //     {
          //       label: "Major2",
          //       group: "Element",
          //     },
          //     {
          //       label: "Minor2",
          //       group: "Element",
          //     },
          //     {
          //       label: "Warning2",
          //       group: "Element",
          //     },
          //     {
          //       label: "Indeterminate2",
          //       group: "Element",
          //     },
          //   ],
          // },
          {
            label: "左右编号",
            group: "Element",
          },
          {
            label: "右左编号",
            group: "Element",
          },
          {
            label: "左单右双编号",
            group: "Element",
          },
          {
            label: "左双右单编号",
            group: "Element",
          },
        ],
      },
      {
        separator: true,
        group: "Element",
      },
      {
        label: "旋转分组",
        group: "Group",
      },
      {
        label: "解散分组",
        group: "Group",
      },
      // { label: 'Shape', group: 'Magnify', items: [
      // { label: 'rectangle', type: 'radio', groupName: 'Shape', group: 'Magnify', action: function () {
      //     magnifyInteraction.setShape('rectangle');
      //     magnifyInteraction.setYRadius(magnifyInteraction.getXRadius());
      // } },
      // { label: 'roundrect', type: 'radio', groupName: 'Shape', group: 'Magnify', action: function () {
      //     magnifyInteraction.setShape('roundrect');
      //     magnifyInteraction.setYRadius(magnifyInteraction.getXRadius());
      // } },
      // { label: 'oval', type: 'radio', groupName: 'Shape', group: 'Magnify', action: function () {
      //     magnifyInteraction.setShape('oval');
      //     magnifyInteraction.setYRadius(magnifyInteraction.getXRadius() * 0.75);
      // } },
      // { label: 'round', type: 'radio', groupName: 'Shape', selected: true, group: 'Magnify', action: function () {
      //     magnifyInteraction.setShape('round');
      //     magnifyInteraction.setYRadius(magnifyInteraction.getXRadius());
      // } },
      // { label: 'star', type: 'radio', groupName: 'Shape', group: 'Magnify', action: function () {
      //     magnifyInteraction.setShape('star');
      //     magnifyInteraction.setYRadius(magnifyInteraction.getXRadius());
      // } },
      // ] },
      // { label: 'Zoom', group: 'Magnify', items: [
      // { label: 2, type: 'radio', groupName: 'Zoom', selected: true, group: 'Magnify', action: function () { magnifyInteraction.setZoom(2); } },
      // { label: 3, type: 'radio', groupName: 'Zoom', group: 'Magnify', action: function () { magnifyInteraction.setZoom(3); } },
      // { label: 4, type: 'radio', groupName: 'Zoom', group: 'Magnify', action: function () { magnifyInteraction.setZoom(4); } }
      // ] },
      // { label: 'Size', group: 'Magnify', items: [
      // { label: 50, type: 'radio', groupName: 'Size', group: 'Magnify', action: function () { magnifyInteraction.setXRadius(50); magnifyInteraction.setYRadius(50); } },
      // { label: 100, type: 'radio', groupName: 'Size', selected: true, group: 'Magnify', action: function () { magnifyInteraction.setXRadius(100); magnifyInteraction.setYRadius(100); } },
      // { label: 200, type: 'radio', groupName: 'Size', group: 'Magnify', action: function () { magnifyInteraction.setXRadius(200); magnifyInteraction.setYRadius(200); } }
      // ] },
      // { label: 'BorderWidth', group: 'Magnify', items: [
      // { label: '1', type: 'radio', groupName: 'BorderWidth', selected: true, group: 'Magnify', action: function () { magnifyInteraction.setBorderWidth(1); } },
      // { label: '2', type: 'radio', groupName: 'BorderWidth', group: 'Magnify', action: function () { magnifyInteraction.setBorderWidth(2); } },
      // { label: '3', type: 'radio', groupName: 'BorderWidth', group: 'Magnify', action: function () { magnifyInteraction.setBorderWidth(3); } }
      // ] },
      // { label: 'BorderColor', group: 'Magnify', items: [
      // { label: 'black', type: 'radio', groupName: 'BorderColor', selected: true, group: 'Magnify', action: function () { magnifyInteraction.setBorderColor('black'); } },
      // { label: 'green', type: 'radio', groupName: 'BorderColor', group: 'Magnify', action: function () { magnifyInteraction.setBorderColor('green'); } },
      // { label: 'blue', type: 'radio', groupName: 'BorderColor', group: 'Magnify', action: function () { magnifyInteraction.setBorderColor('blue'); } }
      // ] },
      // { label: 'BackgroundColor', group: 'Magnify', items: [
      // { label: 'white', type: 'radio', groupName: 'BackgroundColor', selected: true, group: 'Magnify', action: function () { magnifyInteraction.setBackgroundColor('white'); } },
      // { label: 'transparent', type: 'radio', groupName: 'BackgroundColor', group: 'Magnify', action: function () { magnifyInteraction.setBackgroundColor('transparent'); } },
      // { label: 'black', type: 'radio', groupName: 'BackgroundColor', group: 'Magnify', action: function () { magnifyInteraction.setBackgroundColor('black'); } }
      // ] }
    ]);
  }
  /**
   *copy selection
   */
  _copySelection() {
    console.log("copy");
    let tmp_box = new b2.ElementBox();
    let selections = this._model.getSelectionModel().getSelection();
    if (selections.isEmpty()) {
      this._model.copyAnchor = null;
      return;
    }
    selections.forEach((element) => {
      tmp_box.add(element);
    });
    let datas = new b2.JsonSerializer(tmp_box, this._setting).serialize();
    this._model.copyAnchor = datas;
  }

  _getMinLeft(elements) {
    var xMin = Number.MAX_VALUE;
    var xMax = Number.MIN_VALUE;
    var yMin = Number.MAX_VALUE;
    var yMax = Number.MIN_VALUE;

    elements.forEach(function (node, index, array) {
      if (node instanceof b2.Node) {
        var x = node.getX();
        xMin = Math.min(x, xMin);
        var width = node.getWidth();
        xMax = Math.max(x + width, xMax);
        var y = node.getY();
        yMin = Math.min(y, yMin);
        var height = node.getHeight();
        yMax = Math.max(y + height, yMax);
      }
    });
    return { x: xMin, y: yMin, width: xMax - xMin, height: yMax - yMin };
  }

  /**
   * paste selection
   */
  _pasteSelection() {
    console.log("paste");
    const model = this._model,
      viewer = this._viewer;
    var lists = new b2.List();
    var oldSize = model.size();
    if (model.copyAnchor) {
      console.log(model.copyAnchor);
      new b2.JsonSerializer(model, this._setting).deserialize(model.copyAnchor);
    }
    var newSize = model.size();
    if (newSize > oldSize) {
      var array = model._dataList.toArray();
      // 获取选择网元最小的x、y坐标
      var minLeftPoint = this._getMinLeft(array.slice(oldSize));
      // 以当前右键选择点击的位置，计算出x、y坐标的偏移量
      var xOffset = this._lastPoint.x - minLeftPoint.x;
      var yOffset = this._lastPoint.y - minLeftPoint.y;
      for (var i = oldSize; i < newSize; i++) {
        lists.add(array[i]);
        array[i].setName(array[i].getName());
        if (array[i].getX != undefined) {
          array[i].setX(array[i].getX() + xOffset);
          array[i].setY(array[i].getY() + yOffset);
        }
      }
    }
    model.getSelectionModel().setSelection(lists);
  }

  _initOverview() {
    const overview = (this._overview = new b2.Overview(this._scene.viewer));
    overview.setFillColor("rgba(184,211,240,0.5)");
    const overviewDiv = document.createElement("div");
    overviewDiv.style.background = "#758a99";
    overviewDiv.style.position = "absolute";
    overviewDiv.style.right = "10px";
    overviewDiv.style.bottom = "20px";
    overviewDiv.style.width = "300px";
    overviewDiv.style.height = "200px";
    overviewDiv.style.display = "block";

    const overviewView = overview.getView();
    overviewView.style.left = "0px";
    overviewView.style.right = "0px";
    overviewView.style.top = "0px";
    overviewView.style.bottom = "0px";
    overviewDiv.appendChild(overviewView);
    document.body.appendChild(overviewDiv);
  }

  /**
   * init model
   */
  _initModel() {
    const model = this._model;
    // background color

    // test data
    let from = new b2.Follower({
      name: "From",
      location: {
        x: 200,
        y: 100,
      },
    });
    model.add(from);

    let to = new b2.Follower({
      name: "To",
      location: {
        x: 800,
        y: 500,
      },
    });
    model.add(to);

    let link = new b2.Link(
      {
        styles: {
          "link.type": "orthogonal.horizontal",
          "link.pattern": [20, 10],
          "link.width": 10,
          "link.color": "orange",
          "link.flow.color": "green",
        },
      },
      from,
      to
    );
    model.add(link);
  }

  reset() {
    this._model?.clear();
    this._scene.viewer.zoomReset(false);
  }
  /**
   * clear datas
   */
  clear() {
    if (this._model) {
      this._model.clear();
    }
  }

  /**
   * save model datas to json
   */
  save() {
    const model = this._model;
    const datas = new b2.JsonSerializer(model, this._setting).serialize();
    saveJSON(datas);
    console.log(datas);
    return datas;
  }

  /**
   * load test data
   */
  loadTest() {
    const model = this._model;
    new b2.JsonSerializer(model, this._setting).deserialize(
      JSON.stringify(testdatas)
    );
    _b2.callLater(() => {
      this._scene.zoomOverview();
    });
  }

  /**
   * load json datas
   * @param {JSON} json
   */
  load() {
    const model = this._model;
    this._registerImages();
    loadJSON().then((datas) => {
      console.log(datas);
      new b2.JsonSerializer(model, this._setting).deserialize(
        JSON.stringify(datas)
      );
      console.log(this._model);
    });
  }

  /**
   * enter draw rectangle mode
   */
  drawRect() {
    const viewer = this.scene.viewer;
    const sm = this._sm;
    viewer.setCreateElementInteractions((point) => {
      const node = new b2.Follower({
        name: "Rectangle",
        width: 200,
        height: 100,
        styles: {
          "body.type": "vector",
          "vector.shape": "rectangle",
          "vector.fill.color": "rgba(255,255,255,0.4)",
          "vector.outline.width": 2,
          "vector.outline.color": "#000000",
          "label.position": "center",
          "shadow.xoffset": 0,
          "shadow.yoffset": 0,
          "select.padding": 0,
        },
        clients: {
          selectable: true,
          movable: true,
        },
      });
      node.setLayerId("bottom");
      node.setCenterLocation(point);
      viewer.setEditInteractions();
      sm.setSelection(node);
      // this._selectionModel.setSelection(node);
      // this._lastData = node;
      // this._lastPoint = point;
      return node;
    });
  }

  /**
   * 创建文字
   */
  drawText() {
    const viewer = this.scene.viewer;
    const sm = this._sm;
    viewer.setCreateElementInteractions((point) => {
      const node = new b2.Follower({
        name: "文字",
        styles: {
          "body.type": "none",
          "label.position": "center",
        },
        clients: {
          selectable: true,
          movable: true,
        },
      });
      node.setLayerId("top");
      node.setCenterLocation(point);
      viewer.setDefaultInteractions();
      sm.setSelection(node);
      // this._lastData = node;
      // this._lastPoint = point;
      return node;
    });
  }

  /**
   * enter draw circle mode
   */
  drawCircle() {
    const viewer = this.scene.viewer;
    const sm = this._sm;
    viewer.setCreateElementInteractions((point) => {
      const node = new b2.Follower({
        name: "Circle",
        width: 200,
        height: 200,
        styles: {
          "body.type": "vector",
          "vector.shape": "circle",
          "vector.fill.color": "rgba(255,255,255,0.4)",
          "vector.outline.width": 2,
          "vector.outline.color": "#000000",
          "label.position": "center",
          "shadow.xoffset": 0,
          "shadow.yoffset": 0,
          "select.padding": 0,
        },
        clients: {
          selectable: true,
          movable: true,
        },
      });
      node.setLayerId("bottom");
      node.setCenterLocation(point);
      viewer.setEditInteractions();
      sm.setSelection(node);
      // this._model.getSelectionModel().setSelection(node);
      // this._lastData = viewer.getSelectionModel().getLastData();
      // this._lastPoint = point;
      return node;
    });
  }

  drawGrid() {
    const viewer = this.scene.viewer;
    const sm = this._sm;
    viewer.setCreateElementInteractions((point) => {
      const width = this._gridWidth,
        height = this._gridHeight,
        count = 6;
      const grid = new b2.Seat({
        name: "seat",
        location: { x: 100, y: 100 },
        clients: {
          width: width,
          height: height,
          "business.region": "", // 区域
          "business.tier": "", // 层数
          "business.row": "", // 排号
          "business.seat": "", //座位号
        },
        styles: {
          "grid.border": 1,
          "grid.deep": 1,
          "grid.deep.color": "rgba(0,0,0,0.2)",
          "grid.padding": 2,
          "grid.column.count": count,
          "grid.row.count": 1,
          "grid.fill": false,
          "grid.fill.color": "rgba(0,0,0,0.4)",
          "label.position": "left.left",
          "shadow.xoffset": 0,
          "shadow.yoffset": 0,
          "shadow.blur": 0,
          "select.padding": 0,
          "select.width": 2,
          "select.style": "border",
        },
      });
      grid.setLayerId("center");
      grid.setSize(width * count, height);
      grid.setCenterLocation(point);
      // this._model.getSelectionModel().setSelection(grid);
      // this._lastData = viewer.getSelectionModel().getLastData();
      // this._lastPoint = point;
      viewer.setDefaultInteractions();
      sm.setSelection(grid);
      return grid;
    });
  }
  /**
   * enter draw shape mode
   */
  drawShape() {
    const viewer = this.scene.viewer;
    const sm = this._sm;
    viewer.setCreateShapeNodeInteractions((points) => {
      const node = new b2.ShapeNode({
        name: "",
        styles: {
          "shapenode.closed": true,
          "vector.fill.color": "rgba(255,255,255,0.4)",
          "vector.outline.width": 2,
          "vector.outline.color": "#000000",
          "label.position": "center",
          "shadow.xoffset": 0,
          "shadow.yoffset": 0,
          "select.padding": 0,
        },
        clients: {
          selectable: true,
          movable: true,
        },
      });
      node.setLayerId("bottom");
      node.setPoints(points);
      // this._model.getSelectionModel().setSelection(node);
      // this._lastData = viewer.getSelectionModel().getLastData();
      // this._lastPoint = node.getCenterLocation();
      viewer.setEditInteractions();
      sm.setSelection(node);
      return node;
    });
  }

  /**
   * enter draw curve mode
   */
  drawCurve() {
    const viewer = this.scene.viewer;
    const sm = this._sm;
    viewer.setCreateShapeNodeInteractions((points) => {
      const node = new b2.ShapeNode({
        name: "curve",
        styles: {
          "shapenode.closed": true,
          "vector.fill.color": "rgba(255,255,255,0.4)",
          "vector.outline.width": 2,
          "vector.outline.color": "#000000",
          "label.position": "center",
          "shadow.xoffset": 0,
          "shadow.yoffset": 0,
          "select.padding": 0,
        },
        clients: {
          selectable: true,
          movable: true,
        },
      });
      node.setPoints(points);
      const segments = new b2.List();
      const count = points.toArray().length;
      console.log(count);

      points.toArray().forEach((point, index) => {
        console.log(index, index % 3, point);
        if (index === 0) {
          segments.add("moveto");
        } else if (index % 3 === 0) {
          segments.add("lineto");
        } else if (index % 3 === 1) {
          if (index <= count - 2) {
            segments.add("quadto");
          } else {
            segments.add("lineto");
          }
        } else if (index % 3 === 2) {
        }
      });
      node.setSegments(segments);
      node.setLayerId("bottom");
      // this._model.getSelectionModel().setSelection(node);
      viewer.setEditInteractions(false, true);
      sm.setSelection(node);
      return node;
    });
  }

  /**
   * do align
   */
  doAlign(type) {
    console.log(type);
    const selection = this._sm.getSelection();
    const nodes = selection.toArray();
    align(nodes, type);
  }

  group() {
    const app = this,
      model = this._model,
      sm = this._sm;
    // if (this._model.getSelectionModel().size() == 0) {
    //   alert("No Selection");
    // } else {
    //   const group = new b2.Group({
    //     name: "分组",
    //     styles: {
    //       "group.fill": false,
    //       "group.fill.color": "#FFFFFF",
    //       "group.shape": "roundrect",
    //       "group.outline.width": 2,
    //       "group.outline.color": "#000000",
    //       "group.padding": 0,
    //       "vector.outline.pattern": [2, 2],
    //       "shadow.xoffset": 0,
    //       "shadow.yoffset": 0,
    //       "label.position": "left.left",
    //     },
    //     clients: {
    //       selectable: true,
    //       movable: true,
    //     },
    //   });
    //   group.setLayerId("center");
    //   group.setExpanded(true);
    //   this._model.add(group);
    //   this._model
    //     .getSelectionModel()
    //     .getSelection()
    //     .forEach((element) => {
    //       if (element instanceof b2.Follower) {
    //         group.addChild(element);
    //       }
    //     });

    //   this._groups.push(group);
    //   group.c("row.number", this._groups.length);
    //   group.c("row.name", `${this._groups.length}排`);
    // }

    const selection = sm.getSelection();
    const group = new b2.Group({
      name: "分组",
      styles: {
        "group.fill": false,
        "group.fill.color": "#FFFFFF",
        "group.shape": "roundrect",
        "group.outline.width": 2,
        "group.outline.color": "#000000",
        "group.padding": 2,
        "vector.outline.pattern": [2, 2],
        "label.position": "left.left",
        "shadow.xoffset": 0,
        "shadow.yoffset": 0,
      },
      clients: {
        selectable: true,
        movable: true,
      },
    });
    group.setLayerId("center");
    group.setExpanded(true);
    model.add(group);
    selection.forEach((element) => {
      if (element instanceof b2.Follower) {
        group.addChild(element);
      }
    });
  }

  /**
   * unGroup
   */
  unGroup() {
    console.log(this._selectTarget);
    const app = this,
      model = this._model,
      sm = this._sm;
    const lastData = sm.getLastData();
    console.log(lastData);
    if (lastData instanceof b2.Group) {
      lastData
        .getChildren()
        .toArray()
        .forEach((child) => {
          lastData.removeChild(child);
        });
      this._model.remove(lastData);
    }
  }

  rotateGroup(angle) {
    const app = this,
      model = this._model,
      viewer = this._scene.viewer,
      sm = this._sm;
    const selected = sm.getLastData();
    console.log(selected);
    const children = selected.getChildren();
    let vx = vec2.fromValues(1, 0);
    if (selected && selected instanceof b2.Group) {
      const group = selected;
      const nodes = group.getChildren();
      let nodesArray = nodes.toArray().sort((a, b) => {
        return a.getCenterLocation().x - b.getCenterLocation().x;
      });
      const firstNode = nodesArray[0];
      const center = firstNode.getCenterLocation();
      const vcenter = vec2.fromValues(center.x, center.y);

      for (let i = 1; i < nodesArray.length; i++) {
        const n = nodesArray[i];
        const c = n.getCenterLocation();  
        const vc = vec2.fromValues(c.x, c.y);
        const vn = vec2.fromValues(c.x - center.x, c.y - center.y);
        const vr = vec2.create();
        vec2.rotate(vr, vc, vcenter, (angle * Math.PI) / 180);
        console.log(vr);
        n.setCenterLocation(vr[0], vr[1]);
      }
    }
  }

  /**
   * mirror X
   */
  _mirrorX() {
    if (this._selectTarget) {
      console.log("水平镜像");
      if (this._selectTarget instanceof b2.ShapeNode) {
        const points = this._selectTarget.getPoints();
        const center = this._selectTarget.getCenterLocation();
        const points2 = new b2.List();
        points.toArray().forEach((point, index) => {
          const dx = 2 * (center.x - point.x);
          points2.add({ x: point.x + dx, y: point.y });
        });
        let tmp_box = new b2.ElementBox();
        tmp_box.add(this._selectTarget);
        let datas = new b2.JsonSerializer(tmp_box, this._setting).serialize();
        tmp_box.clear();
        new b2.JsonSerializer(tmp_box, this._setting).deserialize(datas);
        const node = tmp_box.getDatas().get(0);
        if (node) {
          node.setPoints(points2);
          this._model.add(node);
          this._model.getSelectionModel().setSelection(node);
          tmp_box.clear();
        }
      }
    }
  }

  /**
   * mirror Y
   */
  _mirrorY() {
    if (this._selectTarget) {
      console.log("垂直镜像");
      if (this._selectTarget instanceof b2.ShapeNode) {
        const points = this._selectTarget.getPoints();
        const center = this._selectTarget.getCenterLocation();
        const points2 = new b2.List();
        points.toArray().forEach((point, index) => {
          const dy = 2 * (center.y - point.y);
          points2.add({ x: point.x, y: point.y + dy });
        });
        let tmp_box = new b2.ElementBox();
        tmp_box.add(this._selectTarget);
        let datas = new b2.JsonSerializer(tmp_box, this._setting).serialize();
        tmp_box.clear();
        new b2.JsonSerializer(tmp_box, this._setting).deserialize(datas);
        const node = tmp_box.getDatas().get(0);
        if (node) {
          node.setPoints(points2);
          this._model.add(node);
          this._model.getSelectionModel().setSelection(node);
          tmp_box.clear();
        }
      }
    }
  }

  /**
   * process host relation
   */
  _processHost(follower, event) {
    const viewer = this._viewer,
      model = this._model;
    if (follower == null) {
      return;
    }
    follower.setHost(null);
    follower.setParent(viewer.getCurrentSubNetwork());

    const point = viewer.getLogicalPoint(event);
    model.forEachByLayerReverse(
      (element) => {
        if (follower === element || !viewer.isVisible(element)) {
          return true;
        }
        if (
          element instanceof b2.Follower &&
          !b2.Util.containsPoint(element.getRect(), point)
        ) {
          return true;
        }
        if (element instanceof b2.Seat && element.getHost() !== follower) {
          let cellObject = element.getCellObject(point);
          if (cellObject != null) {
            follower.setHost(element);
            follower.setParent(element);
            follower.setStyle("follower.row.index", cellObject.rowIndex);
            follower.setStyle("follower.column.index", cellObject.columnIndex);
            return false;
          }
        }
        if (element instanceof b2.Follower && element.getHost() != follower) {
          follower.setHost(element);
          follower.setParent(element);
          return false;
        }
        return true;
      },
      null,
      this
    );
  }

  /**
   * init GUI
   */
  _initGUI() {}

  /**
   * init Property GUI
   */
  _initPropertyGUI() {
    const target = this._selectTarget;
    if (!target) return;
    const config = {
      property: {
        angle: target.getAngle(),
        name: target.getName(),
        region: target.c("business.region") || "",
        tier: target.c("business.tier") || "",
        row: target.c("business.row") || "",
        seat: target.c("business.seat") || "",
        visible: target.isVisible(),
        movable: target.c("movable") || false,
        selectable: target.c("selectable") || false,
      },
      styles: {
        "label.alpha": target.s("label.alpha") || 0,
        "label.font": target.s("label.font") || "30px arial",
        "label.position": target.s("label.position"),
        "label.xoffset": target.s("label.xoffset"),
        "label.yoffset": target.s("label.yoffset"),
        "label.rotate.angle": target.s("label.rotate.angle") || 0,
        "vector.fill": target.s("vector.fill"),
        "vector.fill.color": target.s("vector.fill.color"),
        "vector.outline.color": target.s("vector.outline.color"),
        "vector.outline.width": target.s("vector.outline.width"),
        "vector.outline.pattern": !!target.s("vector.outline.pattern"),
        "vector.shape": target.s("vector.shape"),
      },
      seat: {
        "grid.column.count": target.s("grid.column.count") || 1,
        "seat.width": target.s("seat.width") || 40,
        "seat.height": target.s("seat.height") || 40,
      },
      group: {
        "group.fill": target.s("group.fill"),
        "group.fill.color": target.s("group.fill.color"),
        "group.outline.color": target.s("group.outline.color") || "#CDCDCD",
        "group.outline.width": target.s("group.outline.width") || 2,
      },
    };

    if (!target) return;
    if (target instanceof b2.Follower) {
      if (this._guiproperty) {
        this._guiproperty.destroy();
      }
      this._guiproperty = new GUI({
        autoPlace: true,
        width: 220,
      });
      this._guiproperty.domElement.style.position = "absolute";
      this._guiproperty.domElement.style.right = "2px";
      this._guiproperty.domElement.style.top = "2px";

      let propertyFolder = this._guiproperty.addFolder("Property");
      if (config.property) {
        propertyFolder
          .add(config.property, "name")
          .name("Name")
          .onChange((v) => {
            target.setName(v);
            if (target instanceof b2.Group) {
              const children = target.getChildren();
              children.forEach((child) => {
                if (child instanceof b2.Seat) {
                  child.setName(v);
                }
              });
            }
          });
        propertyFolder
          .add(config.property, "region")
          .name("区域")
          .onChange((v) => {
            target.c("business.region", v);
            if (target instanceof b2.Group) {
              const seats = target.getChildren();
              seats.forEach((seat) => {
                if (seat instanceof b2.Seat) {
                  seat.c("business.region", v);
                  const followers = seat.getChildren();
                  followers.forEach((follower) => {
                    follower.c("business.region", v);
                  });
                }
              });
            }
          });
        propertyFolder
          .add(config.property, "tier")
          .name("层数")
          .onChange((v) => {
            target.c("business.tier", v);
            if (target instanceof b2.Group) {
              const children = target.getChildren();
              children.forEach((seat) => {
                if (seat instanceof b2.Seat) {
                  seat.c("business.tier", v);
                  const followers = seat.getChildren();
                  followers.forEach((follower) => {
                    follower.c("business.tier", v);
                  });
                }
              });
            }
          });

        propertyFolder
          .add(config.property, "row")
          .name("排号")
          .onChange((v) => {
            target.c("business.row", v);
            if (target instanceof b2.Group) {
              const children = target.getChildren();
              children.forEach((seat) => {
                if (seat instanceof b2.Seat) {
                  seat.c("business.row", v);
                  const followers = seat.getChildren();
                  followers.forEach((follower) => {
                    follower.c("business.row", v);
                  });
                }
              });
            }
          });

        propertyFolder
          .add(config.property, "seat")
          .name("座号")
          .onChange((v) => {
            target.c("business.seat");
          });

        propertyFolder
          .add(config.property, "angle")
          .name("Angle")
          .onChange((v) => {
            target.setAngle(v);
          });
        propertyFolder
          .add(config.property, "visible")
          .name("Visible")
          .onChange((v) => {
            target.setVisible(v);
          });
        propertyFolder
          .add(config.property, "movable")
          .name("Movable")
          .onChange((v) => {
            target.c("movable", v);
          });
        propertyFolder
          .add(config.property, "selectable")
          .name("Selectable")
          .onChange((v) => {
            target.c("selectable", v);
          });
      }

      if (config.styles) {
        propertyFolder
          .add(config.styles, "label.alpha", 0, 1, 0.1)
          .name("Label透明度")
          .onChange((v) => {
            target.s("label.alpha", v);
          });
        propertyFolder
          .add(config.styles, "label.font")
          .name("Label字体")
          .onChange((v) => {
            target.s("label.font", v);
          });
        propertyFolder
          .add(config.styles, "label.position", [
            "top.top",
            "center",
            "bottom.bottom",
            "left.left",
            "right.right",
          ])
          .name("Label位置")
          .onChange((v) => {
            target.s("label.position", v);
          });
        propertyFolder
          .add(config.styles, "label.rotate.angle")
          .name("Label旋转角度")
          .onChange((v) => {
            target.s("label.rotate.angle", v);
          });
        propertyFolder
          .add(config.styles, "label.xoffset")
          .name("Label.XOffset")
          .onChange((v) => {
            target.s("label.xoffset", v);
          });
        propertyFolder
          .add(config.styles, "label.yoffset")
          .name("Label.YOffset")
          .onChange((v) => {
            target.s("label.yoffset", v);
          });
        propertyFolder
          .add(config.styles, "vector.fill")
          .name("是否填充")
          .onChange((v) => {
            target.s("vector.fill", v);
          });
        propertyFolder
          .addColor(config.styles, "vector.fill.color")
          .name("填充色")
          .onChange((v) => {
            target.s("vector.fill.color", v);
          });
        propertyFolder
          .addColor(config.styles, "vector.outline.color")
          .name("边框色")
          .onChange((v) => {
            target.s("vector.outline.color", v);
          });
        propertyFolder
          .add(config.styles, "vector.outline.width")
          .name("边框线宽")
          .onChange((v) => {
            target.s("vector.outline.width", v);
          });
        propertyFolder
          .add(config.styles, "vector.outline.pattern")
          .name("虚线线框")
          .onChange((v) => {
            if (v) {
              target.s("vector.outline.pattern", [1, 1]);
            } else {
              target.s("vector.outline.pattern", [1, 0]);
            }
          });
        propertyFolder
          .add(config.styles, "vector.shape", ["rectangle", "roundrect"]) // rectangle
          .name("形状")
          .onChange((v) => {
            target.s("vector.shape", v);
          });
      }
      propertyFolder.open();

      if (target instanceof b2.Group) {
        propertyFolder
          .add(config.group, "group.fill")
          .name("填充")
          .onChange((v) => target.s("group.fill", v));
        propertyFolder
          .addColor(config.group, "group.fill.color")
          .name("填充色")
          .onChange((v) => target.s("group.fill.color", v));
        propertyFolder
          .addColor(config.group, "group.outline.color")
          .name("边框色")
          .onChange((v) => target.s("group.outline.color", v));
        propertyFolder
          .add(config.group, "group.outline.width")
          .name("边框线宽")
          .onChange((v) => target.s("group.outline.width", v));
      } else if (target instanceof b2.Seat) {
        propertyFolder
          .add(config.seat, "grid.column.count", 1, 50, 1)
          .name("Column")
          .onChange((v) => {
            const width = target.c("seat.width") || this._gridWidth,
              height = target.c("seat.height") || this._gridHeight;
            target.s("grid.column.count", v);
            target.setWidth(width * v);
          });
      }

      let businessFolder = this._guiproperty.addFolder("业务数据");
      businessFolder.open();
      if (target instanceof b2.Group) {
        // debugger;
        if (
          target._clientMap &&
          target._clientMap["row.number"] !== undefined
        ) {
          businessFolder.add(target._clientMap, "row.number").name("排号");
          businessFolder.add(target._clientMap, "row.name").name("第几排");
        }
      } else if (target instanceof b2.Follower) {
        if (
          target._clientMap &&
          target._clientMap["column.number"] !== undefined
        ) {
          businessFolder.add(target._clientMap, "column.number").name("列号");
          businessFolder.add(target._clientMap, "column.name").name("座位号");
          businessFolder
            .add(target._clientMap, "row.column.name")
            .name("几排几座");
          businessFolder
            .add(target._clientMap, "seat.stats", [
              "未分配",
              "未售",
              "锁座",
              "已售",
            ])
            .name("座位状态")
            .onChange((v) => {
              if (v === "未分配") {
                target.s("vector.outline.width", 1);
                target.s("vector.outline.pattern", [1, 1]);
                target.s("vector.fill.color", "#E3E3E3");
                target.s("body.type", "vector");
                target.s("vector.shape", "roundrect");
                target.setName(target.c("column.number"));
              } else if (v === "未售") {
                target.s("vector.outline.width", 0);
                target.s("vector.outline.pattern", [1, 0]);
                target.s("vector.fill.color", "#2A7FFF");
                target.s("vector.shape", "roundrect");
                target.s("body.type", "vector");
                target.setName(target.c("column.number"));
              } else if (v === "锁座") {
                target.s("vector.outline.width", 0);
                target.s("vector.outline.pattern", [1, 0]);
                target.s("vector.fill.color", "#E3E3E3");
                target.s("body.type", "default.vector");
                target.s("vector.shape", "roundrect");
                target.setName("");
                target.setImage("lock");
              } else if (v === "已售") {
                target.s("vector.outline.width", 0);
                target.s("vector.outline.pattern", [1, 0]);
                target.s("vector.fill.color", "#999999");
                target.s("vector.shape", "roundrect");
                target.setName("");
              }
              const selections = this._viewer
                .getSelectionModel()
                .getSelection();
              if (selections.size() > 1) {
                selections.toArray().forEach((selection) => {
                  if (v === "未分配") {
                    selection.s("vector.outline.width", 1);
                    selection.s("vector.outline.pattern", [1, 1]);
                    selection.s("vector.fill.color", "#E3E3E3");
                    selection.s("body.type", "vector");
                    selection.s("vector.shape", "roundrect");
                    selection.setName(selection.c("column.number"));
                  } else if (v === "未售") {
                    selection.s("vector.outline.width", 0);
                    selection.s("vector.outline.pattern", [1, 0]);
                    selection.s("vector.fill.color", "#2A7FFF");
                    selection.s("vector.shape", "roundrect");
                    selection.s("body.type", "vector");
                    selection.setName(selection.c("column.number"));
                  } else if (v === "锁座") {
                    selection.s("vector.outline.width", 0);
                    selection.s("vector.outline.pattern", [1, 0]);
                    selection.s("vector.fill.color", "#E3E3E3");
                    selection.s("body.type", "default.vector");
                    selection.s("vector.shape", "roundrect");
                    selection.setName("");
                    selection.setImage("lock");
                  } else if (v === "已售") {
                    selection.s("vector.outline.width", 0);
                    selection.s("vector.outline.pattern", [1, 0]);
                    selection.s("vector.fill.color", "#999999");
                    selection.s("vector.shape", "roundrect");
                    selection.setName("");
                  }
                });
              }
            });
          if (target._clientMap["seat.price"]) {
            const priceColor = [];
            for (let key in this._colorMap) {
              priceColor.push(key);
            }
            businessFolder
              .add(target._clientMap, "seat.price", priceColor)
              .name("价格")
              .onChange((v) => {
                const color = this._colorMap[v] || "red";
                target.s("vector.fill.color", color);
                const selections = this._viewer
                  .getSelectionModel()
                  .getSelection();
                if (selections.size() > 1) {
                  selections.toArray().forEach((selection) => {
                    selection.s("vector.fill.color", color);
                  });
                }
              });
          }
        }
      }
    } else {
      this._guiproperty && this._guiproperty.destroy();
      this._guiproperty = undefined;
    }
  }

  _registerImages() {
    const lock = {
      name: "lock",
      url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADYAAAA2CAYAAACMRWrdAAAAAXNSR0IArs4c6QAABWVJREFUaEPtmn9sU1UUx8/33jajKxlsg6hMNJJMhyYaYwgGYmT/YcRo/GPGPxypuLywLoMgKpEf1iARwSxo1pJH1Qb+MZn/qCEB/poaIRpiDCaE6aLGIDiD22Sh60Z77zF3eV3qdOt769sopPfP1/POOZ9zzr33vHsLukUHblEuqoDdbJmtZKySsYII9PT0yOHh4apwOBwYGRmR5qeamhqVTqdztbW14y0tLWquAjYnpWiABgcHlwNoIqKHiKhRCLHEQGit/yKifiI6x8x99fX1F+cC0Hew3t7eQF9f33ohxNPM/ASAGiJaACBgwJg5R0RjzDwC4ITW+rOmpqaTzc3N5rlvw1ewRCJRK4R4FoBFRKtcenlWKRUnos/b29uHXb5TVMw3MNu2q5n5OSLaDuD+KZbHiSjtPAsTUdWU388rpQ5KKT+xLGu0qNcuBHwDO3z48FohxD4ieoyIRN42M38B4AwzXzTPACxn5jUA1hX4p5n5K2betXnz5tMu/C4q4guYKUEp5RYies3MJ8fqVSKylVLHpZTf5TNhMquUekRKuYGITMkucuTHiOidUCh0sLW1NZ/dogDTCfgCduTIkTVa6y4Aq50FIgPgWC6Xey8ajV74P+PxeHxlIBDYwsytAELOe6cBvGxZ1rezJnJeLBnMtu2g1rpFCJEioiAzG9VmOX+prq7u9HRLudkShoaG1hLRB2Y7ACZcGddabxJC9FiWlS0FrmSweDy+EECnlNLMr4nBzB9LKXe2tbX9OpNzyWTyHqXUPgDP5+WUUjuZ+f1oNHrthoKZ+QXgVSHEjgJH9mez2Xc7OjoGZ3Kuu7u7PhgMbieiyXe11vuZ+UCpS3/JGbNt+w5m3gtgk9eoT5PtDwHstizrjxuaMQNGRG8R0Yt+gBHRR0S064aAMTMOHTq0SEq5MBgMLgMQBdBaMMfe0Fp/qrU2S/i0QwixQAjxDIA3C949xszxbDZ7WSl1bevWrVcBTKxIXobnUjS9YH9//8Na6w0AVjLz7UTUAGBFgeEfmLmoQyZAAMw+9mAB2C9EdAnAADNfEEIcb2xs/N5rL+kJLBaLiYaGhnVKqRiANUQ08SnirISmq/AS1P/Imq1iig7FzGdMaQ4MDHwdi8W0WwOePOnq6moIh8MxItpo9iy3RkqUM/vZ0XQ6Hdu2bdslt7o8gSUSiUellEeJ6F63BnyS+0kptbG9vf0bt/q8gj3ugN3t1oBPcr85YF+61VcBM5FKJBKVjLktGZdylVLMB2q+5liOmf80RgHcRkQTBzseRvllDMAFrbXZIs45IOY4LgLgvpsZzLRFr+RyuRMdHR1DBqS7u7tOSvmUEOJtIjLtmJtRXhlj5mPOB+fvhd4nk8k7nQ/Myca5CF15gRHR3vHx8X2dnZ3m+G1ypFKpBdevX3+diHa7SRcRlReYmVta6x3RaHSgECCRSKwAsEcIYXpON6O8wIjosjkVZuZT+cOZVCq1eGxs7EkhxAEiWuaGquwyZpxm5h+JyBxh/8zMAsADAMzXtpdGuuwy5rDx3wDMLYsBXQJgsdnSXGbLiJUlmAf/pxWtgOVD46UcKt29H7U3RUelFGdVirZtr2bmox4b2JITaLYMpdQL0Wj0rFtlnuaYbdt3mcs5AG1uDfghx8zJqqqqPZFI5F8dzEy6PYEZRbZtNzs9nrkLq/bD8el0MPMoAHNXtteyrF4vtjyDmQY2k8msArDe6SImr2W9GC4my8zm+vY8M58MhUJnI5HIjMflU/V5BjMKzKXdlStXQtXV1YFMJjMrHcXAQqEQj46O5pYuXZqZzf9A5sSpYk7Px+8VsPmIsp82KhnzM5rzoeuWzdg/o2jOVabBm44AAAAASUVORK5CYII=",
    };
    registerImage(lock, () => {
      this._viewer.invalidateElementUIs();
    });
    const select = {
      name: "select",
      url: "data:image/png;base64,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",
    };
    registerImage(select, () => {
      this._viewer.invalidateElementUIs();
    });
  }

  /**
   * 根据配置创建座位
   * @param {*} config
   */
  createSeat(config) {
    const model = this._model;
    console.log(config);
    for (let k in config) {
      const v = config[k];
      for (let i = 0; i < v; i++) {
        const node = new b2.Follower({
          id: `${k}-${i}`,
          name: `${k}-${i}`,
          size: { width: 20, height: 20 },
          styles: {
            "body.type": "vector",
            "vector.shape": "circle",
            "vector.fill.color": "rgba(255,255,255,0.4)",
            "vector.outline.width": 1,
            "vector.outline.color": "#000000",
            "vector.outline.pattern": [10, 0],
            "label.position": "center",
            "label.font": "10",
            "shadow.xoffset": 0,
            "shadow.yoffset": 0,
            "select.padding": 0,
          },
          location: {
            x: 200 + i * 40,
            y: 200 + k * 40,
          },
        });
        model.add(node);
      }
    }
  }

  /**
   * 左右编号 。如：10, 11, 12, 13, 14, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9
   */
  sortLeftRight() {
    const app = this,
      model = this._model,
      viewer = this._scene.viewer,
      sm = this._sm;
    const selected = sm.getLastData();
    if (selected && selected instanceof b2.Follower) {
      const group = selected.getParent();
      const nodes = group.getChildren();
      let nodesArray = nodes.toArray().sort((a, b) => {
        return a.getCenterLocation().x - b.getCenterLocation().x;
      });
      let currentIndex = 0;
      nodesArray.forEach((node, index) => {
        if (node.getId() === selected.getId()) {
          currentIndex = index;
          return;
        }
      });
      nodesArray.forEach((node, index) => {
        const name2 =
          index >= currentIndex
            ? index - currentIndex
            : nodesArray.length - currentIndex + index;
        node.setName2(`${name2}`);
      });
    }
  }

  /**
   * 右左编号, 如：9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 14, 13, 12, 11, 10
   */
  sortRightLeft() {
    const app = this,
      model = this._model,
      viewer = this._scene.viewer,
      sm = this._sm;
    const selected = sm.getLastData();
    if (selected && selected instanceof b2.Follower) {
      const group = selected.getParent();
      const nodes = group.getChildren();
      let nodesArray = nodes.toArray().sort((a, b) => {
        return a.getCenterLocation().x - b.getCenterLocation().x;
      });
      let currentIndex = 0;
      nodesArray.forEach((node, index) => {
        if (node.getId() === selected.getId()) {
          currentIndex = index;
          return;
        }
      });
      nodesArray.forEach((node, index) => {
        const name2 =
          index > currentIndex
            ? nodesArray.length - index + currentIndex
            : currentIndex - index;
        node.setName2(`${name2}`);
      });
    }
  }
  /**
   * 左单右双编号， 如： 9, 7, 5, 3, 1, 0 2 4 6 8 10 12 14
   */
  sortLeftSingleRightDouble() {
    const app = this,
      model = this._model,
      viewer = this._scene.viewer,
      sm = this._sm;
    const selected = sm.getLastData();
    if (selected && selected instanceof b2.Follower) {
      const group = selected.getParent();
      const nodes = group.getChildren();
      let nodesArray = nodes.toArray().sort((a, b) => {
        return a.getCenterLocation().x - b.getCenterLocation().x;
      });
      let currentIndex = 0;
      nodesArray.forEach((node, index) => {
        if (node.getId() === selected.getId()) {
          currentIndex = index;
          return;
        }
      });
      nodesArray.forEach((node, index) => {
        const name2 =
          index >= currentIndex
            ? (index - currentIndex) * 2
            : (currentIndex - index) * 2 - 1;
        node.setName2(`${name2}`);
      });
    }
  }

  /**
   * 左双右单编号，如：10，8, 6, 4, 2, 0, 1, 3, 5, 7, 9, 11, 13, 15
   */
  sortLeftDoubleRightSingle() {
    const app = this,
      model = this._model,
      viewer = this._scene.viewer,
      sm = this._sm;
    const selected = sm.getLastData();
    if (selected && selected instanceof b2.Follower) {
      const group = selected.getParent();
      const nodes = group.getChildren();
      let nodesArray = nodes.toArray().sort((a, b) => {
        return a.getCenterLocation().x - b.getCenterLocation().x;
      });
      let currentIndex = 0;
      nodesArray.forEach((node, index) => {
        if (node.getId() === selected.getId()) {
          currentIndex = index;
          return;
        }
      });
      nodesArray.forEach((node, index) => {
        const name2 =
          index > currentIndex
            ? (index - currentIndex) * 2 - 1
            : (currentIndex - index) * 2;
        node.setName2(`${name2}`);
      });
    }
  }
}
