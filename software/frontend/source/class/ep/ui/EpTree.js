/* ************************************************************************
   Copyright: 2009 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */

/**
 * The window for the browser side representation of a plugin instance.
 */
qx.Class.define("ep.ui.EpTree", {
    extend : qx.ui.core.Widget,

    construct : function() {
        this.base(arguments);
        var grid = new qx.ui.layout.Grow();
        this._setLayout(grid);
        this._createChildControl('tree');

        this._addNodeKids();        
    },

    properties: {
        search: {
            nullable: true,
            init: null
        },
       /** Appearance of the widget */
        appearance : {
            refine : true,
            init   : "eptree"
        }
    },

    members : {
        /**
         * get the kids ready
         *
         * @param id {var} TODOC
         * @return {var} TODOC
         */
        _createChildControlImpl : function(id) {
            var control;
            switch(id)
            {
                case "tree":
                    control = new qx.ui.treevirtual.TreeVirtual('Nodes',{
                        treeDataCellRenderer: new ep.ui.EpTreeDataCellRenderer()
                    }).set({
                        useTreeLines: true,
                        excludeFirstLevelTreeLines: true,
                        openCloseClickSelectsRow: true,
                        alwaysShowOpenCloseSymbol: true,
                        rowHeight: 20
                    });
                    this._add(control);
                    control.getDataRowRenderer().setHighlightFocusRow(false);
                    control.addListener("treeOpenWhileEmpty",this._addNodeKids,this);            
                    control.addListener("treeClose",this._dropNode,this);            
                    break;
            }
            return control || this.base(arguments, id);
        },
        _addNodeKids : function(e){
            var nodeId = null;
            var backendNodeId = 0;
            var tree = this.getChildControl('tree');
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
            var tree = this.getChildControl('tree');
            var model = tree.getDataModel();
            model.prune(e.getData().nodeId,false);
            model.setData();
        }
    }
});
