// We need to define this property in order to disable the console message:
// "Download the React DevTools for a better development experience..."
Object.defineProperty(globalThis, "__REACT_DEVTOOLS_GLOBAL_HOOK__", {
	value: { isDisabled: true },
});
