import { GUI } from 'dat.gui';
import { testdatas } from './datas';
import { align, insertStyle, isCtrlDown, isShiftDown, loadJSON, saveJSON } from './util';

export default class Application {
    constructor(canvas) {
        this._viewer = new b2.Viewer();
        this._model = this._viewer.getModel();
        this._selectionModel = this._model.getSelectionModel();
        this._gui = new GUI({ autoPlace: true, width: 160 });
        this._undoManager = this._model.getUndoManager();
        this._undoManager.setEnabled(true);

        this._canvas = canvas;
        this._selectTarget = null;
        this._colorMap = {
            180: '#2A7FFF',
            280: '#9720F2',
            380: '#FF2A78',
            480: '#00AE5C',
            580: '#E8E009',
            680: '#E35E2C',
            780: '#D42424',
            880: '#2AC5FF',
            980: '#713DEE',
            1080: '#F536E8',
        };

        this._initGUI();
        this._initViewer();
        this._initLayer();
        this._initOverview();
        this._initEvent();
        this._registerNormalImage('lock');
        this._lastData = null;
        this._lastPoint = null;
        this._gridWidth = 20;
        this._gridHeight = 20;
        this._groups = [];
        this._lock = false;

        this._setting = new b2.SerializationSettings();
        this._setting.setPropertyType('name2', 'string');
        this._setting.setPropertyType('angle', 'number');
        this._setting.setClientType('row.number', 'number');
        this._setting.setClientType('row.name', 'string');
        this._setting.setClientType('column.number', 'number');
        this._setting.setClientType('column.name', 'string');
        this._setting.setClientType('row.column.name', 'string');
        this._setting.setClientType('seat.stats', 'string');
        this._setting.setClientType('seat.price', 'number');
        this._setting.setClientType('movable', 'boolean');
        this._setting.setClientType('rect.select', 'boolean');
        this.loadTest();
    }

    /**
     *init viewer
     */
    _initViewer() {
        const viewer = this._viewer,
            sm = this._selectionModel;
        b2.interaction.TouchInteraction.prototype.handleTouchstart = function (e) {
            _b2.html.preventDefault(e);
            this.isMoving = false;
            this.isSelecting = false;
            if (e.touches.length == 1) {
                var point = viewer.getLogicalPoint2(e);
                var element = (this._element = viewer.getElementAt(point));
                this._startTouchTime = new Date();
                this._currentTouchPoint = point;
                this._startTouchClient = this._currentTouchClient = this.getMarkerPoint(e);

                if (element) {
                    if (!sm.contains(element)) {
                        sm.appendSelection(element);
                        if (sm.contains(element)) {
                            this.isSelecting = true;
                        }
                    } else if (sm.contains(element)) {
                        sm.removeSelection(element);
                        this.isSelecting = true;
                    }
                } else {
                    this.isSelecting = false;
                    sm.clearSelection();
                }

                _b2.interaction.handleClicked(viewer, e, element);

                if (this._endTouchTime && this._startTouchTime.getTime() - this._endTouchTime.getTime() <= 500 && $math.getDistance(this._endTouchClient, this._startTouchClient) <= 20) {
                    delete this._endTouchTime;
                    delete this._endTouchClient;
                    _b2.interaction.handleDoubleClicked(viewer, e, element);
                } else {
                    this._endTouchTime = this._startTouchTime;
                    this._endTouchClient = this._startTouchClient;
                }
            } else {
                this._distance = $touch.getDistance(e);
                this._zoom = viewer.getZoom();
            }
        };

        let view = viewer.getView();
        document.body.appendChild(view);
        let winWidth, winHeight;
        viewer.setEditLineColor('#000000');
        viewer.setEditLineWidth(2);
        viewer.setResizePointFillColor('green');
        viewer.setToolTipEnabled(false);
        // viewer.setDragToPan(false);
        viewer.setRectSelectEnabled(true);
        viewer.setZoomDivVisible(false);
        viewer.setTransparentSelectionEnable(true);
        viewer.setRectSelectEnabled(true);
        viewer.setScrollBarVisible(false);

        function findDimensions() {
            if (window.innerWidth) winWidth = window.innerWidth;
            else if (document.body && document.body.clientWidth) winWidth = document.body.clientWidth;
            if (window.innerHeight) winHeight = window.innerHeight;
            else if (document.body && document.body.clientHeight) winHeight = document.body.clientHeight;
            if (document.documentElement && document.documentElement.clientHeight && document.documentElement.clientWidth) {
                winHeight = document.documentElement.clientHeight;
                winWidth = document.documentElement.clientWidth;
            }
        }
        findDimensions();
        viewer.adjustBounds({
            x: 0,
            y: 0,
            width: window.innerWidth,
            height: window.innerHeight,
        });
        window.onresize = function (e) {
            findDimensions();
            viewer.adjustBounds({
                x: 0,
                y: 0,
                width: winWidth,
                height: winHeight,
            });
        };
        viewer.addInteractionListener((e) => {
            if (e.kind === 'clickElement') {
                this._selectTarget = e.element;
                this._lastData = this._selectionModel.getLastData();
                this._lastPoint = viewer.getLogicalPoint(e.event);
                this._initPropertyGUI();
            }
        });

        viewer.setMovableFunction((data) => {
            if (data.c('movable') === false) {
                return false;
            }
            return !this._lock;
        });

        this._selectionModel.addSelectionChangeListener((e) => {
            const data = this._selectionModel.getLastData();
            this._selectTarget = data;
            this._initPropertyGUI();
            if (this._shiftDown && data instanceof b2.Seat) {
                const parent = data.getParent();
                if (parent && parent instanceof b2.Group) {
                    const seats = parent.getChildren();
                    viewer.getSelectionModel().appendSelection(seats);
                }
            }
        });

        this._selectionModel.setFilterFunction((data) => {
            if (data.c('selectable') === false) {
                return false;
            }
            return true;
        });

        this._viewer.setRectSelectFilter((data) => {
            if (data.c('rect.select') || data.getParent() instanceof b2.Seat) return true;
            return false;
        });
    }

    _initLayer() {
        const layerBox = this._model.getLayerBox();
        const layer1 = new b2.Layer('bottom', 'bottom layer');
        // layer1.setMovable(false);
        // layer1.setEditable(false);
        // layer1.setVisible(false);
        const layer2 = new b2.Layer('center', 'center layer');
        const layer3 = new b2.Layer('top', 'top Layer');
        layerBox.add(layer1);
        layerBox.add(layer2);
        layerBox.add(layer3);
    }
    /**
     * init events
     */
    _initEvent() {
        this._model.addDataBoxChangeListener((e) => {
            const kind = e.kind,
                data = e.data;
            if (kind == 'add') {
            }
        }, this);

        document.addEventListener('keydown', (e) => {
            if (isCtrlDown(e)) {
                if (e.key === 'c') {
                    //ctrl+c
                    this._copySelection(e);
                } else if (e.key === 'v') {
                    //ctrl+v
                    this._pasteSelection();
                } else if (e.key === 'z') {
                    this._undoManager.undo();
                } else if (e.key === 'y') {
                    this._undoManager.redo();
                }
            }
            if (isShiftDown(e)) {
                this._shiftDown = true;
            }
        });

        document.addEventListener('keyup', (e) => {
            this._shiftDown = false;
        });
    }

    /**
     *copy selection
     */
    _copySelection() {
        console.log('copy');
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
        console.log('paste');
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
        const overview = (this._overview = new b2.Overview(this._viewer));
        overview.setFillColor('rgba(184,211,240,0.5)');
        const overviewDiv = document.createElement('div');
        overviewDiv.style.background = '#424242';
        overviewDiv.style.position = 'absolute';
        overviewDiv.style.right = '10px';
        overviewDiv.style.bottom = '20px';
        overviewDiv.style.width = '300px';
        overviewDiv.style.height = '200px';
        overviewDiv.style.display = 'block';

        const overviewView = overview.getView();
        overviewView.style.left = '0px';
        overviewView.style.right = '0px';
        overviewView.style.top = '0px';
        overviewView.style.bottom = '0px';
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
            name: 'From',
            location: {
                x: 200,
                y: 100,
            },
        });
        model.add(from);

        let to = new b2.Follower({
            name: 'To',
            location: {
                x: 800,
                y: 500,
            },
        });
        model.add(to);

        let link = new b2.Link(
            {
                styles: {
                    'link.type': 'orthogonal.horizontal',
                    'link.pattern': [20, 10],
                    'link.width': 10,
                    'link.color': 'orange',
                    'link.flow.color': 'green',
                },
            },
            from,
            to
        );
        model.add(link);
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
        new b2.JsonSerializer(model, this._setting).deserialize(JSON.stringify(testdatas));
    }

    /**
     * load json datas
     * @param {JSON} json
     */
    load() {
        const model = this._model;
        this._registerNormalImage('lock');
        loadJSON().then((datas) => {
            console.log(datas);
            new b2.JsonSerializer(model, this._setting).deserialize(JSON.stringify(datas));
            console.log(this._model);
        });
    }

    /**
     * enter draw rectangle mode
     */
    _drawRect() {
        this._viewer.setCreateElementInteractions((point) => {
            const node = new b2.Follower({
                name: 'Rectangle',
                width: 200,
                height: 100,
                styles: {
                    'body.type': 'vector',
                    'vector.shape': 'rectangle',
                    'vector.fill.color': 'rgba(255,255,255,0.4)',
                    'vector.outline.width': 2,
                    'vector.outline.color': '#000000',
                    'label.position': 'center',
                    'shadow.xoffset': 0,
                    'shadow.yoffset': 0,
                    'select.padding': 0,
                },
                clients: {
                    selectable: true,
                    movable: true,
                },
            });
            node.setLayerId('bottom');
            node.setCenterLocation(point);
            this._viewer.setEditInteractions();
            this._selectionModel.setSelection(node);
            this._lastData = node;
            this._lastPoint = point;
            return node;
        });
    }

    /**
     * enter draw circle mode
     */
    _drawCircle() {
        this._viewer.setCreateElementInteractions((point) => {
            const node = new b2.Follower({
                name: 'Circle',
                width: 200,
                height: 200,
                styles: {
                    'body.type': 'vector',
                    'vector.shape': 'circle',
                    'vector.fill.color': 'rgba(255,255,255,0.4)',
                    'vector.outline.width': 2,
                    'vector.outline.color': '#000000',
                    'label.position': 'center',
                    'shadow.xoffset': 0,
                    'shadow.yoffset': 0,
                    'select.padding': 0,
                },
                clients: {
                    selectable: true,
                    movable: true,
                },
            });
            node.setLayerId('bottom');
            node.setCenterLocation(point);
            this._viewer.setEditInteractions();
            this._model.getSelectionModel().setSelection(node);
            this._lastData = this._viewer.getSelectionModel().getLastData();
            this._lastPoint = point;
            return node;
        });
    }

    _drawGrid() {
        this._viewer.setCreateElementInteractions((point) => {
            const width = this._gridWidth,
                height = this._gridHeight,
                count = 6;
            const grid = new b2.Seat({
                name: 'seat',
                location: { x: 100, y: 100 },
                clients: {
                    width: width,
                    height: height,
                },
                styles: {
                    'grid.border': 1,
                    'grid.deep': 1,
                    'grid.deep.color': 'rgba(0,0,0,0.2)',
                    'grid.padding': 2,
                    'grid.column.count': count,
                    'grid.row.count': 1,
                    'grid.fill': false,
                    'grid.fill.color': 'rgba(0,0,0,0.4)',
                    'label.position': 'left.left',
                    'shadow.xoffset': 0,
                    'shadow.yoffset': 0,
                    'shadow.blur': 0,
                    'select.padding': 0,
                    'select.width': 2,
                    'select.style': 'border',
                },
            });
            grid.setLayerId('center');
            grid.setSize(width * count, height);
            grid.setCenterLocation(point);
            this._model.getSelectionModel().setSelection(grid);
            this._lastData = this._viewer.getSelectionModel().getLastData();
            this._lastPoint = point;
            this._viewer.setDefaultInteractions();
            return grid;
        });
    }
    /**
     * enter draw shape mode
     */
    _drawShape() {
        this._viewer.setCreateShapeNodeInteractions((points) => {
            const node = new b2.ShapeNode({
                name: '',
                styles: {
                    'shapenode.closed': true,
                    'vector.fill.color': 'rgba(255,255,255,0.4)',
                    'vector.outline.width': 2,
                    'vector.outline.color': '#000000',
                    'label.position': 'center',
                    'shadow.xoffset': 0,
                    'shadow.yoffset': 0,
                    'select.padding': 0,
                },
                clients: {
                    selectable: true,
                    movable: true,
                },
            });
            node.setLayerId('bottom');
            node.setPoints(points);
            this._model.getSelectionModel().setSelection(node);
            this._lastData = this._viewer.getSelectionModel().getLastData();
            this._lastPoint = node.getCenterLocation();
            this._viewer.setEditInteractions();
            return node;
        });
    }

    /**
     * enter draw curve mode
     */
    _drawCurve() {
        this._viewer.setCreateShapeNodeInteractions((points) => {
            const node = new b2.ShapeNode({
                name: 'curve',
                styles: {
                    'shapenode.closed': true,
                    'vector.fill.color': 'rgba(255,255,255,0.4)',
                    'vector.outline.width': 2,
                    'vector.outline.color': '#000000',
                    'label.position': 'center',
                    'shadow.xoffset': 0,
                    'shadow.yoffset': 0,
                    'select.padding': 0,
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
                    segments.add('moveto');
                } else if (index % 3 === 0) {
                    segments.add('lineto');
                } else if (index % 3 === 1) {
                    if (index <= count - 2) {
                        segments.add('quadto');
                    } else {
                        segments.add('lineto');
                    }
                } else if (index % 3 === 2) {
                }
            });
            node.setSegments(segments);
            node.setLayerId('bottom');
            this._model.getSelectionModel().setSelection(node);
            this._viewer.setEditInteractions(false, true);
            return node;
        });
    }

    /**
     * do align
     */
    _doAlign(type) {
        console.log(type);
        const nodes = this._viewer.getSelectionModel().getSelection().toArray();
        align(nodes, type);
    }

    _group() {
        if (this._model.getSelectionModel().size() == 0) {
            alert('No Selection');
        } else {
            const group = new b2.Group({
                name: '分组',
                styles: {
                    'group.fill': false,
                    'group.fill.color': '#FFFFFF',
                    'group.shape': 'roundrect',
                    'group.outline.width': 2,
                    'group.outline.color': '#000000',
                    'group.padding': 0,
                    'vector.outline.pattern': [2, 2],
                    'shadow.xoffset': 0,
                    'shadow.yoffset': 0,
                    'label.position': 'left.left',
                },
                clients: {
                    selectable: true,
                    movable: true,
                },
            });
            group.setLayerId('center');
            group.setExpanded(true);
            this._model.add(group);
            this._model
                .getSelectionModel()
                .getSelection()
                .forEach((element) => {
                    if (element instanceof b2.Follower) {
                        group.addChild(element);
                    }
                });

            this._groups.push(group);
            group.c('row.number', this._groups.length);
            group.c('row.name', `${this._groups.length}排`);
        }
    }

    /**
     * ungroup
     */
    _ungroup() {
        if (this._selectTarget instanceof b2.Group) {
            console.log(this._selectTarget);
            this._selectTarget
                .getChildren()
                .toArray()
                .forEach((child) => {
                    this._selectTarget.removeChild(child);
                });
            this._model.remove(this._selectTarget);
        }
    }

    /**
     * mirror X
     */
    _mirrorX() {
        if (this._selectTarget) {
            console.log('水平镜像');
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
            console.log('垂直镜像');
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
                if (element instanceof b2.Follower && !b2.Util.containsPoint(element.getRect(), point)) {
                    return true;
                }
                if (element instanceof b2.Seat && element.getHost() !== follower) {
                    let cellObject = element.getCellObject(point);
                    if (cellObject != null) {
                        follower.setHost(element);
                        follower.setParent(element);
                        follower.setStyle('follower.row.index', cellObject.rowIndex);
                        follower.setStyle('follower.column.index', cellObject.columnIndex);
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
    _initGUI() {
        const gui = this._gui;
        gui.domElement.parentElement.style.zIndex = 9999;
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
                    console.log('new');
                    this._initViewer();
                    this.clear();
                },
                clear: () => {
                    this.clear();
                },
                save: () => {
                    console.log('save');
                    this.save();
                },
                load: () => {
                    this.clear();
                    this.load();
                },
                delete: () => {
                    if (this._selectTarget) {
                        this._model.remove(this._selectTarget);
                    }
                },
                lock: false,
                zoomoverview: () => {
                    this._viewer.zoomOverview();
                },
                undo: () => {
                    this._undoManager.undo();
                },
                redo: () => {
                    this._undoManager.redo();
                },
            },
            draw: {
                default: () => {
                    this._viewer.setDefaultInteractions();
                },
                edit: () => {
                    this._viewer.setEditInteractions();
                },
                drawRect: () => {
                    console.log('绘制矩形');
                    this._drawRect();
                },
                drawCircle: () => {
                    console.log('绘制圆形');
                    this._drawCircle();
                },
                drawShape: () => {
                    console.log('绘制多边形');
                    this._drawShape();
                },
                drawCurve: () => {
                    console.log('绘制弧线');
                    this._drawCurve();
                },
                drawGrid: () => {
                    console.log('编排虚拟座位');
                    this._drawGrid();
                },
            },
            align: {
                top: () => {
                    this._doAlign('top');
                },
                bottom: () => {
                    this._doAlign('bottom');
                },
                left: () => {
                    this._doAlign('left');
                },
                right: () => {
                    this._doAlign('right');
                },
                horizontalcenter: () => {
                    this._doAlign('horizontalcenter');
                },
                verticalcenter: () => {
                    this._doAlign('verticalcenter');
                },
            },
            operation: {
                group: () => {
                    this._group();
                },
                ungroup: () => {
                    this._ungroup();
                },
                mirrorX: () => {
                    this._mirrorX();
                },
                mirrorY: () => {
                    this._mirrorY();
                },
            },
            business: {
                sort1: () => {
                    console.log('sort1');
                    const model = this._model;
                    if (this._selectTarget && this._selectTarget instanceof b2.Group) {
                        console.log(this._selectTarget);
                        const group = this._selectTarget,
                            row = {
                                name: group.c('row.name'),
                                number: group.c('row.number'),
                            };
                        console.log(row);

                        const grids = this._selectTarget.getChildren();
                        let gridsArray = grids.toArray().sort((a, b) => {
                            return a.getCenterLocation().x - b.getCenterLocation().x;
                        });
                        console.log(grids);
                        let seats = [],
                            seatCount = 0;
                        gridsArray.forEach((grid, index) => {
                            // grid.setName(index + 1);
                            const count = grid.getStyle('grid.column.count');
                            for (let i = seatCount; i < seatCount + count; i++) {
                                const node = new b2.Follower({
                                    name: i + 1,
                                    movable: false,
                                    styles: {
                                        'body.type': 'vector',
                                        'vector.shape': 'roundrect',
                                        // 'vector.fill.color': 'rgba(255,255,255,0.4)',
                                        'vector.fill.color': '#E3E3E3',
                                        'vector.outline.pattern': [10, 10],
                                        'vector.outline.width': 0,
                                        'vector.outline.color': '#000000',
                                        'label.position': 'center',
                                        'shadow.xoffset': 0,
                                        'shadow.yoffset': 0,
                                        'select.padding': 0,
                                    },
                                    clients: {
                                        'column.number': i + 1,
                                        'column.name': `${i + 1}号`,
                                        'row.column.name': `${row.name}${i + 1}号`,
                                        'seat.stats': '未分配',
                                        'seat.price': 100,
                                        movable: false,
                                        'rect.select': true,
                                    },
                                });
                                node.setLayerId('top');
                                node.setHost(grid);
                                node.setParent(grid);
                                node.setStyle('follower.column.index', i - seatCount);
                                model.add(node);
                            }
                            seatCount += count;
                        });
                        console.log(seatCount);
                    }
                },
                sort2: () => {
                    console.log('sort2');
                    const model = this._model;
                    if (this._selectTarget && this._selectTarget instanceof b2.Group) {
                        console.log(this._selectTarget);
                        const group = this._selectTarget,
                            row = {
                                name: group.c('row.name'),
                                number: group.c('row.number'),
                            };
                        console.log(row);
                        const grids = this._selectTarget.getChildren();
                        let gridsArray = grids.toArray().sort((a, b) => {
                            return b.getCenterLocation().x - a.getCenterLocation().x;
                        });
                        let seats = [],
                            seatCount = 0;
                        gridsArray.forEach((grid, index) => {
                            // grid.setName(index + 1);
                            const count = grid.getStyle('grid.column.count');
                            for (let i = seatCount; i < seatCount + count; i++) {
                                const node = new b2.Follower({
                                    name: i + 1,
                                    // movable: false,
                                    styles: {
                                        'body.type': 'vector',
                                        'vector.shape': 'rectangle',
                                        // 'vector.fill.color': 'rgba(255,255,255,0.4)',
                                        'vector.fill.color': '#E3E3E3',
                                        'vector.outline.width': 0,
                                        'vector.outline.color': '#000000',
                                        'label.position': 'center',
                                        'shadow.xoffset': 0,
                                        'shadow.yoffset': 0,
                                        'select.padding': 0,
                                    },
                                    clients: {
                                        'column.number': i + 1,
                                        'column.name': `${i + 1}号`,
                                        'row.column.name': `${row.name}${i + 1}号`,
                                        'seat.stats': '未分配',
                                        'seat.price': 100,
                                    },
                                });
                                node.setLayerId('top');
                                node.setHost(grid);
                                node.setParent(grid);
                                node.setStyle('follower.column.index', count - 1 - i + seatCount);
                                model.add(node);
                            }
                            seatCount += count;
                        });
                    }
                },
                sort3: () => {
                    console.log('sort3');
                    const model = this._model;
                    if (this._selectTarget && this._selectTarget instanceof b2.Group) {
                        console.log(this._selectTarget);
                        console.log(this._selectTarget);
                        const group = this._selectTarget,
                            row = {
                                name: group.c('row.name'),
                                number: group.c('row.number'),
                            };
                        console.log(row);
                        const grids = this._selectTarget.getChildren();
                        let gridsArray = grids.toArray().sort((a, b) => {
                            return a.getCenterLocation().x - b.getCenterLocation().x;
                        });
                        let seats = [],
                            seatCount = 0;
                        gridsArray.forEach((grid, index) => {
                            // grid.setName(index + 1);
                            const count = grid.getStyle('grid.column.count');
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
                                const count = grid.getStyle('grid.column.count');
                                const offset = half - startCount - 1;
                                const node = new b2.Follower({
                                    name: 1,
                                    // movable: false,
                                    styles: {
                                        'body.type': 'vector',
                                        'vector.shape': 'rectangle',
                                        // 'vector.fill.color': 'rgba(255,255,255,0.4)',
                                        'vector.fill.color': '#E3E3E3',
                                        'vector.outline.width': 0,
                                        'vector.outline.color': '#000000',
                                        'label.position': 'center',
                                        'shadow.xoffset': 0,
                                        'shadow.yoffset': 0,
                                        'select.padding': 0,
                                    },
                                    clients: {
                                        'column.number': 1,
                                        'column.name': `${1}号`,
                                        'row.column.name': `${row.name}${1}号`,
                                        'seat.stats': '未分配',
                                        'seat.price': 100,
                                    },
                                });
                                node.setLayerId('top');
                                node.setHost(grid);
                                node.setParent(grid);
                                node.setStyle('follower.column.index', offset);
                                model.add(node);
                                // sort left
                                for (let i = offset - 1; i >= 0; i--) {
                                    const node = new b2.Follower({
                                        name: left,
                                        movable: false,
                                        styles: {
                                            'body.type': 'vector',
                                            'vector.shape': 'rectangle',
                                            // 'vector.fill.color': 'rgba(255,255,255,0.4)',
                                            'vector.fill.color': '#E3E3E3',
                                            'vector.outline.width': 0,
                                            'vector.outline.color': '#000000',
                                            'label.position': 'center',
                                            'shadow.xoffset': 0,
                                            'shadow.yoffset': 0,
                                            'select.padding': 0,
                                        },
                                        clients: {
                                            'column.number': left,
                                            'column.name': `${left}号`,
                                            'row.column.name': `${row.name}${left}号`,
                                            'seat.stats': '未分配',
                                            'seat.price': 100,
                                        },
                                    });
                                    left += 2;
                                    node.setLayerId('top');
                                    node.setHost(grid);
                                    node.setParent(grid);
                                    node.setStyle('follower.column.index', i);
                                    model.add(node);
                                }
                                // sort right
                                for (let i = offset + 1; i <= count - 1; i++) {
                                    const node = new b2.Follower({
                                        name: right,
                                        movable: false,
                                        styles: {
                                            'body.type': 'vector',
                                            'vector.shape': 'rectangle',
                                            // 'vector.fill.color': 'rgba(255,255,255,0.4)',
                                            'vector.fill.color': '#E3E3E3',
                                            'vector.outline.width': 0,
                                            'vector.outline.color': '#000000',
                                            'label.position': 'center',
                                            'shadow.xoffset': 0,
                                            'shadow.yoffset': 0,
                                            'select.padding': 0,
                                        },
                                        clients: {
                                            'column.number': right,
                                            'column.name': `${right}号`,
                                            'row.column.name': `${row.name}${right}号`,
                                            'seat.stats': '未分配',
                                            'seat.price': 100,
                                        },
                                    });
                                    right += 2;
                                    node.setLayerId('top');
                                    node.setHost(grid);
                                    node.setParent(grid);
                                    node.setStyle('follower.column.index', i);
                                    model.add(node);
                                }
                            }
                        });
                        console.log(currentIndex);
                        for (let i = currentIndex - 1; i >= 0; i--) {
                            const grid = gridsArray[i];
                            const count = grid.getStyle('grid.column.count');
                            for (let j = count - 1; j >= 0; j--) {
                                const node = new b2.Follower({
                                    name: left,
                                    // movable: false,
                                    styles: {
                                        'body.type': 'vector',
                                        'vector.shape': 'rectangle',
                                        // 'vector.fill.color': 'rgba(255,255,255,0.4)',
                                        'vector.fill.color': '#E3E3E3',
                                        'vector.outline.width': 0,
                                        'vector.outline.color': '#000000',
                                        'label.position': 'center',
                                        'shadow.xoffset': 0,
                                        'shadow.yoffset': 0,
                                        'select.padding': 0,
                                    },
                                    clients: {
                                        'column.number': left,
                                        'column.name': `${left}号`,
                                        'row.column.name': `${row.name}${left}号`,
                                        'seat.stats': '未分配',
                                        'seat.price': 100,
                                    },
                                });
                                left += 2;
                                node.setLayerId('top');
                                node.setHost(grid);
                                node.setParent(grid);
                                node.setStyle('follower.column.index', j);
                                model.add(node);
                            }
                        }
                        for (let i = currentIndex + 1; i < gridsArray.length; i++) {
                            const grid = gridsArray[i];
                            const count = grid.getStyle('grid.column.count');
                            for (let j = 0; j < count; j++) {
                                const node = new b2.Follower({
                                    name: right,
                                    movable: false,
                                    styles: {
                                        'body.type': 'vector',
                                        'vector.shape': 'rectangle',
                                        // 'vector.fill.color': 'rgba(255,255,255,0.4)',
                                        'vector.fill.color': '#E3E3E3',
                                        'vector.outline.width': 0,
                                        'vector.outline.color': '#000000',
                                        'label.position': 'center',
                                        'shadow.xoffset': 0,
                                        'shadow.yoffset': 0,
                                        'select.padding': 0,
                                    },
                                    clients: {
                                        'column.number': right,
                                        'column.name': `${right}号`,
                                        'row.column.name': `${row.name}${right}号`,
                                        'seat.stats': '未分配',
                                        'seat.price': 100,
                                    },
                                });
                                right += 2;
                                node.setLayerId('top');
                                node.setHost(grid);
                                node.setParent(grid);
                                node.setStyle('follower.column.index', j);
                                model.add(node);
                            }
                        }
                    }
                },
                sort4: () => {
                    console.log('sort4');
                    alert('开发中！');
                },
                clear: () => {
                    console.log('清空座位');
                    const model = this._model;
                    if (this._selectTarget && this._selectTarget instanceof b2.Group) {
                        const grids = this._selectTarget.getChildren();
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

        let toolbarFolder = gui.addFolder('File');
        toolbarFolder.add(options.toolbar, 'new').name('新建场景');
        toolbarFolder.add(options.toolbar, 'clear').name('清空场景');
        toolbarFolder.add(options.toolbar, 'save').name('保存数据');
        toolbarFolder.add(options.toolbar, 'load').name('导入数据');
        toolbarFolder.add(options.toolbar, 'delete').name('删除数据');
        toolbarFolder
            .add(options.toolbar, 'lock')
            .name('锁定场景')
            .onChange((v) => {
                this._lock = v;
            });
        toolbarFolder.add(options.toolbar, 'zoomoverview').name('充满画布');
        toolbarFolder.add(options.toolbar, 'undo').name('Undo');
        toolbarFolder.add(options.toolbar, 'redo').name('Redo');
        toolbarFolder.open();

        let drawFolder = gui.addFolder('Draw');
        drawFolder.add(options.draw, 'default').name('默认交互');
        drawFolder.add(options.draw, 'edit').name('编辑模式');
        drawFolder.add(options.draw, 'drawRect').name('绘制矩形');
        drawFolder.add(options.draw, 'drawCircle').name('绘制圆形');
        drawFolder.add(options.draw, 'drawShape').name('绘制多边形');
        drawFolder.add(options.draw, 'drawCurve').name('绘制弧线');
        drawFolder.add(options.draw, 'drawGrid').name('编排虚拟座位');
        drawFolder.open();

        let alignFolder = gui.addFolder('Align');
        alignFolder.add(options.align, 'top').name('上对齐');
        alignFolder.add(options.align, 'bottom').name('下对齐');
        alignFolder.add(options.align, 'left').name('左对齐');
        alignFolder.add(options.align, 'right').name('右对齐');
        alignFolder.add(options.align, 'horizontalcenter').name('水平居中');
        alignFolder.add(options.align, 'verticalcenter').name('垂直居中');
        alignFolder.close();

        let operationFolder = gui.addFolder('Operation');
        operationFolder.add(options.operation, 'group').name('分组');
        operationFolder.add(options.operation, 'ungroup').name('解除分组');

        operationFolder.add(options.operation, 'mirrorX').name('水平镜像');
        operationFolder.add(options.operation, 'mirrorY').name('垂直镜像');
        operationFolder.close();

        let businessFolder = gui.addFolder('Business');
        businessFolder.add(options.business, 'sort1').name('向右顺序编号');
        businessFolder.add(options.business, 'sort2').name('向左顺序编号');
        businessFolder.add(options.business, 'sort3').name('单双号编号1');
        businessFolder.add(options.business, 'sort4').name('单双号编号2');
        businessFolder.add(options.business, 'clear').name('清除编号');
        businessFolder.close();
        let colorPriceFolder = gui.addFolder('票价配色');
        for (let key in this._colorMap) {
            console.log(key + '---' + this._colorMap[key]);
            colorPriceFolder.addColor(this._colorMap, key).name(`￥${key}`);
        }
        colorPriceFolder.close();
    }

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
                visible: target.isVisible(),
                movable: target.c('movable') || false,
                selectable: target.c('selectable') || false,
            },
            styles: {
                'label.alpha': target.s('label.alpha') || 0,
                'label.position': target.s('label.position'),
                'label.xoffset': target.s('label.xoffset'),
                'label.yoffset': target.s('label.yoffset'),
                'label.rotate.angle': target.s('label.rotate.angle') || 0,
                'vector.fill': target.s('vector.fill'),
                'vector.fill.color': target.s('vector.fill.color'),
                'vector.outline.color': target.s('vector.outline.color'),
                'vector.outline.width': target.s('vector.outline.width'),
                'vector.outline.pattern': !!target.s('vector.outline.pattern'),
                'vector.shape': target.s('vector.shape'),
            },
            seat: {
                'grid.column.count': target.s('grid.column.count') || 1,
                'seat.width': target.s('seat.width') || 40,
                'seat.height': target.s('seat.height') || 40,
            },
            group: {
                'group.fill': target.s('group.fill'),
                'group.fill.color': target.s('group.fill.color'),
                'group.outline.color': target.s('group.outline.color') || '#CDCDCD',
                'group.outline.width': target.s('group.outline.width') || 2,
            },
        };

        if (!target) return;
        if (target instanceof b2.Follower) {
            if (this._guiproperty) {
                this._guiproperty.destroy();
            }
            this._guiproperty = new GUI({ autoPlace: true, width: 220 });
            this._guiproperty.domElement.style.position = 'absolute';
            this._guiproperty.domElement.style.left = '0px';
            this._guiproperty.domElement.style.top = '0px';

            let propertyFolder = this._guiproperty.addFolder('Property');
            if (config.property) {
                propertyFolder
                    .add(config.property, 'name')
                    .name('Name')
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
                    .add(config.property, 'angle')
                    .name('Angle')
                    .onChange((v) => {
                        target.setAngle(v);
                    });
                propertyFolder
                    .add(config.property, 'visible')
                    .name('Visible')
                    .onChange((v) => {
                        target.setVisible(v);
                    });
                propertyFolder
                    .add(config.property, 'movable')
                    .name('Movable')
                    .onChange((v) => {
                        target.c('movable', v);
                    });
                propertyFolder
                    .add(config.property, 'selectable')
                    .name('Selectable')
                    .onChange((v) => {
                        target.c('selectable', v);
                    });
            }

            if (config.styles) {
                propertyFolder
                    .add(config.styles, 'label.alpha', 0, 1, 0.1)
                    .name('Label透明度')
                    .onChange((v) => {
                        target.s('label.alpha', v);
                    });
                propertyFolder
                    .add(config.styles, 'label.position', ['top.top', 'center', 'bottom.bottom', 'left.left', 'right.right'])
                    .name('Label位置')
                    .onChange((v) => {
                        target.s('label.position', v);
                    });
                propertyFolder
                    .add(config.styles, 'label.rotate.angle')
                    .name('Label旋转角度')
                    .onChange((v) => {
                        target.s('label.rotate.angle', v);
                    });
                propertyFolder
                    .add(config.styles, 'label.xoffset')
                    .name('Label.XOffset')
                    .onChange((v) => {
                        target.s('label.xoffset', v);
                    });
                propertyFolder
                    .add(config.styles, 'label.yoffset')
                    .name('Label.YOffset')
                    .onChange((v) => {
                        target.s('label.yoffset', v);
                    });
                propertyFolder
                    .add(config.styles, 'vector.fill')
                    .name('是否填充')
                    .onChange((v) => {
                        target.s('vector.fill', v);
                    });
                propertyFolder
                    .addColor(config.styles, 'vector.fill.color')
                    .name('填充色')
                    .onChange((v) => {
                        target.s('vector.fill.color', v);
                    });
                propertyFolder
                    .addColor(config.styles, 'vector.outline.color')
                    .name('边框色')
                    .onChange((v) => {
                        target.s('vector.outline.color', v);
                    });
                propertyFolder
                    .add(config.styles, 'vector.outline.width')
                    .name('边框线宽')
                    .onChange((v) => {
                        target.s('vector.outline.width', v);
                    });
                propertyFolder
                    .add(config.styles, 'vector.outline.pattern')
                    .name('虚线线框')
                    .onChange((v) => {
                        if (v) {
                            target.s('vector.outline.pattern', [1, 1]);
                        } else {
                            target.s('vector.outline.pattern', [1, 0]);
                        }
                    });
                propertyFolder
                    .add(config.styles, 'vector.shape', ['rect', 'roundrect'])
                    .name('形状')
                    .onChange((v) => {
                        target.s('vector.shape', v);
                    });
            }
            propertyFolder.open();

            if (target instanceof b2.Group) {
                propertyFolder
                    .add(config.group, 'group.fill')
                    .name('填充')
                    .onChange((v) => target.s('group.fill', v));
                propertyFolder
                    .addColor(config.group, 'group.fill.color')
                    .name('填充色')
                    .onChange((v) => target.s('group.fill.color', v));
                propertyFolder
                    .addColor(config.group, 'group.outline.color')
                    .name('边框色')
                    .onChange((v) => target.s('group.outline.color', v));
                propertyFolder
                    .add(config.group, 'group.outline.width')
                    .name('边框线宽')
                    .onChange((v) => target.s('group.outline.width', v));
            } else if (target instanceof b2.Seat) {
                propertyFolder
                    .add(config.seat, 'grid.column.count', 1, 50, 1)
                    .name('Column')
                    .onChange((v) => {
                        const width = target.c('seat.width') || this._gridWidth,
                            height = target.c('seat.height') || this._gridHeight;
                        target.s('grid.column.count', v);
                        target.setWidth(width * v);
                    });
            }

            let businessFolder = this._guiproperty.addFolder('业务数据');
            businessFolder.open();
            if (target instanceof b2.Group) {
                // debugger;
                if (target._clientMap && target._clientMap['row.number'] !== undefined) {
                    businessFolder.add(target._clientMap, 'row.number').name('排号');
                    businessFolder.add(target._clientMap, 'row.name').name('第几排');
                }
            } else if (target instanceof b2.Follower) {
                if (target._clientMap && target._clientMap['column.number'] !== undefined) {
                    businessFolder.add(target._clientMap, 'column.number').name('列号');
                    businessFolder.add(target._clientMap, 'column.name').name('座位号');
                    businessFolder.add(target._clientMap, 'row.column.name').name('几排几座');
                    businessFolder
                        .add(target._clientMap, 'seat.stats', ['未分配', '未售', '锁座', '已售'])
                        .name('座位状态')
                        .onChange((v) => {
                            if (v === '未分配') {
                                target.s('vector.fill.color', '#E3E3E3');
                                target.s('body.type', 'vector');
                                target.setName(target.c('column.number'));
                            } else if (v === '未售') {
                                target.s('vector.fill.color', '#2A7FFF');
                                target.s('body.type', 'vector');
                                target.setName(target.c('column.number'));
                            } else if (v === '锁座') {
                                target.s('vector.fill.color', '#E3E3E3');
                                target.s('body.type', 'default.vector');
                                target.setName('');
                                target.setImage('lock');
                            } else if (v === '已售') {
                                target.s('vector.fill.color', '#999999');
                                target.setName('');
                            }
                            const selections = this._viewer.getSelectionModel().getSelection();
                            if (selections.size() > 1) {
                                selections.toArray().forEach((selection) => {
                                    if (v === '未分配') {
                                        selection.s('vector.fill.color', '#E3E3E3');
                                        selection.s('body.type', 'vector');
                                        selection.setName(selection.c('column.number'));
                                    } else if (v === '未售') {
                                        selection.s('vector.fill.color', '#2A7FFF');
                                        selection.s('body.type', 'vector');
                                        selection.setName(selection.c('column.number'));
                                    } else if (v === '锁座') {
                                        selection.s('vector.fill.color', '#E3E3E3');
                                        selection.s('body.type', 'default.vector');
                                        selection.setName('');
                                        selection.setImage('lock');
                                    } else if (v === '已售') {
                                        selection.s('vector.fill.color', '#999999');
                                        selection.setName('');
                                    }
                                });
                            }
                        });
                    if (target._clientMap['seat.price']) {
                        const priceColor = [];
                        for (let key in this._colorMap) {
                            priceColor.push(key);
                        }
                        businessFolder
                            .add(target._clientMap, 'seat.price', priceColor)
                            .name('价格')
                            .onChange((v) => {
                                const color = this._colorMap[v] || 'red';
                                target.s('vector.fill.color', color);
                                const selections = this._viewer.getSelectionModel().getSelection();
                                if (selections.size() > 1) {
                                    selections.toArray().forEach((selection) => {
                                        selection.s('vector.fill.color', color);
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

    _registerNormalImage(name) {
        var image = new Image();
        image.src =
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADYAAAA2CAYAAACMRWrdAAAAAXNSR0IArs4c6QAABWVJREFUaEPtmn9sU1UUx8/33jajKxlsg6hMNJJMhyYaYwgGYmT/YcRo/GPGPxypuLywLoMgKpEf1iARwSxo1pJH1Qb+MZn/qCEB/poaIRpiDCaE6aLGIDiD22Sh60Z77zF3eV3qdOt769sopPfP1/POOZ9zzr33vHsLukUHblEuqoDdbJmtZKySsYII9PT0yOHh4apwOBwYGRmR5qeamhqVTqdztbW14y0tLWquAjYnpWiABgcHlwNoIqKHiKhRCLHEQGit/yKifiI6x8x99fX1F+cC0Hew3t7eQF9f33ohxNPM/ASAGiJaACBgwJg5R0RjzDwC4ITW+rOmpqaTzc3N5rlvw1ewRCJRK4R4FoBFRKtcenlWKRUnos/b29uHXb5TVMw3MNu2q5n5OSLaDuD+KZbHiSjtPAsTUdWU388rpQ5KKT+xLGu0qNcuBHwDO3z48FohxD4ieoyIRN42M38B4AwzXzTPACxn5jUA1hX4p5n5K2betXnz5tMu/C4q4guYKUEp5RYies3MJ8fqVSKylVLHpZTf5TNhMquUekRKuYGITMkucuTHiOidUCh0sLW1NZ/dogDTCfgCduTIkTVa6y4Aq50FIgPgWC6Xey8ajV74P+PxeHxlIBDYwsytAELOe6cBvGxZ1rezJnJeLBnMtu2g1rpFCJEioiAzG9VmOX+prq7u9HRLudkShoaG1hLRB2Y7ACZcGddabxJC9FiWlS0FrmSweDy+EECnlNLMr4nBzB9LKXe2tbX9OpNzyWTyHqXUPgDP5+WUUjuZ+f1oNHrthoKZ+QXgVSHEjgJH9mez2Xc7OjoGZ3Kuu7u7PhgMbieiyXe11vuZ+UCpS3/JGbNt+w5m3gtgk9eoT5PtDwHstizrjxuaMQNGRG8R0Yt+gBHRR0S064aAMTMOHTq0SEq5MBgMLgMQBdBaMMfe0Fp/qrU2S/i0QwixQAjxDIA3C949xszxbDZ7WSl1bevWrVcBTKxIXobnUjS9YH9//8Na6w0AVjLz7UTUAGBFgeEfmLmoQyZAAMw+9mAB2C9EdAnAADNfEEIcb2xs/N5rL+kJLBaLiYaGhnVKqRiANUQ08SnirISmq/AS1P/Imq1iig7FzGdMaQ4MDHwdi8W0WwOePOnq6moIh8MxItpo9iy3RkqUM/vZ0XQ6Hdu2bdslt7o8gSUSiUellEeJ6F63BnyS+0kptbG9vf0bt/q8gj3ugN3t1oBPcr85YF+61VcBM5FKJBKVjLktGZdylVLMB2q+5liOmf80RgHcRkQTBzseRvllDMAFrbXZIs45IOY4LgLgvpsZzLRFr+RyuRMdHR1DBqS7u7tOSvmUEOJtIjLtmJtRXhlj5mPOB+fvhd4nk8k7nQ/Myca5CF15gRHR3vHx8X2dnZ3m+G1ypFKpBdevX3+diHa7SRcRlReYmVta6x3RaHSgECCRSKwAsEcIYXpON6O8wIjosjkVZuZT+cOZVCq1eGxs7EkhxAEiWuaGquwyZpxm5h+JyBxh/8zMAsADAMzXtpdGuuwy5rDx3wDMLYsBXQJgsdnSXGbLiJUlmAf/pxWtgOVD46UcKt29H7U3RUelFGdVirZtr2bmox4b2JITaLYMpdQL0Wj0rFtlnuaYbdt3mcs5AG1uDfghx8zJqqqqPZFI5F8dzEy6PYEZRbZtNzs9nrkLq/bD8el0MPMoAHNXtteyrF4vtjyDmQY2k8msArDe6SImr2W9GC4my8zm+vY8M58MhUJnI5HIjMflU/V5BjMKzKXdlStXQtXV1YFMJjMrHcXAQqEQj46O5pYuXZqZzf9A5sSpYk7Px+8VsPmIsp82KhnzM5rzoeuWzdg/o2jOVabBm44AAAAASUVORK5CYII=';
        image.onload = (e) => {
            b2.Util.registerImage(name, image, image.width, image.height);
            this._viewer.invalidateElementUIs();
            _b2.callLater(() => {
                this._viewer.zoomOverview();
            });
        };
    }
}
