import React, { createContext, useContext } from "react";
import { CollateMessage } from "src/utils";

// Create the context with undefined as initial value
const CollationContext = createContext<CollateMessage | undefined>(undefined);

// Provider props type
interface CollationProviderProps {
	children: React.ReactNode;
	sessionId?: string;
}

// Provider component
export function CollationProvider({ children }: CollationProviderProps) {
	const instance = new CollateMessage();

	return <CollationContext.Provider value={instance}>{children}</CollationContext.Provider>;
}

// Custom hook for using the collation context
export function useCollation(): CollateMessage | undefined {
	const context = useContext(CollationContext);
	return context ?? undefined;
}
