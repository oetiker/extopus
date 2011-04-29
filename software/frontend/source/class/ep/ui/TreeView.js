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
        this.__tableColumns = [ 'Location', 'Value', 'Test' ];
        this._createTable();
        this._createView();
        this._addNodeKids();        
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
            control.addListener("treeClose",this._dropNode,this);            
            this.setTree(control);
        },
        _createTable: function(){
            var tm = new qx.ui.table.model.Simple();
            tm.setColumns(this.__tableColumns);
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
                    // do something with the leaf
                    return;
                }
                nodeId = node.nodeId;
                backendNodeId = node.backendNodeId;
            }
            var rpc=ep.data.Server.getInstance();
            var model = tree.getDataModel();
            var treeData = model.getData();
            rpc.callAsyncSmart(function(ret){
                ret.branches.map(function(branch){
                    var newNodeId = model.addBranch(nodeId,branch[1],false);
                    treeData[newNodeId]['backendNodeId'] = branch[0];
                });                    
                ret.leaves.map(function(backendNodeId){
                    var newNodeId = model.addLeaf(nodeId,'n-'+String(backendNodeId));
                    treeData[newNodeId]['backendNodeId'] = backendNodeId;
                });
                model.setData();
            },'getBranch',backendNodeId);
        },
        _dropNode : function(e){
            var tree = this.getTree();
            var model = tree.getDataModel();
            model.prune(e.getData().nodeId,false);
            model.setData();
        }
    }
});
