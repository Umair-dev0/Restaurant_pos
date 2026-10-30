import { createSlice } from "@reduxjs/toolkit";

const initialState = [];

const cartSlice = createSlice({
    name : "cart",
    initialState,
    reducers : {
        addItems : (state, action) => {
            const existingItem = state.find(
                (item) => item.menuItemId === action.payload.menuItemId
            );
            if (existingItem) {
                existingItem.quantity += action.payload.quantity;
                existingItem.price =
                    existingItem.pricePerQuantity * existingItem.quantity;
            } else {
                state.push(action.payload);
            }
        },

        decrementItem: (state, action) => {
            const existingItem = state.find(
                (item) => item.menuItemId === action.payload
            );
            if (!existingItem) return;

            if (existingItem.quantity <= 1) {
                return state.filter((item) => item.menuItemId !== action.payload);
            }

            existingItem.quantity -= 1;
            existingItem.price =
                existingItem.pricePerQuantity * existingItem.quantity;
        },

        removeItem: (state, action) => {
            return state.filter((item) => item.id !== action.payload);
        },

        removeAllItems: () => {
            return [];
        }
    }
})

export const getTotalPrice = (state) => state.cart.reduce((total, item) => total + item.price, 0);
export const { addItems, decrementItem, removeItem, removeAllItems } = cartSlice.actions;
export default cartSlice.reducer;