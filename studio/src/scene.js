import { findDimensions } from "./util";

export default class Scene {
  constructor(app) {
    this._app = app;
    this._init();
    this._initInteraction();
  }

  _init() {
    const viewer = (this._viewer = new b2.Viewer());
    const model = (this._model = this._viewer.getModel());
    const sm = (this._selectionModel = this._model.getSelectionModel());

    let view = viewer.getView();
    document.body.appendChild(view);

    viewer.setScrollBarVisible(false);

    viewer.setEditLineColor("#000000");
    viewer.setEditLineWidth(2);
    viewer.setResizePointFillColor("green");
    viewer.setToolTipEnabled(false);
    viewer.setDragToPan(false);
    viewer.setRectSelectEnabled(true);
    viewer.setZoomDivVisible(false);
    viewer.setTransparentSelectionEnable(false);
    viewer.setRectSelectEnabled(true);

    this.adjustBounds();
    window.onresize = (e) => {
      this.adjustBounds(e);
    };
  }

  get model() {
    return this._model;
  }

  get viewer() {
    return this._viewer;
  }

  get selectionModel() {
    return this._selectionModel;
  }
  get undoManager() {
    return this._undoManager;
  }

  adjustBounds(e) {
    const { winWidth, winHeight } = findDimensions();
    this._viewer?.adjustBounds({
      x: 0,
      y: 0,
      width: winWidth,
      height: winHeight,
    });
  }

  _initInteraction() {
    const viewer = this._viewer,
      sm = this._selectionModel;
    // b2.interaction.TouchInteraction.prototype.handleTouchstart = function (e) {
    //   _b2.html.preventDefault(e);
    //   this.isMoving = false;
    //   this.isSelecting = false;
    //   if (e.touches.length == 1) {
    //     var point = viewer.getLogicalPoint2(e);
    //     var element = (this._element = viewer.getElementAt(point));
    //     this._startTouchTime = new Date();
    //     this._currentTouchPoint = point;
    //     this._startTouchClient = this._currentTouchClient =
    //       this.getMarkerPoint(e);

    //     if (element) {
    //       if (!sm.contains(element)) {
    //         sm.appendSelection(element);
    //         if (sm.contains(element)) {
    //           this.isSelecting = true;
    //         }
    //       } else if (sm.contains(element)) {
    //         sm.removeSelection(element);
    //         this.isSelecting = true;
    //       }
    //     } else {
    //       this.isSelecting = false;
    //       sm.clearSelection();
    //     }

    //     _b2.interaction.handleClicked(viewer, e, element);

    //     if (
    //       this._endTouchTime &&
    //       this._startTouchTime.getTime() - this._endTouchTime.getTime() <=
    //         500 &&
    //       _b2.math.getDistance(this._endTouchClient, this._startTouchClient) <=
    //         20
    //     ) {
    //       delete this._endTouchTime;
    //       delete this._endTouchClient;
    //       _b2.interaction.handleDoubleClicked(viewer, e, element);
    //     } else {
    //       this._endTouchTime = this._startTouchTime;
    //       this._endTouchClient = this._startTouchClient;
    //     }
    //   } else {
    //     this._distance = _b2.touch.getDistance(e);
    //     this._zoom = viewer.getZoom();
    //   }
    // };

    viewer.addInteractionListener((e) => {
      const app = this._app,
        menu = app._menu,
        property = app.property;

      console.log(e.kind);
      console.log(menu);
      console.log(property);
      if (e.kind === "clickElement") {
        this._selectTarget = e.element;
        this._lastData = this._selectionModel.getLastData();
        this._lastPoint = viewer.getLogicalPoint(e.event);
        // this._initPropertyGUI();
      } else if (e.kind === "clickBackground") {
      }
    });

    // viewer.setMovableFunction((data) => {
    //   if (data.c("movable") === false) {
    //     return false;
    //   }
    //   return !this._lock;
    // });

    // this._selectionModel.addSelectionChangeListener((e) => {
    //   const data = this._selectionModel.getLastData();
    //   this._selectTarget = data;
    //   // this._initPropertyGUI();
    //   if (this._shiftDown && data instanceof b2.Seat) {
    //     const parent = data.getParent();
    //     if (parent && parent instanceof b2.Group) {
    //       const seats = parent.getChildren();
    //       viewer.getSelectionModel().appendSelection(seats);
    //     }
    //   }
    // });

    // this._selectionModel.setFilterFunction((data) => {
    //   if (data.c("selectable") === false) {
    //     return false;
    //   }
    //   return true;
    // });

    // this._viewer.setRectSelectFilter((data) => {
    //   if (data.c("rect.select") || data.getParent() instanceof b2.Seat)
    //     return true;
    //   return false;
    // });
  }

  zoomOverview() {
    this._viewer?.zoomOverview();
  }

  get selectTarget() {
    return this._selectTarget;
  }

  get lastData() {
    return this._lastData;
  }

  get lastPoint() {
    return this._lastPoint;
  }
}
