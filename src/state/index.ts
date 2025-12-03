import {createSlice, PayloadAction} from "@reduxjs/toolkit";

export interface InitialStateTypes{
    isSidebarCollapsed: boolean;
    isDarkMode: boolean;
    isPOSPanelOpen: boolean,
}

const initialState: InitialStateTypes = {
    isSidebarCollapsed: false,
    isDarkMode: false,
    isPOSPanelOpen: false,
}

export const globalSlice = createSlice ({
    name: 'global',
    initialState,
    reducers:{
        setIsSidebarCollapsed:(state, action:PayloadAction<boolean>) => {
            state.isSidebarCollapsed = action.payload;
        },
        setIsDarkMode:(state, action:PayloadAction<boolean>) => {
            state.isDarkMode = action.payload;
        },
        setIsPOSPanelOpen:(state, action:PayloadAction<boolean>) => {
            state.isPOSPanelOpen = action.payload;
        },
    }
})

export const {setIsSidebarCollapsed, setIsDarkMode, setIsPOSPanelOpen} = globalSlice.actions;

export default globalSlice.reducer;