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

    construct : function(service) {
        this.base(arguments);
        this._setLayout(new qx.ui.layout.Grow());
        this.setService(service);
        this._armTree();
        this._addNodeKids();        
        var tree =  this.getChildControl('tree');
        tree.getDataRowRenderer().setHighlightFocusRow(false);
        tree.set({
            useTreeLines: true,
            excludeFirstLevelTreeLines: true,
            openCloseClickSelectsRow: true,
            alwaysShowOpenCloseSymbol: true,
            rowHeight: 20
        });
        tree.addListener("treeOpenWhileEmpty",this._addNodeKids,this);            
        tree.addListener("cellClick",this._cellClickHandler,this);            
        tree.addListener("treeClose",this._dropNode,this);            
    },

    properties: {
        service: {}
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
                    });                    
                    this._add(control);
                    break;
            }

            return control || this.base(arguments, id);
        },
        _armTree : function(){
            var treeWidget = this.getChildControl('tree');
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
                qx.dev.Debug.debugObject(props,'Props');
                for (var walker = nodeId;walker;walker=tree.nodeGet(walker).parentNodeId){
                    filter.unshift(tree.nodeGetLabel(walker));
                }
            }
            var rpc=this.getService();
            var model = tree.getDataModel();
            var loadingId = model.addLeaf(nodeId,this.tr('loading ...'));
            model.setData();            
            if (nodeId){
                tree.nodeSetOpened(nodeId,true);
            }
            /* show the loading element immediately */
            qx.ui.core.queue.Manager.flush();
            qx.html.Element.flush();
            rpc.callAsyncSmart(function(ret){
               model.prune(loadingId,true);
               for (var i=0;i<ret.list.length;i++){

                   var newNodeId;
                   if (ret.typ == 'branch'){
                       newNodeId = model.addBranch(nodeId,ret.list[i],false);
                   }
                   else {
                       newNodeId = model.addLeaf(nodeId,ret.list[i]);
                   }
                   //tree.nodeSetLabelStyle(newNodeId, "padding-top: 2px"); 
                }
                model.setData();
            },'getTreeBranch',filter);
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
            var filter = [];
            for (var walker = nodeId;walker;walker=tree.nodeGet(walker).parentNodeId){
                filter.unshift(tree.nodeGetLabel(walker));
            } 
            ep.data.NodeTableModel.getInstance().setFilter(filter);
            //tree.nodeToggleOpened(nodeId);
            //model.setData();
        }
    }
});
