const defaultOptions = {
  container:null,
  focusColor:"#e06555",
  fgColor:"#d6dae5",
  bgColor:"#fff",
  n:3,
  innerRadius:20,
  outerRadius:50,
  minPoint:4
}
const defaultFunctions = {
    check:{
        checked(){}
    },
    update:{
        beforeRepeat(){},
        afterReapeat(){}
    }
};
export {
    defaultOptions,
    defaultFunctions
}
