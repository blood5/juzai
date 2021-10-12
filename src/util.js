/**
 * save and download json file
 * @param {*} json
 * @param {*} filename
 */
export function saveJSON(json, filename) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([json], { type: 'text/plain' }));
    link.download = filename || 'datas.json';
    link.dispatchEvent(new MouseEvent('click'));
}

/**
 * load json from local file
 * @param {*} json
 */
export function loadJSON(json) {
    return new Promise((res, rej) => {
        try {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.style.display = 'none';
            document.body.appendChild(input);

            input.onchange = (e) => {
                const file = e.target.files[0];
                const reader = new FileReader();

                reader.onload = (e) => {
                    if (e.target.readyState === 2) {
                        const datas = JSON.parse(e.target.result);
                        res(datas);
                    }
                };
                reader.readAsText(file);
            };
            input.click();
        } catch (e) {
            rej(e);
        }
    });
}

/**
 * 注入css
 * @param css
 * @returns
 */
export function insertStyle(css) {
    if (!css) {
        return;
    }
    if (typeof window === 'undefined') {
        return;
    }
    const style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.innerHTML = css;
    document.head.appendChild(style);
    return css;
}
/**
 *
 * @param {*} elements
 * @returns
 */
function _checkAndFilter(elements) {
    if (!elements || elements.length == 0) {
        return null;
    }
    elements = elements.filter(function (item, index, array) {
        return item instanceof b2.Node;
    });
    if (elements.length <= 1) {
        return null;
    }
    return elements;
}
/**
 *
 * @param {*} elements
 * @returns
 */
function _getBounds(elements) {
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
 *
 * @param {*} elements
 * @param {*} alignType
 * @returns
 */
export function align(elements, alignType) {
    if (!alignType) {
        throw new Error("align type can't be null");
    }
    elements = _checkAndFilter(elements);
    if (elements == null) {
        return;
    }
    var bounds = _getBounds(elements);
    if (bounds == null || bounds.x == Number.MAX_VALUE) {
        return;
    }
    alignType = alignType.toLowerCase();
    elements.forEach(function (node, index, array) {
        if (!(node instanceof b2.Node)) {
            return;
        }
        var x = node.getX();
        var y = node.getY();
        switch (alignType) {
            case 'left':
                x = bounds.x;
                break;
            case 'right':
                x = bounds.x + bounds.width - node.getWidth();
                break;
            case 'top':
                y = bounds.y;
                break;
            case 'bottom':
                y = bounds.y + bounds.height - node.getHeight();
                break;
            case 'horizontalcenter':
                x = bounds.x + (bounds.x + bounds.width - bounds.x - node.getWidth()) / 2;
                break;
            case 'verticalcenter':
                y = bounds.y + (bounds.y + bounds.height - bounds.y - node.getHeight()) / 2;
                break;
        }
        node.setLocation(x, y);
    });
}

/**
 *
 * @param {*} evt
 * @returns
 */
export function isCtrlDown(evt) {
    return evt.ctrlKey || evt.metaKey;
}

/**
 *
 * @param {*} evt
 * @returns
 */
export function isShiftDown(evt) {
    return evt.shiftKey;
}
