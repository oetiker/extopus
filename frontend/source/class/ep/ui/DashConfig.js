/* ************************************************************************
   Copyright: 2011 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */

/**
 * place an item into dashboard config
 **/
qx.Class.define("ep.ui.DashConfig", {
    extend : qx.ui.core.Widget,

    /**
     * Display a dashboard configurator, for placing a new dashboard item
     * into a grid setup. The grid setup itself can be changed while
     * placeing the data.
     *
     * @param minX {Number} minimal X coordinate
     * @param minY {Number} minimal Y coordinate
     * @param maxX {Number} maximal X coordinate
     * @param maxY {Number} maximal Y coordinate
     */
  
     /* *DashConfig*:
     * 
     * <pre>
     *   dimension: [ minX, minY, maxX, maxY ],
     *   items: { 'x:y': { x: y: w: h: } }
     * </pre>
     */

    construct : function(masterGrid) {
        this.base(arguments);
        this.setBackgroundColor('#ffffff');
        var grid = this._grid = new qx.ui.layout.Grid(1,1);
        this._setLayout(grid);
        this._atomMap = {};
        this._blockMap = {};
        this._masterGrid = masterGrid;

        this.setDimensions([0,0,1,1]);

        for (var x=1;x < this._width+1;x++){
            grid.setColumnFlex(x,1);
        }
        for (var y=1;y < this._height+1;y++){
            grid.setRowFlex(y,1);    
        }
        this._addGrowHandles();

        for (var x=0;x < this._width;x++){ 
            for (var y=0;y < this._height;y++){
                var a = this._makeAtom(x,y);
                this._add(a,{column: x+1, row: y+1});
            }
        }
        this.addListener('appear',function(){
            this._first = true;
            ep.ui.ShortNote.getInstance().setNote(this.tr("Select a location for the visualizer."));
            this._updateDeco();
        },this);
        this._blockMap = {};
    },

    events: {
        /**
         * fire when a location in the dashboard has been selected.
         */
        locationSelected: 'qx.event.type.Data'
    },

    properties: {
        /**
         * minimal X coordinate
         */
        minX: {
            init: 0,
            apply: '_updateDimensions'
        },
        /**
         * maximal X coordinate
         */
        maxX: {
            init: 5,
            apply: '_updateDimensions'
        },
        /**
         * minimal Y coordinate
         */
        minY: {
            init: 0,
            apply: '_updateDimensions'
        },
        /**
         * maximal Y coordinate
         */
        maxY: {
            init: 0,
            apply: '_updateDimensions'
        },
        /**
         * set minX, minY, maxX, maxY
         */
        dimensions: {
            group : ['minX','minY','maxX','maxY'],
            mode: 'shorthand'
        }
    },

    members : {
        _atomMap: null,
        _blockMap: null,
        _firstX: null,
        _firstY: null,
        _first: true,
        _minX: null,
        _maxX: null,
        _minY: null,
        _maxY: null,
        _width: null,
        _height: null,
        _collision: true,
        _masterGrid: null,
        _ghRight: null,
        _ghBottom: null,
        /**
         * adjust the grid size to that of the master grid 
         */
        syncGrid: function(){
            var mgcc = this._masterGrid.getColumnCount();
            for (var x = this._width; x < mgcc; x++){
                this.setMaxX(this.getMaxX()+1);
                this._addCol();
            }
            var mgrc = this._masterGrid.getRowCount();
            for (var y = this._height; y < mgrc; y++){
                this.setMaxY(this.getMaxY()+1);
                this._addRow();
            }
        },
        /**
         * let the user pick a position on the grid and run the callback once
         * it is done, providing a position argument.
         *
         * @param callback {Function} function to call with position arument
         * @param context {Object} context for the function call
         */
        selectPosition: function(callback,context){
            this._updateDeco();
            this.addListenerOnce('locationSelected',function(e){
                callback.apply(context,[e.getData()]);
            })
        },

        blockPosition: function(item){
            for (var xF = item.column;xF < item.column+(item.colSpan || 1);xF++){
                 for (var yF = item.row;yF < item.row+(item.rowSpan || 1);yF++){
                     var keyF = String(xF) + ':' + String(yF);
                     this._blockMap[keyF] = true;
                    this.debug("block "+keyF);
                 }
            }
        },
        freePosition: function(item){
            for (var xF = item.column;xF < item.column+(item.colSpan || 1);xF++){
                 for (var yF = item.row;yF < item.row+(item.rowSpan || 1);yF++){
                     var keyF = String(xF) + ':' + String(yF);
                    this.debug("free "+keyF);
                     delete this._blockMap[keyF];
                 }
            }
        },

        _updateDimensions: function(newArgs,oldArgs){
            this._minX = this.getMinX();
            this._maxX = this.getMaxX();
            this._minY = this.getMinY();
            this._maxY = this.getMaxY();
            this._width = this._maxX - this._minX + 1;
            this._height = this._maxY - this._minY + 1;
        },

        _makeAtom: function(x,y){
            var key = String(x) + ':' + String(y);
            var atom = this._atomMap[key] = new qx.ui.basic.Atom("").set({
                minWidth: 40,
                minHeight: 40
            });

            atom.addListener('mouseover',function(e){
                if (this._first){
                    this._firstX = x;
                    this._firstY = y;
                }
                this._updateDeco(this._firstX,this._firstY,x,y);
            },this);

            atom.addListener('mousedown',function(e){
                if (!this._collision){
                    this._first = false;
                }
            },this);
            atom.addListener('mouseup',function(e){
                if (!this._first && !this._collision){
                    var position = {
                        column: this._firstX,
                        row:    this._firstY,
                        colSpan: x - this._firstX + 1,
                        rowSpan: y - this._firstY + 1
                    };
                    this.fireDataEvent('locationSelected',position);
                }
            },this);

            return atom;
        },
        _updateDeco: function(xA,yA,xB,yB){
            var collision = this._collision = ( yB === null);
            if (xA > xB){
                var c = xA;
                xA = xB;
                xB = c;
            }
            if (yA > yB){
                var c = yA;
                yA = yB;
                yB = c;
            }
            /* can't  paint any square colliding */
            if (!collision){
                for (var x = xA;x <= xB;x++){
                    for (var y = yA;y <= yB;y++){
                         var realKey = String(x+this._minX) + ':' + String(y+this._minY);
                         if (this._blockMap[realKey]){
                             collision = this._collision = true;
                             break;
                         }
                    }
                }
            }
            if (collision){
                ep.ui.ShortNote.getInstance().setNote(this.tr("Select a location by dragging the mouse. Enlarge the grid by taping the [+] buttons."));
            }
            for (var x = 0;x < this._width;x++){ 
                for (var y = 0;y < this._height;y++){                     
                    var realKey = String(x+this._minX) + ':' + String(y+this._minY);
                    var gridKey = String(x) + ':' + String(y);
                    var c = '#bbb';
                    if (this._blockMap[realKey]){                        
                        c = '#5b3030';
                    }
                    if (!collision){
                        if (y >= yA && y <= yB && x >= xA && x <= xB){
                            c = '#86e300';
                        }
                    }
                    this._atomMap[gridKey].set({
                        backgroundColor: c
                    });

                }
            } 
        },

        _makeGrowHandle: function(icon){
            var handle = new qx.ui.form.Button(null,icon).set({
                center: true,
                show: 'icon',
                padding: [6,6,6,6],
                margin: [2,2,2,2],
                toolTipText: this.tr("Grow Dashboard")
            });
            return handle;
        },

        _addGrowHandles: function(){
            var right = this._ghRight = this._makeGrowHandle("@MaterialIcons/note_add/32");
            var bottom = this._ghBottom = this._makeGrowHandle("@MaterialIcons/note_add/32");
            var that = this;
            right.addListener('tap',function(e){
                that.setMaxX(that.getMaxX()+1);
                that._addCol();
            });
            bottom.addListener('tap',function(e){
                that.setMaxY(that.getMaxY()+1);
                that._addRow();
            });
            that._addHandles();
        },
        _addHandles: function(){
            this._add(this._ghRight ,{column: this._width+1, row: 1,              rowSpan: this._height});
            this._add(this._ghBottom,{column: 1,             row: this._height+1, colSpan: this._width});
         },

        _addCol: function(){
            this._addHandles();
            for(var y=0;y<this._height;y++){
                var x = this._width-1;
                var a = this._makeAtom(x,y);
                this._add(a,{column: x+1, row: y+1});
            }
            this._grid.setColumnFlex(this._width,1);
            this._updateDeco();
         },

         _addRow: function(){
            this._addHandles();
            for(var x=0;x<this._width;x++){
                var y = this._height-1;
                var a = this._makeAtom(x,y);
                this._add(a,{column: x+1, row: y+1});
            }
            this._grid.setRowFlex(this._height,1);        
            this._updateDeco()
        }
    }
});
