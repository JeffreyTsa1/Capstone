import { create } from 'zustand'

export const appStore = create((set) => ({
    markers: [],
    userLocation: null,
    auth0Info: null,
    userData: null,
    setAuth0Info: (newAuth0Info) => set({ auth0Info: newAuth0Info }),
    setUser: (newUser) => set({ userData: newUser }),
    setUserLocation: (newUserLocation) => set({ userLocation: newUserLocation }),
    setMarkers: (newMarkerList) => set((state) => ({ markers: newMarkerList })),
    
  }))
