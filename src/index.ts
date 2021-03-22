
export type Key = string|number|symbol
export type Keys = Key | Key[];
export type MapKey = Key | null | undefined;
export type MapKeys = MapKey | MapKey[];
/**
 * 对象开式的key映射
 */
export type KeyMapsObject = {[SK in Key]:MapKeys};
/**
 * 数组开式的key映射
 */
export type KeyMapsArray = [Keys,MapKeys][]

/**
 * key 映射
 */
export type KeyMaps = KeyMapsObject | KeyMapsArray


/**
 * 将 KeyMaps 类型 转为 KeyMapsObject 类型
 * @param keyMaps 
 * @returns 
 */
export function toKeyMapsObject(keyMaps:KeyMaps):KeyMapsObject{
    if (!Array.isArray(keyMaps)){
        return keyMaps;
    }
   

    const entries:[Key,MapKeys][] = [];
    for (const [sourceKeys,mapKeys] of keyMaps){
        if (Array.isArray(sourceKeys)){
            const flatKeyMapArr:[Key,MapKeys][] = sourceKeys.map(function(key){
                return [key,mapKeys]
            });
            Array.prototype.push.apply(entries,flatKeyMapArr);
        }else{
            entries.push([sourceKeys,mapKeys])
        }
    }

    return Object.fromEntries(entries);
}

/**
 * 将 keyMaps1 和 keyMaps2 合并成一个 KeyMapsObject 对象
 */
export function mergeKeyMaps(keyMaps1:KeyMaps,keyMaps2:KeyMaps):KeyMapsObject{
   const kmo1 = toKeyMapsObject(keyMaps1);
   const kmo2 = toKeyMapsObject(keyMaps2);

   const entries:[Key,MapKeys][] = [];
   
   for (const [sourceKeys,mapKeys2]  of Object.entries(kmo2)){
       const mapKeys1 = kmo1[sourceKeys];
       let mapKeys:MapKey[] = Array.isArray(mapKeys2) ? [...mapKeys2] : [mapKeys2];
       if(mapKeys1 !== undefined){
           mapKeys = mapKeys.concat(mapKeys1)
       }
       entries.push([sourceKeys,mapKeys]);
   }

   return Object.fromEntries(entries);
}



/**
 * 将 keyMaps 反转
 * @param keyMaps 
 * @returns 
 */
export function reverseKeyMaps(keyMaps:KeyMaps):KeyMapsArray{
    const keyMapsArr = Array.isArray(keyMaps) ? keyMaps : Object.entries(keyMaps);
    const reverseKMA:KeyMapsArray = [];

    for (const [sourceKeys,mapKeys] of keyMapsArr){
        const mapKeyArr = Array.isArray(mapKeys) ? mapKeys : [mapKeys];
        const finalMKA = mapKeyArr.filter(function(key){
            return key != null;
        }) as Key[];
        reverseKMA.push([finalMKA,sourceKeys])
    }

    return reverseKMA;
}



interface keyMapperByRecursiveOptions {
    source:any;
    keyMaps:KeyMapsObject;
    maxDepth:number;
    startDepth:number;
    // 是否要删除其它的key
    deleOther?:boolean|null|undefined;
}


/**
 * key映射的核心函数
 * @param options 
 * @returns 
 */
function keyMapperByRecursive(options:keyMapperByRecursiveOptions):any{
    const {source,keyMaps,maxDepth,startDepth,deleOther} = options;

    if (maxDepth < startDepth ||  !(source && typeof source === "object") || Array.isArray(source) ){
        return source;
    }

    const newEntries = [];
    const entries = Object.entries(source);
    
    for (const [key,value] of entries ){
        let newKey = keyMaps[key];
        if (newKey === null){
            continue;
        }

        const newValue = keyMapperByRecursive({source:value,keyMaps,maxDepth,startDepth:startDepth+1,deleOther})

        if (newKey === undefined){
            if (deleOther){
                continue;
            }
            newKey = key;
        }
        newEntries.push([newKey,newValue]);
    }

    return Object.fromEntries(newEntries);
}






/**
 * keyMapper 函数的配置选项
 */
 export interface KeyMapperOptions {
    // 可选；默认值为：Infinity；拷贝的最大深度；当值为 undefined 或 null 时，会使用默认值，表示无限深度；被拷贝的值本身的深度为 0 ，被拷贝值的成员的深度为 1 ，依次类推；
    maxDepth?:number|null|undefined;
    deleOther?:boolean|null|undefined;
    reverse?:boolean|null|undefined;
}




export interface KeyMapper {
    /**
     * 键映射
     * @param value
     */
    (source:any,options?:KeyMapperOptions|null|undefined,keyMaps?:KeyMaps|null|undefined):any;

    /**
     * 预设的 KeyMapsObject
     */
     presetKeyMapsObject: KeyMapsObject;
}




export function createKeyMapper(presetKeyMapsObject?:KeyMapsObject):KeyMapper {

    function keyMapper(source:any,options?:KeyMapperOptions|null|undefined,keyMaps?:KeyMaps|null|undefined):any {

        if (options){
            var {maxDepth,reverse} = options
        }

        const maxDepth_Num = maxDepth == null ? Infinity : maxDepth;


        const presetKMO = keyMapper.presetKeyMapsObject;
        let mergedKMO = presetKMO;
        if (Object.keys(presetKMO).length > 0 && keyMaps){
            mergedKMO = mergeKeyMaps(presetKMO,keyMaps);
        }
        
        const trObj = toTypeReviverObject(mergedTCArr);
        return keyMapperByRecursive({value,typeReviverObject:trObj,allOwnProps:allOwnProps_Bool,copyFun:copyFun_Bool,maxDepth:maxDepth_Num,startDepth:0,rawCopyMap:new Map()}) as V;
    }




    Object.defineProperty(keyMapper,"presetTypeCopierMap",{
        configurable:true,
        enumerable:true,
        get:function () {
            if (!this._presetTypeCopierMap){
                this._presetTypeCopierMap = new Map();
            }
            return this._presetTypeCopierMap;
        },
        set:function (newValue) {
            if (newValue instanceof Map){
                this._presetTypeCopierMap = newValue;
            }
        }
    });




    if (presetTypeCopierMap){
        keyMapper.presetTypeCopierMap = presetTypeCopierMap;
    }

    return keyMapper;

}
