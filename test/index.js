const KM = require("../dist/keys-mapper.cjs")

let kms = {
    g:"by",
    d:["dyx","yx"],
    w:"xl",
    ref:null
};


let source = {
    a:{b:34,g:33},
    d:34,
    w:[{g:2},5],
};

source.ref = source;
source.g = source.w;

let target = KM.keyMapper(source,null,kms);
console.log(target,target.by === target.xl)

let tar2Sou = KM.keyMapper(target,{reverse:true},kms);
console.log(tar2Sou)