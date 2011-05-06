/* ************************************************************************
   Copyright: 2009 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */

/**
 * The window for the browser side representation of a plugin instance.
 */
qx.Class.define("ep.ui.TreeView", {
    extend : qx.ui.core.Widget,

    construct : function() {
        this.base(arguments);
        this._setLayout(new qx.ui.layout.Grow());
        this.__hPane = new qx.ui.splitpane.Pane("horizontal");
        this._add(this.__hPane);
        this.__vPane = new qx.ui.splitpane.Pane("vertical");
        this._createTree();
        this.__hPane.add(this.__vPane,3);
        var rpc=ep.data.Server.getInstance();
        var that = this;
        rpc.callAsyncSmart(function(ret){
            that._createTable(ret.names,ret.ids);
            that._createView();
            that._addNodeKids();        
        },'getTableColumnDef','tree');
        this.__leafCache = {};
    },

    properties: {
        tree: {},
        table: {},
        view: {}
    },
    members : {
        __tableColumns: null,
        __hPane: null,
        __vPane: null,
        __leafCache: null,
        /**
         * get the kids ready
         *
         * @param id {var} TODOC
         * @return {var} TODOC
         */        
        _createTree: function(){
            var control = new qx.ui.treevirtual.TreeVirtual('Nodes',{
                treeDataCellRenderer: new ep.ui.TreeDataCellRenderer()
            }).set({
                excludeFirstLevelTreeLines: true,
                openCloseClickSelectsRow: true,
                alwaysShowOpenCloseSymbol: true,
                rowHeight: 20
            });
            this.__hPane.add(control,1);       
            control.getDataRowRenderer().setHighlightFocusRow(false);
            control.addListener("treeOpenWhileEmpty",this._addNodeKids,this);
            control.addListener("changeSelection",this._setLeavesTable,this);                        
            control.addListener("treeClose",this._dropNode,this);            
            this.setTree(control);
        },
        _createTable: function(names,ids){
            var tm = new qx.ui.table.model.Simple();
            tm.setColumns(names,ids);
            var control = new ep.ui.Table(tm);
            this.__vPane.add(control,1);
            this.setTable(control);
        },
        _createView: function(){
            var control = new ep.ui.View();
            this.__vPane.add(control,3);
            this.setView(control);
        },
        _addNodeKids : function(e){
            var nodeId = null;
            var backendNodeId = 0;
            var tree = this.getTree();
            if (e){
                var node = e.getData();
                if (node.type == qx.ui.treevirtual.MTreePrimitive.Type.LEAF){
                    return;
                }
                nodeId = node.nodeId;
                backendNodeId = node.backendNodeId;
            }
            var rpc=ep.data.Server.getInstance();
            var model = tree.getDataModel();
            var treeData = model.getData();
            var tm = this.getTable().getTableModel();
            var leafCache = this.__leafCache;
            rpc.callAsyncSmart(function(ret){
                ret.branches.map(function(branch){
                    var newNodeId = model.addBranch(nodeId,branch[1],false);
                    treeData[newNodeId]['backendNodeId'] = branch[0];
                });                    
                model.setData();
                leafCache[nodeId] = ret.leaves;
                tm.setData(ret.leaves,true);
            },'getBranch',backendNodeId);
        },
        _setLeavesTable : function(e){
            var nodeId = e.getData()[0].nodeId;
            this.debug(nodeId);
            if (this.__leafCache[nodeId]){
                this.getTable().getTableModel().setData(this.__leafCache[nodeId]);
            }
        },
        _dropNode : function(e){
            var tree = this.getTree();
            var model = tree.getDataModel();
            var nodeId = e.getData().nodeId;
            model.prune(nodeId,false);
            delete this.__leafCache[nodeId];
            model.setData();
        }
    }
});
