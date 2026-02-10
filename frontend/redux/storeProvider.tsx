"use client";

import { Provider } from "react-redux";
import type { ReactNode } from "react";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./store";

export default function StoreProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Provider store={store}>
      <PersistGate loading={<div>Loading...</div>} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}
