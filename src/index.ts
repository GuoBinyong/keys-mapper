
export type Key = string|number|symbol
export type Keys = Key | Key[];
export type MapKeys = Keys | null;
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
export function toKeyMapsObject(keyMaps:KeyMaps){
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


interface keyMapperByRecursiveOptions {
    source:any;
    keyMaps:KeyMapsObject;
    maxDepth:number;
    startDepth:number;
    // 是否要删除其它的key
    deleOther:boolean;
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



