/* ************************************************************************
   Copyright: 2011 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */

/**
 * Dashboard Widget showing multiple of visualization Plugins on a single page
 */
qx.Class.define("ep.ui.DashBoard", {
    extend : qx.ui.tabview.Page,
    /**
     * create a new dashboard Page. Dashboard page names are for 'fun' only, they register
     * a unique identity with the {ep.ui.DashManager}.
     * 
     * @param name {String} name for the dashboard page
     * @param dimension {Array} minX,minY,maxX,maxY
     */
    construct : function(name,dimension) {                
        this.base(arguments, name);        
        this.setLayout(new qx.ui.layout.Grow);
        this.add(this._boardView = new qx.ui.core.Widget());
        this._boardView._setLayout(this._boardGrid = new qx.ui.layout.Grid(1,1));
        this._boardView.set({
            backgroundColor: '#bfbfbf'
        });        
        this.add(this._cfgView = new ep.ui.DashConfig(dimension));
        this._cfgView.hide();
        if (name == null){
            this.addListenerOnce("appear",function(){
                this.editLabel();
            });
        }
    },
    properties: {
        config: {
            apply: '_applyConfig'
        }
    },
    
    members : {
        _cfgView: null,
        _boardView: null,
        _boardGrid: null,
        removeVisualizer: function(handle){
        },
        cfgPosition: function(){
            /* show DashConfig */
        },
        _applyConfig: function(newCfg,oldCfg){
        },
        /**
         * edit the label of the DashBoard
         */
        editLabel: function(){
            var popup = new qx.ui.popup.Popup(new qx.ui.layout.Grow()).set({
                offsetTop: -15,
                offsetLeft: 10,
                autoHide: false
            });
            var edit = new qx.ui.form.TextField(this.getLabel()).set({
                placeholder: this.tr("New Dashboard Name"),
                width: 200,
                required: true
            });
            edit.addListener("changeValue",function(e){
                var name = e.getData();
                if (name){
                    this.setLabel(name);
                    popup.hide();
                    this.getApplicationRoot().remove(popup);
                    popup.dispose();
                }
            },this);
            edit.addListener("appear",function(){
                edit.focus();
            },this);
            popup.add(edit);
            var button = this.getChildControl('button');
            popup.placeToWidget(button);
            popup.show();
        },

        addVisualizerWidget: function(widget,position){

            var w = position.column + (position.colSpan || 1);
            var h = position.row + ( position.rowSpan || 1);

            var grid = this._boardGrid;

            this._boardView._add(widget,position);
            this._cfgView.blockPosition(position);
            for (var i=0;i<w;i++){
                grid.setColumnFlex(i,1);
            }
            for (var i=0;i<h;i++){
                grid.setRowFlex(i,1);
            }
            widget.set({
                backgroundColor: '#ffffff',
                padding: [4,4,4,4]
            })
        },

        /**
         * Add a visualizer to the DashBoard
         *
         * @param cfg {Map} config map for the visualizer
         * @param position {Map} position map for the visualizer
         * @return null
         */       
        addVisualizer: function(cfg,position){
            var rpc = ep.data.Server.getInstance();
            var that = this;
            rpc.callAsyncSmart(function(vizList){
                    var ctrl = that._makeVisualizer(cfg,vizList);
                    if (ctrl){
                        if (position == null){
                            that._cfgView.show();
                            that._cfgView.selectPosition(function(position){
                                that._cfgView.hide();
                                that.addVisualizerWidget(ctrl,position);
                            },that);
                        }
                        else {
                            that.addVisualizerWidget(ctrl,position);
                        }
                    }   
                },
                'getVisualizers', 
                cfg.recIds.length > 1 ? 'multi' : 'single' ,
                cfg.recIds[0]
            );
        },
        /**
         * Create a Visualizer Instance
         *
         * @param {Array} list of potential visualizers
         * @return {visualizer} 
         */       
        _makeVisualizer : function(cfg,vizList) {
            for (var i=0; i<vizList.length; i++) {
                var viz = vizList[i];
                if (viz.visualizer == cfg.app){
                    viz.arguments.recIds = cfg.recIds;
                    var control = ep.visualizer.AbstractVisualizer.createVisualizer(viz.visualizer,viz.title, viz.arguments,null);
                    control.setUserCfg(cfg.userCfg);
                    return control;
                }
            }            
        }
    }
});
