/* ************************************************************************

   Copyrigtht: OETIKER+PARTNER AG
   License:    GPLv3 or later
   Authors:    Tobias Oetiker
   Utf8Check:  äöü

************************************************************************ */

/**
 * Create a table widget for the Data visualizer.
 */
qx.Class.define("ep.visualizer.data.MultiDataTable", {
    extend : ep.visualizer.data.DataTable,

    construct : function(instance, columns, widths, units) {
        this.base(arguments,instance, columns, widths, units);
        this.__recCache = {};
        this.__titleCache = {};
    },

    properties : {
        /**
         * recordIds
         */
        recordIds: {
            init: [],
            check: 'Array',
            apply: 'reloadTable',
            nullable: true
        }
    },

    members : {
        __recCache: null,
        __titleCache: null,
        /**
         * reload the table if all the required data is provided
         *
         * @return {void} 
         */
        reloadTable : function() {
            var newRecIdList = this.getRecordIds();
            if (this.getInterval() && newRecIdList.length > 0 ) {
                var rpc = ep.data.Server.getInstance();
                var date = Math.round(new Date().getTime() / 1000 / 3600 ) * 3600;

                if (this.getEndDate()) {
                    date = this.getEndDate();
                }

                var tm = this._model;
                this.setViewMode('loading');
                var that = this;
                var interval = this.getInterval();
                var missingRecIds = this.__filterRecs(newRecIdList,interval,date);

                if (missingRecIds.length == 0){
                    tm.setData(this.__fetchRecData(newRecIdList,interval,date));
                    var title = this.__titleCache[String(interval)+':'+String(date)] || this.tr('Cached Title');
                    this.setCaption(title);
                    this.setViewMode('ready');
                }
                else {
                    rpc.callAsyncSmart(function(ret) {
                        if (ret.status) {
                            that.__updateRecCache(ret.data,missingRecIds,interval,date);
                            tm.setData(that.__fetchRecData(newRecIdList,interval,date));
                            var title = ret.title + ' (' + interval + ')';
                            that.setCaption(title);
                            that.__titleCache[String(interval)+':'+String(date)] = title;
                            that.setViewMode('ready');
                            that.setCaption(ret.caption);
                        }
                        else {
                            that.setViewMode('nodata');    
                            tm.setData([]);
                        }
                    },
                    'visualize', this.getInstance(), {
                        interval : interval,
                        endDate  : date,
                        recList  : missingRecIds
                    });
                }
            }
            else {
                this.setViewMode('nodata');
            }
        },
        /**
         * find which recordIds we have to fetch as they are not in cache
         *
         * @param recIds {Array} list of record Ids wanted
         * @param interval {String} which interval are we talking about ?
         * @param data {Date} when does the interval end
         *
         * @return nonCachedRecordIds {Array} 
         */
        __filterRecs : function(recIds,interval,date){
            var missingRecIds = [];
            var cache = this.__recCache;
            var now = new Date().getTime();
            for ( var i = 0; i < recIds.length; i++){
                var recId = recIds[i];
                var item = cache[String(interval)+':'+String(date)+':'+String(recId)];
                if (item == null || item.validity < now){ 
                    missingRecIds.push(recId);
                }
            }
            return missingRecIds;
        },

        /**
         * update the record cache with new input
         *
         * @param recData {Array[]} 2 dimensinal array with record data from the server
         * @param wantedRecIds {Array} list of record ids requested from the server
         * @param interval {String} which interval are we talking about ?
         * @param data {Date} when does the interval end
         *
         * @return nonCachedRecordIds {Array} 
         */
        __updateRecCache : function(recData,wantedRecIds,interval,date){
            var cache = this.__recCache;
            var validUntil = new Date().getTime() + 1000 * 3600; /* cache valid for the next 5 minutes */
            for ( var i = 0; i < wantedRecIds.length; i++){
                cache[String(interval)+':'+String(date)+':'+String(wantedRecIds[i])] = {
                    validity: validUntil,                    
                    data: recData[i]
                };
            }
        },
        /**
         * fetch record data from the cache. This will also clean out any old entries from the cache.
         *
         * @param wantedRecIds {Array} list of record ids requested from the server
         * @param interval {String} which interval are we talking about ?
         * @param data {Date} when does the interval end
         *
         * @return nonCachedRecordIds {Array} 
         */
        __fetchRecData : function(recIds,interval,date){
            var data = [];
            var cache = this.__recCache;
            var now = new Date().getTime();
            for ( var i = 0; i < recIds.length; i++){
                var recId = recIds[i];    
                var item = cache[String(interval)+':'+String(date)+':'+String(recId)];
                if (item == null){
                    continue;
                }
                // skip items where we did not get any data from the server 
                if (item.data){
                    data.push(item.data);
                }
            }                               
            /* drop old data */            
            for ( var recId in cache ){
                if (cache[recId].validity < now){
                    delete cache[recId];
                }
            }
            return data;
        }
    }
});
