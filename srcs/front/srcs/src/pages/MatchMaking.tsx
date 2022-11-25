import { useNavigate } from 'react-router-dom'
import { useContext, useEffect, useCallback } from 'react'
import { Spinner, Flex, Center, Text, Button } from '@chakra-ui/react'
import SocketContext from '../context/SocketContext'

const MatchMaking = (props: any) => {
	const [socket] = useContext(SocketContext);
	const navigate = useNavigate();

	useEffect(() => {
		return () => {
			socket.emit("cancel");
		}
	}, []);

	const handleMatched = useCallback((gameId:number) => {
		navigate(`/play?gameId=${gameId}`)
	}, [navigate])


	useEffect(() => {
		socket.on("matched", handleMatched);
	});

	const handleCancel = () => {
		navigate('/');
	};

	return (
	<>
		<Center>
			<Flex flexDir='column'>
				<Spinner thickness='4px' mx='auto' my='5' speed='0.65s' emptyColor='gray.200' color='blue.500' size='xl'/>
				<Text>Searching for a game</Text>
				<Button onClick={handleCancel} my='5'>Cancel</Button>
			</Flex>
		</Center>
	</>
	);
};

export default MatchMaking;