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
    // 是否也要对数组进行键映射 keysMapper
    array?:boolean;
}


/**
 * key映射的核心函数
 * @param options 
 * @returns 
 */
function keyMapperByRecursive(options:keyMapperByRecursiveOptions):any{
    const {source,keyMaps,maxDepth,startDepth,deleOther,keep,rawCopyMap,completeCB:complete,array:hasArray} = options;
    const completeCB = complete || function () {};

    if (maxDepth < startDepth ||  !(source && typeof source === "object")){
        completeCB(source);
        return source;
    }

    let decide = rawCopyMap.get(source);
    if (decide){
        decide.then(completeCB);
        return decide.value
    }
    decide = new Decide<any>();
    decide.then(completeCB);
    rawCopyMap.set(source,decide);

    const nextDepth = startDepth + 1;


    const newEntries:[Key,any][] = [];
    let entries!:[string|number,any][];

    const isArray = Array.isArray(source);
    const target:any = isArray ? [] : {};

    if(isArray){
        if  (!hasArray){
            source.forEach(function(value:any,index:number){
                target.push(undefined);
                keyMapperByRecursive({...options,source:value,startDepth:nextDepth,
                    completeCB:function (newValue) {
                        target.splice(index,1,newValue);
                    }
                });
            });
            decide.value = target;
            return target;
        }

        entries = (<any[]>source).map(function(item,index){
            return [index,item];
        });
        
    }else {
        entries = Object.entries(source);
    }

    
    
    for (const [key,value] of entries ){
        const newKeys = keyMaps[key];
        const newMapKeyArr = Array.isArray(newKeys) ? [...newKeys] : [newKeys];
        const newKeyArr = newMapKeyArr.filter(k=>k != null) as Key[];

        if (newKeys === null || (newKeys === undefined && deleOther) || (newKeys !== undefined && !keep && newKeyArr.length === 0)){
            continue;
        }
        

        keyMapperByRecursive({...options,source:value,startDepth:nextDepth,
            completeCB:function (newValue) {
                if (newKeys === undefined || keep){
                    newKeyArr.push(key);
                }

                newKeyArr.forEach(function(newKey){
                    newEntries.push([newKey,newValue]);
                });
            }
        });
    }

    
    for (const [key,value] of newEntries ){
        target[key] = value;
    }

    decide.value = target;
    return target;
}






/**
 * keysMapper 函数的配置选项
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
    // 是否也要对数组进行键映射 keysMapper
    array?:boolean;
}




export interface KeysMapper {
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
 * 创建以 presetKeyMapsObject 为预设的 keysMapper() 函数
 * @param presetKeyMapsObject 
 * @returns 
 */
export function createKeyMapper(presetKeyMapsObject?:KeyMapsObject):KeysMapper {

    function keysMapper(source:any,options?:KeyMapperOptions|null|undefined,keyMaps?:KeyMaps|null|undefined):any {

        if (options){
            var {maxDepth,reverse} = options
        }

        const maxDepth_Num = maxDepth == null ? Infinity : maxDepth;


        const presetKMO = keysMapper.presetKeyMapsObject;
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




    Object.defineProperty(keysMapper,"presetKeyMapsObject",{
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
        keysMapper.presetKeyMapsObject = presetKeyMapsObject;
    }

    return keysMapper;

}




export const keysMapper:KeysMapper = createKeyMapper();