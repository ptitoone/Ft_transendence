import { BrowserRouter, Routes, Route, Navigate} from 'react-router-dom'
import { useBreakpointValue } from '@chakra-ui/react'
import { AuthProvider } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import MatchMaking from './pages/MatchMaking'
import Wrapper from './templates/Wrapper'
import Settings from './pages/Settings'
import Profil from './pages/Profil'
import Home from './pages/Home'
import Play from './pages/Play'
import Chat from './pages/Chat'

export const App = () => {

	const breakpoint = useBreakpointValue({ base: "base", sm: "sm", md:"md", lg: "lg", xl: "xl" })
	const smallScreen = (breakpoint === 'sm' || breakpoint === 'base');

	return (
	<BrowserRouter>
		<AuthProvider>
			<SocketProvider>
				<Wrapper>
					<Routes>
						<Route path='/' element={<Home/>} />
						<Route path='/profile' element={<Profil/>} />
						<Route path='/play' element={<Play/>} />
						<Route path='/matchmaking' element={<MatchMaking/>} />
						<Route path='/settings' element={<Settings/>} />
						<Route path="*" element={<Navigate to='/'/>} />
						{ smallScreen ? <Route path="/chat" element={<Chat/>} /> : <></> }
					</Routes>
				</Wrapper>
			</SocketProvider>
		</AuthProvider>
	</BrowserRouter>
	);
}
