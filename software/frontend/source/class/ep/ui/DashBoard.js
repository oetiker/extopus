/* ************************************************************************
   Copyright: 2011 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */

/*
#asset(qx/icon/${qx.icontheme}/16/actions/document-save.png)
#asset(qx/icon/${qx.icontheme}/48/actions/view-fullscreen.png)
#asset(qx/icon/${qx.icontheme}/48/actions/dialog-close.png)
#asset(qx/icon/${qx.icontheme}/48/actions/dialog-cancel.png)
*/
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
        this.set({
            layout: new qx.ui.layout.Grow
        });
        this.add(this._boardView = new qx.ui.core.Widget());
        this._boardView._setLayout(this._boardGrid = new qx.ui.layout.Grid(1,1));
        this._boardView.set({
            backgroundColor: '#bfbfbf'
        });        
        this.add(this._cfgView = new ep.ui.DashConfig(dimension));
        this._cfgView.hide();
        this._addLabelEditor();
        this._addButtonMenu();
    },
    properties: {
        config: {
            apply: '_applyConfig'
        }
    },
    events: {
        startEditMode: 'qx.event.type.Event',
        endEditMode: 'qx.event.type.Event'
    },
    members : {
        _cfgView: null,
        _boardView: null,
        _boardGrid: null,
        _labelEditor: null,
        /**
         * create the label editor
         */
        _addLabelEditor: function(){
            var popup = this._labelEditor = new qx.ui.popup.Popup(new qx.ui.layout.Grow()).set({
                offsetTop: -15,
                offsetLeft: 10,
                autoHide: false
            });
            var edit = new qx.ui.form.TextField(this.getLabel()).set({
                placeholder: this.tr("Dashboard Name"),
                width: 200,
                required: true,
                liveUpdate: true
            });
            edit.addListener("keyup", function(e){
                if (e.getKeyIdentifier() == 'Enter' && this.getLabel()){
                    popup.hide();
                }
            },this);
            edit.addListener("blur", function(e){
                if (this.getLabel()){
                    popup.hide();
                }
            },this);

            edit.addListener("changeValue",function(e){
                this.setLabel(e.getData());
            },this);

            edit.addListener("appear",function(){
                edit.focus();
                edit.selectAllText();
            },this);

            this.getChildControl('button').addListener('dblclick',function(e){
                this.editLabel();
            },this);

            this.addListener("appear",function(){
                if (! this.getLabel()){
                    this.editLabel();
                }
            },this);

            popup.add(edit);
        },
        /**
         * edit the label of the DashBoard
         */
        editLabel: function(){
            var popup = this._labelEditor;
            var button = this.getChildControl('button');
            popup.placeToWidget(button);
            popup.show();
        },

        addVisualizerWidget: function(widget,position){
            var box = new qx.ui.container.Composite(new qx.ui.layout.Grow());
            box.add(widget);
            box.add(this._makeVizEditBox(box));
            var w = position.column + (position.colSpan || 1);
            var h = position.row + ( position.rowSpan || 1);

            var grid = this._boardGrid;

            this._boardView._add(box,position);
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
            for (var i=0;i<vizList.length;i++){
                var viz = vizList[i];
                if (viz.instance == cfg.instance){
                    viz.arguments.recIds = cfg.recIds;
                    viz.arguments.compact = true;
                    var control = ep.visualizer.AbstractVisualizer.createVisualizer(viz,null);
                    control.setUserCfg(cfg.userCfg);
                    return control;
                }
            };
        },
        /**
         * Add the popup menu to the tab button.
         */       
        _addButtonMenu: function(){
            var button = this.getChildControl('button');            

            var menuButton = this._menuButton = new qx.ui.basic.Atom().set({
                icon   : 'ep/view-menu.png',
                show   : 'icon',
                cursor : 'pointer',
                visibility: 'excluded'
            });

            button._add(menuButton, {
                row    : 0,
                column : 6
            });

            button.addListener('syncAppearance', function(){
                if (button.hasState('checked')) {
                    menuButton.show();
                } else {
                    menuButton.exclude();
                }
            },this);

            menuButton.addListener('click',function(){
                ep.ui.DashMenu.getInstance().showMenu(menuButton, this);
            },this);
        },
        /**
         * Make a visualizer Edit Box
         */       
        _makeVizEditBox: function(visualizer){
            var editBox = new qx.ui.container.Composite(new qx.ui.layout.HBox(3,'center').set({
                alignY: 'middle'
            })).set({
                allowGrowX: true,
                allowGrowY: true,
                backgroundColor: 'rgba(0,0,0,0.4)',
                visibility: 'excluded'
            });
            var moveBtn = new qx.ui.form.Button(null,"icon/48/actions/view-fullscreen.png").set({
                allowGrowY: false
            });
            var removeBtn = new qx.ui.form.Button(null,"icon/48/actions/dialog-close.png").set({
                allowGrowY: false
            });            
            editBox.add(moveBtn);
            editBox.add(removeBtn);

            var cancelBtn = new qx.ui.form.Button(null,"icon/48/actions/dialog-cancel.png").set({
                allowGrowY: false
            });            
            editBox.add(cancelBtn);

            cancelBtn.addListener('execute',function(){
                this.fireEvent('endEditMode');
            },this);


            var startLst = this.addListener('startEditMode',function(){
                editBox.show();
            });
            var endLst = this.addListener('endEditMode',function(){
                editBox.hide();
            });

            removeBtn.addListenerOnce('execute',function(){
                this._boardView._remove(visualizer);
                this.removeListenerById(startLst);
                this.removeListenerById(endLst);                    
                this._cfgView.freePosition(visualizer.getLayoutProperties());
                visualizer.dispose();
            },this);

            moveBtn.addListener('execute',function(){
                var cfgView = this._cfgView;
                var boardView = this._boardView;
                cfgView.freePosition(visualizer.getLayoutProperties());
                cfgView.show();
                boardView._remove(visualizer);
                this._boardGrid.invalidateLayoutCache();
                cfgView.selectPosition(function(position){
                    cfgView.hide();
                    cfgView.blockPosition(position);
                    boardView._add(visualizer,position);
                    var w = position.column + (position.colSpan || 1);
                    var h = position.row + ( position.rowSpan || 1);

                    var grid = this._boardGrid;

                    for (var i=0;i<w;i++){
                        grid.setColumnFlex(i,1);
                    }
                    for (var i=0;i<h;i++){
                        grid.setRowFlex(i,1);
                    }
                 },this);
            },this);

            return editBox;          
        }
    }
});
