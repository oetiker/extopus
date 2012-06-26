/* ************************************************************************
   Copyright: 2011 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */

/*
#asset(qx/icon/${qx.icontheme}/16/actions/document-save.png)
#asset(qx/icon/${qx.icontheme}/48/actions/document-properties.png)
#asset(qx/icon/${qx.icontheme}/48/places/user-trash.png)
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
     */
    construct : function(name) {                
        this.base(arguments, name);        
        this.set({
            layout: new qx.ui.layout.Grow
        });
        this.add(this._boardView = new qx.ui.core.Widget());
        this._boardView._setLayout(this._boardGrid = new qx.ui.layout.Grid(1,1));
        this._boardView.set({
            backgroundColor: '#bfbfbf'
        });        
        this.add(this._cfgView = new ep.ui.DashConfig(this._boardGrid));
        this._cfgView.hide();
        this._addLabelEditor();
        this._addButtonMenu();
        this.setConfig([]);
    },
    properties: {
        config: {
        },
        /**
         * the server side identification number of the dashboard
         */
        dashId: {            
            nullable: true,
            event: 'changeDashId'
        },
        /**
         * when was the dashboard last updated on the server
         */
        updateTime: {
            nullable: true
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
         * Save the Dashboard on the server
         */
        save: function(){
            var rpc = ep.data.Server.getInstance();
            var that = this;
            rpc.callAsyncSmart(function(ret){
                that.setDashId(ret.id);
                that.setUpdateTime(ret.up);
            },'saveDash',this.getConfig(),this.getLabel(),this.getDashId(),this.getUpdateTime());        

        },
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
                    this.save();
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

        _addVisualizerWidget: function(widget,position){
            var box = new qx.ui.container.Composite(new qx.ui.layout.Grow());
            var content = new qx.ui.container.Composite(new qx.ui.layout.VBox());
            var caption = new qx.ui.basic.Label(widget.getCaption()).set({
                allowGrowX: true,
                padding: [ 4, 4, 0 , 4],
                backgroundColor: '#fff',
                font: 'bold'
            });
            content.add(caption);
            widget.addListener('changeCaption',function(e){caption.setValue(e.getData())},this);
            content.add(widget,{flex: 1});
            box.add(content);
            box.add(this._makeVizEditBox(box,widget));
            var w = position.column + (position.colSpan || 1);
            var h = position.row + ( position.rowSpan || 1);

            var grid = this._boardGrid;
            /* do not die if we fail to add an item */
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
                    var cfgList = that.getConfig();
                    var ctrl = that._makeVisualizer(cfg,vizList);
                    if (ctrl){
                        var cfgListItem = { cfg: cfg };
                        ctrl.setUserData('cfgListItem',cfgListItem);
                        if (position == null){
                            that._cfgView.show();
                            that._cfgView.selectPosition(function(position){        
                                that._cfgView.hide();                                
                                /* only add and save if successfully placed */
                                try { 
                                    that._addVisualizerWidget(ctrl,position);
                                    cfgList.push(cfgListItem);
                                    cfgListItem.position = position;
                                    that.save();
                                }
                                catch(err){
                                    this.debug(err);
                                }
                            },that);
                        }
                        else {
                            /* only add and save if successfully placed */
                            try { 
                                that._addVisualizerWidget(ctrl,position);
                                cfgListItem.position = position;
                                cfgList.push(cfgListItem);
                            }
                            catch(err){
                                this.debug(err);
                            }
                        }
                        that._cfgView.syncGrid();
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
                icon   : 'ep/view-menu-black.png',
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
        _makeVizEditBox: function(box,visualizer){
            var editBox = new qx.ui.container.Composite(new qx.ui.layout.HBox(3,'center').set({
                alignY: 'middle'
            })).set({
                allowGrowX: true,
                allowGrowY: true,
                backgroundColor: 'rgba(0,0,0,0.4)',
                visibility: 'excluded'
            });
            var moveBtn = new qx.ui.basic.Atom(null,"icon/48/actions/document-properties.png").set({
                allowGrowY: false
            });
            var removeBtn = new qx.ui.basic.Atom(null,"icon/48/places/user-trash.png").set({
                allowGrowY: false
            });            
            editBox.add(moveBtn);
            editBox.add(removeBtn);
            editBox.addListener('click',function(){
                this.fireEvent('endEditMode');
            },this);
            editBox.addListener('disappear',function(){
                this.fireEvent('endEditMode');
            },this);


            var startLst = this.addListener('startEditMode',function(){
                editBox.show();
            });
            var endLst = this.addListener('endEditMode',function(){
                editBox.hide();
            });

            removeBtn.addListenerOnce('click',function(){
                this._boardView._remove(box);
                this.removeListenerById(startLst);
                this.removeListenerById(endLst);                    
                this._cfgView.freePosition(box.getLayoutProperties());
                var cfgList = this.getConfig();
                var cfgItem = visualizer.getUserData('cfgListItem');
                for (var i = 0; i < cfgList.length;i++){
                    if (cfgList[i] === cfgItem){
                        cfgList.splice(i,1);
                        break;
                    }
                }
                this.save();
                box.dispose();
            },this);

            moveBtn.addListener('click',function(){
                var cfgView = this._cfgView;
                var boardView = this._boardView;
                cfgView.freePosition(box.getLayoutProperties());
                cfgView.show();
                boardView._remove(box);
                this._boardGrid.invalidateLayoutCache();
                cfgView.selectPosition(function(position){
                    cfgView.hide();
                    try {
                        boardView._add(box,position);
                        cfgView.blockPosition(position);
                        visualizer.getUserData('cfgListItem').position = position;
                        this.save();
                    }
                    catch (err){
                        this.debug(err);
                    }
                        
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
