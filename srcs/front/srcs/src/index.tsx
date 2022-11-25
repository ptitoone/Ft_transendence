import * as ReactDOM from "react-dom/client"
import * as React from "react"
import { ChakraProvider } from "@chakra-ui/react"
import { App } from "./App"
import { Set } from "typescript"
import theme from "./theme"

const container = document.getElementById("root")
if (!container) throw new Error('Failed to find the root element');
const root = ReactDOM.createRoot(container)

//const theme = extendTheme({ config })

function onRenderCallback(
	id: string, // the "id" prop of the Profiler tree that has just committed
	phase: "mount" | "update", // either "mount" (if the tree just mounted) or "update" (if it re-rendered)
	actualDuration: number, // time spent rendering the committed update
	baseDuration: number, // estimated time to render the entire subtree without memoization
	startTime: number, // when React began rendering this update
	commitTime: number, // when React committed this update
	interactions: Set<any> // the Set of interactions belonging to this update
  ) {
	// Aggregate or log render timings...
  }

root.render(
	<React.Profiler id="MY_APP" onRender={onRenderCallback}>
		<ChakraProvider theme={theme}>
			<App />
		</ChakraProvider>
	</React.Profiler>
)
