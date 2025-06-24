import { createSlice } from "@reduxjs/toolkit";

let user = createSlice({
    name: "user",
    initialState: "kim",
    reducers: {
      changeName(state) {
          return "john " + state
      }
    },
  });
  
  export let {changeName} = user.actions
  export default user