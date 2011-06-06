/* ************************************************************************
   Copyright: 2009 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */

/* ************************************************************************

#asset(qx/icon/${qx.icontheme}/22/places/folder.png)
#asset(qx/icon/${qx.icontheme}/22/mimetypes/office-spreadsheet.png)
#asset(ep/loading22.gif)

************************************************************************ */

/**
 * The window for the browser side representation of a plugin instance.
 */

qx.Class.define("ep.ui.TreeView", {
    extend : qx.ui.core.Widget,

    construct : function() {
        this.base(arguments);
        this._setLayout(new qx.ui.layout.Grow());
        var hPane = new qx.ui.splitpane.Pane("horizontal");
        this._add(hPane);
        var vPane = new qx.ui.splitpane.Pane("vertical");
        var rpc=ep.data.Server.getInstance();
        var that = this;
        rpc.callAsyncSmart(function(ret){
            vPane.add(that._createTable(ret.names,ret.ids,ret.widths),1);
            hPane.add(that._createTree(),1);
            hPane.add(vPane,3);
            vPane.add(that._createView(),3);            
        },'getTableColumnDef','tree');
//      this.__leafCache = {};
    },

    properties: {
        tree: {},
        table: {},
        view: {}
    },
    members : {
        /**
         * get the kids ready
         *
         * @param id {var} TODOC
         * @return {var} TODOC
         */        
        __initialized: null,

        _createTree: function(){
            var root = qx.data.marshal.Json.createModel({
                name: 'root',
                kids: [],
                leaves: null,
                icon: 'default',
                loaded: true,
                nodeId: 0
            },true);
            this._addNodeKids(root);
            var that = this;
            var control = new qx.ui.tree.VirtualTree(root,'name','kids').set({
                openMode: 'click',
                hideRoot: true,
                iconPath: 'icon',
                iconOptions: {
                    converter : function(value, model) {
                        if (value == "default") {
                            if (model.getKids != null) {
                                return "icon/22/places/folder.png";
                            } else {
                                return "icon/22/mimetypes/office-spreadsheet.png";
                            }
                        } else {
                            return "ep/loading22.gif";
                        }
                    }
                },
                delegate: {
                    bindItem : function(controller, item, index) {
                        controller.bindDefaultProperties(item, index);
                        controller.bindProperty("", "open", {
                            converter : function(value, model, source, target) {
                                var isOpen = target.isOpen();
                                if (isOpen && !value.getLoaded()) {
                                    that._addNodeKids(value);
                                }
                                return isOpen;
                            }
                        }, item, index);
                    }
                }
            });

            control.getSelection().addListener("change",this._setLeavesTable,this);    
            this.setTree(control);            
            return control;
        },

        _createTable: function(names,ids,widths){
            var tm = new qx.ui.table.model.Simple();
            tm.setColumns(names,ids);
            var control = new ep.ui.Table(tm,widths);
            this.setTable(control);
            return control;
        },
        _createView: function(){
            var control = new ep.ui.View(this.getTable());
            this.setView(control);
            return control;
        },
        _addNodeKids : function(node){
            var rpc=ep.data.Server.getInstance();
            var that = this;
            rpc.callAsyncSmart(function(ret){
                var kids = node.getKids();
                kids.removeAll();
                node.setLoaded(true);
                ret.map(function(branch){                
                    var newNode = {
                        nodeId: branch[0],
                        name: branch[1],
                        icon: 'default',
                        loaded: false,
                        leaves: null
                    };
                    if (branch[2]){
                        newNode.kids = [{
                            name: 'Loading',
                            icon: 'loading'
                        }]
                    };
                    var kid = qx.data.marshal.Json.createModel(newNode, true);
                    // keep the data array as a normal array and don't have it qooxdooified
                    kid.setLeaves(branch[3]); 
                    kids.push(kid);
                });
                // travel down the tree as it get loaded
                if (! that.__initialized){
                    var firstNewNode = kids.getItem(0);
                    that.getTree().openNode(firstNewNode);
                    var sel = that.getTree().getSelection();
                    sel.removeAll();
                    sel.push(firstNewNode);
                    if (!firstNewNode.getKids){
                        that.__initialized = true;
                    }
                }
            },'getBranch',node.getNodeId());
        },
        _setLeavesTable : function(e){
            var sel = this.getTree().getSelection();
            if (sel.length > 0){
                var table = this.getTable();
                var tm = table.getTableModel();
                var sm = table.getSelectionModel();
                var data = sel.getItem(0).getLeaves();                
                table.resetSelection();
                tm.setData(data);
                if (data.length){
                    sm.setSelectionInterval(0,0);
                }
            }
        }
    }
});
