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
                    control.addListener("cellClick",this._cellClickHandler,this);            
                    control.addListener("treeClose",this._dropNode,this);            
                    break;
            }
            return control || this.base(arguments, id);
        },
        _addNodeKids : function(e){
            var nodeId = null;
            var tree = this.getChildControl('tree');
            var filter = [];
            var props;
            if (e){
                var node = e.getData();
                if (node.type == qx.ui.treevirtual.MTreePrimitive.Type.LEAF){
                    return;
                }
                nodeId = node.nodeId;
                props = node.userData;
//              qx.dev.Debug.debugObject(props,'Props');
                for (var walker = nodeId;walker;walker=tree.nodeGet(walker).parentNodeId){
                    filter.unshift(tree.nodeGetLabel(walker));
                }
            }
            var rpc=ep.data.Server.getInstance();
            var model = tree.getDataModel();
            //if (nodeId){
            //    tree.nodeSetOpened(nodeId,true);
            //}
            rpc.callAsyncSmart(function(ret){
               for (var i=0;i<ret.list.length;i++){

                   var newNodeId;
                   if (ret.typ == 'branch'){
                       newNodeId = model.addBranch(nodeId,ret.list[i],false);
                   }
                   else {
                       newNodeId = model.addLeaf(nodeId,ret.list[i]);
                   }
                }
                model.setData();
            },'getTreeBranch',{filter: filter, search: this.getSearch()});
        },
        _dropNode : function(e){
            var tree = this.getChildControl('tree');
            var model = tree.getDataModel();
            model.prune(e.getData().nodeId,false);
            model.setData();
        },
        _cellClickHandler : function(e){
            var row = e.getRow();
            var tree = this.getChildControl('tree');
            var model = tree.getDataModel();
            var nodeId = model.getNode(row);                
            // var filter = [];
            // for (var walker = nodeId;walker;walker=tree.nodeGet(walker).parentNodeId){
            //    filter.unshift(tree.nodeGetLabel(walker));
            // } 
            //ep.data.NodeTableModel.getInstance().setFilter(filter);
            tree.nodeToggleOpened(nodeId);
            model.setData();
        }
    }
});
