/* ************************************************************************
   Copyright: 2011 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */

/* ************************************************************************
#asset(qx/icon/${qx.icontheme}/32/status/dialog-error.png)
#asset(qx/icon/${qx.icontheme}/32/status/dialog-information.png)
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
     * @param cfg {Map} DashConfig map
     *  
     * *DashConfig*:
     * 
     * <pre>
     *   dimension: [ minX, minY, maxX, maxY ],
     *   items: { 'x:y': { x: y: w: h: } }
     * </pre>
     */

    construct : function(cfg) {
        this.base(arguments);
        var grid = this._grid = new qx.ui.layout.Grid(1,1);
        this._setLayout(grid);
        this.setDimensions(cfg.dimensions);
        this._atomMap = {};
        this._useMap = {};

        for (var x=1;x < this._width+1;x++){
            grid.setColumnFlex(x,1);
        }
        for (var y=1;y < this._height+1;y++){
            grid.setRowFlex(y,1);    
        }
        this._addGrowers();

        for (var key in cfg.items){
            var item = cfg.items[key];
            for (var xF = item.x;xF < item.x+item.w;xF++){
                 for (var yF = item.y;yF < item.y+item.h;yF++){
                     var keyF = String(xF) + ':' + String(yF);
                     this._useMap[keyF] = true;
                 }
            }
        }
        for (var x=0;x < this._width;x++){ 
            for (var y=0;y < this._height;y++){
                var a = this._makeAtom(x,y);
                this._add(a,{column: x+1, row: y+1});
            }
        }
        this._updateDeco();
    },

    properties: {
        minX: {
            init: 0,
            apply: '_updateDimensions',
        },
        maxX: {
            init: 5,
            apply: '_updateDimensions',
        },
        minY: {
            init: 0,
            apply: '_updateDimensions',
        },
        maxY: {
            init: 0,
            apply: '_updateDimensions',
        },
        dimensions: {
            group : ['minX','minY','maxX','maxY'],
            mode: 'shorthand'
        }
    },

    members : {
        _atomMap: null,
        _useMap: null,
        _firstX: null,
        _firstY: null,
        _first: true,
        _minX: null,
        _maxX: null,
        _minY: null,
        _maxY: null,
        _width: null,
        _height: null,

        _updateDimensions: function(newArgs,oldArgs){
            this._minX = this.getMinX();
            this._maxX = this.getMaxX();
            this._minY = this.getMinY();
            this._maxY = this.getMaxY();
            this._width = this._maxX - this._minX;
            this._height = this._maxY - this._minY;
        },

        _makeAtom: function(x,y){
            var key = String(x) + ':' + String(y);
            var atom = this._atomMap[key] = new qx.ui.basic.Atom("").set({
                width: 30,
                height: 30
            });

            atom.addListener('mouseover',function(e){
                if (this._first){
                    this._firstX = x;
                    this._firstY = y;
                }
                this._updateDeco(this._firstX,this._firstY,x,y);
            },this);

            atom.addListener('click',function(e){
                this._first = this._first ? false : true;
            },this);

            return atom;
        },
        _updateDeco: function(xA,yA,xB,yB){
            var collision = yB === null;
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
                        if (this._useMap[realKey]){
                            collision = true;
                            break;
                        }
                    }
                }
            }
            for (var x = 0;x < this._width;x++){ 
                for (var y = 0;y < this._height;y++){                     
                    var realKey = String(x+this._minX) + ':' + String(y+this._minY);
                    var gridKey = String(x) + ':' + String(y);
                    var c = '#f8f8f8';
                    if (this._useMap[realKey]){                        
                        c = '#a0a0a0';
                    }
                    if (!collision){
                        if (y >= yA && y <= yB && x >= xA && x <= xB){
                            c = '#ccf';
                        }
                    }
                    this._atomMap[gridKey].set({
                        backgroundColor: c
                    });

                }
            }            
        },

        _makeGrowHandle: function(){
            var handle = new qx.ui.basic.Atom("+").set({
                center: true,
                width: 15,
                height: 15
            });
            handle.addListener('mouseover',function(e){
                handle.setBackgroundColor('#fff0f0');
            });
            handle.addListener('mouseout',function(e){
                handle.setBackgroundColor('transparent');
            });
            return handle;
        },

        _addGrowers: function(){
            var left = this._makeGrowHandle();
            var right = this._makeGrowHandle();
            var top = this._makeGrowHandle();
            var bottom = this._makeGrowHandle();
            var that = this;
            var addHandles = function(){
                that._add(left  ,{column: 0,             row: 1,              rowSpan: that._height});
                that._add(right ,{column: that._width+1, row: 1,              rowSpan: that._height});
                that._add(top   ,{column: 1,             row: 0,              colSpan: that._width});
                that._add(bottom,{column: 1,             row: that._height+1, colSpan: that._width});
            };

            var addCol = function(){
                addHandles();
                for(var y=0;y<that._height;y++){
                    var x = that._width-1;
                    var a = that._makeAtom(x,y);
                    that._add(a,{column: x+1, row: y+1});
                }
                that._grid.setColumnFlex(that._height+1,1);
                that._updateDeco();
            };

            var addRow = function(){
                addHandles();
                for(var x=0;x<that._width;x++){
                    var y = that._height-1;
                    var a = that._makeAtom(x,y);
                    that._add(a,{column: x+1, row: y+1});
                }
                that._grid.setRowFlex(that._width+1,1);        
                that._updateDeco();
            };

            left.addListener('click',function(e){
                that.setMinX(that.getMinX()-1);
                addCol();
            });

            right.addListener('click',function(e){
                that.setMaxX(that.getMaxX()+1);
                addCol();
            });

            top.addListener('click',function(e){
                that.setMinY(that.getMinY()-1);
                addRow();
            });

            bottom.addListener('click',function(e){
                that.setMaxY(that.getMaxY()+1);
                addRow();
            });

            addHandles();
        }
    }
});
