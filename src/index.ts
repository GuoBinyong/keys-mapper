import {Decide} from "com-tools"

export type Key = string|number|symbol
export type Keys = Key | Key[];
/**
 * 映射的 key
 * - null ：表示删除当前 key
 * - undefined ： 没有映射，相关于没有为该key设置映射
 */
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


/**
 * 完成的回调函数
 */
 export type CompleteCB<V> = (copy:V)=>void;


interface keyMapperByRecursiveOptions {
    source:any;
    keyMaps:KeyMapsObject;
    maxDepth:number;
    startDepth:number;
    // 是否要删除其它的key
    deleOther?:boolean|null|undefined;

    //保持原来的 key，即不删除原来的key；默认值：false；默认情况会删除原来的key；
    keep?:boolean|null|undefined;

    //用于保存 被拷贝的对象 和 其对应的 副本 的 Map
    rawCopyMap:Map<any,Decide>;
    completeCB?:CompleteCB<any>|null|undefined;
}


/**
 * key映射的核心函数
 * @param options 
 * @returns 
 */
function keyMapperByRecursive(options:keyMapperByRecursiveOptions):any{
    const {source,keyMaps,maxDepth,startDepth,deleOther,keep,rawCopyMap,completeCB:complete} = options;
    const completeCB = complete || function () {};

    if (maxDepth < startDepth ||  !(source && typeof source === "object")){
        return source;
    }

    let decide = rawCopyMap.get(source);
    if (decide){
        decide.then(completeCB);
        return decide.value
    }
    decide = new Decide<any>();
    decide.then(completeCB);

    const newEntries:[Key,any][] = [];
    const entries = Object.entries(source);
    
    for (const [key,value] of entries ){
        let newKeys = keyMaps[key];
        const newMapKeyArr = Array.isArray(newKeys) ? newKeys : [newKeys];
        const newKeyArr = newMapKeyArr.filter(k=>k != null) as Key[];

        if (newKeys === null || (newKeys === undefined && deleOther) || (newKeys !== undefined && !keep && newKeyArr.length === 0)){
            continue;
        }
        

        keyMapperByRecursive({...options,source:value,startDepth:startDepth+1,
            completeCB:function (newValue) {
                if (newKeys === undefined){
                    newKeys = key;
                }else if(keep){
                    newEntries.push([key,newValue]);
                }

                newKeyArr.forEach(function(newKey){
                    newEntries.push([newKey,newValue]);
                });
            }
        });
    }

    let target:any = null;
    if (Array.isArray(source)){
        const newValue:any[] = [];
        for (const [key,value] of newEntries as [number,any][] ){
            newValue[key] = value;
        }

        target = newValue;
    }else {
        target = Object.fromEntries(newEntries);
    }

    decide.value = target;
    return target;
}






/**
 * keyMapper 函数的配置选项
 */
 export interface KeyMapperOptions {
    // 可选；默认值为：Infinity；拷贝的最大深度；当值为 undefined 或 null 时，会使用默认值，表示无限深度；被拷贝的值本身的深度为 0 ，被拷贝值的成员的深度为 1 ，依次类推；
    maxDepth?:number|null|undefined;
    // 是否删除 映射之外的 key
    deleOther?:boolean|null|undefined;
    // 反转 key 映射 
    reverse?:boolean|null|undefined;
    //保持原来的 key，即不删除原来的key；默认值：false；默认情况会删除原来的key；
    keep?:boolean|null|undefined;
}




export interface KeyMapper {
    /**
     * 键映射
     */
    (source:any,options?:KeyMapperOptions|null|undefined,keyMaps?:KeyMaps|null|undefined):any;

    /**
     * 预设的 KeyMapsObject
     */
     presetKeyMapsObject: KeyMapsObject;
}



/**
 * 创建以 presetKeyMapsObject 为预设的 keyMapper() 函数
 * @param presetKeyMapsObject 
 * @returns 
 */
export function createKeyMapper(presetKeyMapsObject?:KeyMapsObject):KeyMapper {

    function keyMapper(source:any,options?:KeyMapperOptions|null|undefined,keyMaps?:KeyMaps|null|undefined):any {

        if (options){
            var {maxDepth,reverse} = options
        }

        const maxDepth_Num = maxDepth == null ? Infinity : maxDepth;


        const presetKMO = keyMapper.presetKeyMapsObject;
        let finalKMO = presetKMO;
        if (keyMaps){
            if (Object.keys(presetKMO).length > 0){
                finalKMO = mergeKeyMaps(presetKMO,keyMaps);
            }else {
                finalKMO = toKeyMapsObject(keyMaps);
            }
        }

        if (reverse){
            const reverseKMA = reverseKeyMaps(finalKMO);
            finalKMO = toKeyMapsObject(reverseKMA);
        }
        
        return keyMapperByRecursive({...options,source,keyMaps:finalKMO,maxDepth:maxDepth_Num,startDepth:0,rawCopyMap:new Map()});
    }




    Object.defineProperty(keyMapper,"presetKeyMapsObject",{
        configurable:true,
        enumerable:true,
        get:function () {
            if (!this._presetKeyMapsObject){
                this._presetKeyMapsObject = {};
            }
            return this._presetKeyMapsObject;
        },
        set:function (newValue) {
            this._presetKeyMapsObject = newValue;
        }
    });




    if (presetKeyMapsObject){
        keyMapper.presetKeyMapsObject = presetKeyMapsObject;
    }

    return keyMapper;

}




export const keyMapper:KeyMapper = createKeyMapper();