- more es6
- remove ; & fix eslint
- CSS loading at the beginning of the app
- Nest sitc1/2 in dropdown for commodities and labarea/codealpha in partners

calling filter with all = getting totals







for each yearly record => add records for other aggregation levels to a new hashmap
dump new hashmap values to debug file



// data[reporter][partner][year][commodity]
const data = {
    LO: {
        IT: {
            2014: {
                1: {
                    'hashedrec': {
                        ...record
                    }
                }
            }
        }
    },
    NI: {}
}





// what if we just add records
const data = {
    LO: {
        'hashedrec1': { ...record },
        'hashedrec3': { ...record },
        'hashedrec4': { ...record },
        'hashedrec5': { ...record }
    },
    NI: {}
}


