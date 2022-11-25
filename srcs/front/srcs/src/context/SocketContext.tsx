import { useEffect, useState, createContext } from 'react'
import io, { Socket } from 'socket.io-client'

const SocketContext = createContext<Array<any>>([]);

export const SocketProvider = ({children}: any) => {

	const [socket, setSocket] = useState<Socket | null>(null);

	useEffect(() => {
		let socketIo = io(`${process.env.REACT_APP_URL}`, {
			auth: {token: window.localStorage.getItem('jwt_token')}
		});
		setSocket(socketIo);
		return () => {
			socketIo.disconnect();
		}
	}, []);

	return (
	<>
		{ socket ?
			<SocketContext.Provider value={[socket]}>
				{children}
			</SocketContext.Provider>
		: null
		}
	</>
	);
};

export default SocketContext;
