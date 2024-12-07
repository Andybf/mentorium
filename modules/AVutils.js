/* 
 * AndView Framework
 * Copyright © 2022 Anderson Bucchianico. All rights reserved.
 * 
*/

export default class AVutils {
    
    static mapPopValue(map) {
        let value = Array.from(map)[map.size-1][1];
        map.delete(Array.from(map)[map.size-1][0])
        return value;
    }

    static concatMaps(map1, map2) {
        const iterationCount = (map1.size > map2.size) ? map1.size : map2.size;
        for (let index=0; index<iterationCount; index++) {
            map1.set(Array.from(map2)[index][0], Array.from(map2)[index][1]);
        }
    }
}