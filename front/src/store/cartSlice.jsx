import { createSlice } from "@reduxjs/toolkit";

let cart = createSlice({
  name: "cart",
  initialState: [
    { id: 0, name: "아이템1", count: 2 },
    { id: 2, name: "아이템2", count: 1 },
  ],
  reducers: {
    modifyCount(state, action) {
      let src = action.payload.target;
      let dest = state.find((cur) => cur.id === src.id);
      if (dest) {
        dest.count += action.payload.step;
        if (dest.count === 0) {
          dest.count = 1;
          alert("1개 이상의 상품을 담아주세요.");
        }
      }
    },
    push(state, action) {
      let item = action.payload;
      let target = state.find((cur) => cur.id === item.id);
      if (target) {
        target.count += 1;
      } else {
        state.push(item);
      }
    },
    removeItem(state, action) {
      let item = action.payload;
      let targetIndex = state.findIndex((cur) => cur.id === item.id);
      if (targetIndex !== -1) {
        state.splice(targetIndex, 1);
      }
    },
  },
});

export let { modifyCount, removeItem, push } = cart.actions;
export default cart;
