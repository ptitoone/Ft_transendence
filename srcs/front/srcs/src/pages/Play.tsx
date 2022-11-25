import { Avatar, Center, Text, Button, Box, Flex, SimpleGrid, Spacer, Spinner, Alert, AlertIcon, AlertDescription } from "@chakra-ui/react"
import { useSearchParams,  useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useContext, useCallback} from 'react'
import useCanvas from '../hooks/useCanvas'
import SocketContext from '../context/SocketContext'
import useUsers from '../hooks/useUsers'

const PONG_HEIGHT: number = 480;
const PONG_WIDTH: number = 640;
const BACKGROUND_COLOR: string = '#4CAE32'
const FOREGROUND_COLOR: string = '#FFFFFF'

const PADDLE_HEIGHT: number = 100;
const PADDLE_WIDTH: number = 10;

type Vector = {
	x: number;
	y: number;
};

type PaddleProps = {
	id: number;
	left: Vector;
	right: Vector;
};



type BallProps = {
	id: number;
	ball: Vector;
};

const Create = () => {

	const [user, setUser] = useState<null | any>(null);
	const [request, setRequest] = useState<null | {id: number, state: string}>(null)
	const [colorPaddle, setColorPaddle] = useState<any>('white');
	const [colorMap, setColorMap] = useState<any>('#4CAE32');
	const [ready, setReady] = useState<boolean>(false);
	const [alert, setAlert] = useState<any | null>(null);
	const [searchParams, setSearchParams] = useSearchParams();
	const navigate = useNavigate();
	const [socket] = useContext(SocketContext);
	const {users} = useUsers();
	
	const inviteId:number = parseInt(searchParams.get('guest') || '0');
	const reqId:number = parseInt(searchParams.get('requestId') || '0');

	useEffect(()=> {
		return (()=> {
			if (reqId) {
				socket.emit('delete_invitationMap', reqId);
				if (inviteId)
				{
					fetch(`${process.env.REACT_APP_URL}/api/users/request/${searchParams.get('requestId')}`, {
						method: 'DELETE',
						headers: {
							'Content-Type': 'application/json',
							'Authorization': `Bearer ${window.localStorage.getItem('jwt_token')}`
						},
					}).then();
				} 
				else
					socket.emit('gamerequest', { id: reqId, accept: 'User has left'});
			}
		})
	},[])


	useEffect(()=>{
		if (!user)
		{
			if (inviteId && reqId)
			{	
				let findUser = users?.find((el:any) => el.id === inviteId)
				if (findUser){
					socket.emit('request', {to: inviteId});
					setUser(findUser);
					setRequest({id: reqId, state: 'Pending...'})
				}
			}
		}
	},[users, user])

	const handleGameReq = useCallback((data:any) => {
		if (data.id === request?.id) {
			setRequest((prev:any) => {return {...prev, state: data.accept} });
			if (data.accept === 'User has left' && !ready)
				setReady(false)
		}
	}, [request, setRequest])

	useEffect(()=> {
		if (request && request.state !== 'Deny' && request.state !== 'User has left')
			socket.on('response_game_request', handleGameReq)
	},[handleGameReq])



	const handleReady = useCallback((gameId: number) => {
		navigate(`/play?gameId=${gameId}`);
	}, [])

	useEffect(()=> {
		if ((inviteId || reqId))
			socket.on('ready', handleReady)
	},[handleReady])

	const colors = [
		"#895091",
		"#FC5130",
		"#30BCED",
		"#CEFF1A",
	];

	const colorsMap = [
		'#4CAE32',
		"#230C33",
		"#000000",
		"#384D48",
	];

	const handleClick = () => {
		if (!reqId && !inviteId)
		{
			socket.emit("queue", {skin: colorPaddle, map: colorMap});
			navigate('/matchmaking');
		} else {
			if (user && request)
			{
				if (request.state === 'Accept')
				{	
					socket.emit('queue_invitation', {skin: colorPaddle, map: colorMap, id: request.id} );
					setReady(true);
					if (alert)
						setAlert(null);
				}
				else {
					if (request.state === 'Pending...')
						setAlert({status:'warning', description: `${user.username} has not yet accepted`});
					else
						setAlert({status:'error', description: `${user.username} ${request.state}` })
				}
			}
			else if (reqId && !inviteId)
			{
				socket.emit('queue_invitation', {skin: colorPaddle, map: colorMap, id: reqId});
				setReady(true);
			}
		}
	};

	return (
	<>
	<SimpleGrid spacing={3} alignItems='center' columns={3} border='1px solid rgb(192,192,192, 0.2)' borderRadius={7}>
		<Text ml={2}>Choose color pad:</Text>
		<Button
			aria-label={colorPaddle}
			background={colorPaddle}
			border='0.1px solid grey'
			height='25%'
			width='6%'
			padding={0}
			minWidth="unset"
			borderRadius={3}
			cursor='not-allowed'
        ></Button>
		<Center h='100px'>
		{colors.map((c) => (
			<Button
			key={c}
			border='0.1px solid grey'
			aria-label={c}
			background={c}
			height="25%"
			width="6%"
			padding={0}
			m='auto'
			minWidth="unset"
			borderRadius={3}
			_hover={{ background: c }}
			onClick={() => {
				setColorPaddle(c);
			}}
			></Button>
        ))}
		</Center>
		<Text ml={2} >Vote color map:</Text>
		<Button
			aria-label={colorMap}
			background={colorMap}
			border='0.1px solid grey'
			height='25%'
			width='6%'
			padding={0}
			minWidth="unset"
			borderRadius={3}
			cursor='not-allowed'
        ></Button>
		<Center h='100px' >
		{colorsMap.map((c) => (
			<Button
			key={c}
			border='0.1px solid grey'
			aria-label={c}
			background={c}
			height="25%"
			width="6%"
			padding={0}
			m='auto'
			minWidth="unset"
			borderRadius={3}
			_hover={{ background: c }}
			onClick={() => {
				setColorMap(c);
			}}
			></Button>
        ))}
		</Center>
		{user ?
		<>
		<Text ml={2}>Invite:</Text>
		
		<Avatar p={0} mx={0} my={2} size='md' src={user ? `data:image/;base64,${user.avatar}` : ''}/>
		
		{ request ? <Center><Text>{request.state}</Text></Center> : null}
		</> : null
		}
	</SimpleGrid>
	<Button my='2' colorScheme='teal' variant='solid' onClick={handleClick}>Start</Button>
	{ ready ? 
		<Center>
		<Flex flexDir='column'>
			<Spinner thickness='4px' mx='auto' my='5' speed='0.65s' emptyColor='gray.200' color='blue.500' size='xl'/>
			<Text>{`Waiting for ${user ? user.username : 'your host'}`}</Text>
		</Flex>
		</Center> : null
	}
	{alert ?
		<Alert my={1} status={alert.status} variant='solid' borderRadius={7}>
			<AlertIcon />
			<AlertDescription>{alert.description}</AlertDescription>
		</Alert> : null
	}
	</>

	);
};

const drawTextCenter = (ctx: any, text: string) => {
	ctx.fillText(text, PONG_WIDTH / 2, PONG_HEIGHT / 2);
};

const drawHalfwayLine = (ctx: any) => {
	ctx.beginPath();
	ctx.setLineDash([17, 30]);
	ctx.moveTo(PONG_WIDTH / 2, 0);
	ctx.lineTo(PONG_WIDTH / 2, PONG_HEIGHT);
	ctx.stroke();
	ctx.setLineDash([]);
};

const renderBall = (ctx: any, ball: any) => {
	ctx.beginPath();
	ctx.arc(ball.x, ball.y, 10, 0, 2 * Math.PI);
	ctx.closePath();
	ctx.fill();
};

const renderPaddle = (ctx: any, paddle: any, player: any, mapColor: any) => {
	ctx.fillStyle = player.skin;
	ctx.fillRect(paddle.x - PADDLE_WIDTH / 2, paddle.y - PADDLE_HEIGHT / 2, PADDLE_WIDTH, PADDLE_HEIGHT);
	ctx.fillStyle = mapColor;
}

const renderScoreboard = (ctx: any, scoreboard: any, playerLeft: any, playerRight: any) => {
	ctx.fillText(scoreboard.left.toString(), PONG_WIDTH * (1 / 4), 100);
	ctx.fillText(playerLeft, PONG_WIDTH * (1 / 4), 50);
	ctx.fillText(scoreboard.right.toString(), PONG_WIDTH * (3 / 4), 100);
	ctx.fillText(playerRight, PONG_WIDTH * (3 / 4), 50);
};

const resizeCanvas = (ctx: any) => {
	if (ctx) {
		let scale;
		if (window.innerWidth <= 767) {
			scale = Math.min((window.innerWidth * 0.85) / PONG_WIDTH, (window.innerHeight * 0.85) / PONG_HEIGHT);
		} else {
			scale = Math.min(((window.innerWidth / 3) * 2) / PONG_WIDTH, ((window.innerHeight / 3) * 2) / PONG_HEIGHT);
		}
		ctx.canvas.width = PONG_WIDTH * scale;
		ctx.canvas.height = PONG_HEIGHT * scale;
		ctx.scale(scale, scale);
	}
};

const PlayContent = () => {

	const [rpaddle, setRpadlle] = useState<Vector>({ x: PONG_WIDTH - 75, y: Math.round(PONG_HEIGHT / 2) });
	const [lpaddle, setLpadlle] = useState<Vector>({ x: 75, y: Math.round(PONG_HEIGHT / 2) });
	const [ball, setBall] = useState<Vector>({ x: Math.round(PONG_WIDTH / 2), y: Math.round(PONG_HEIGHT / 2) });
	const [score, setScore] = useState<any>({left: 0, right: 0});
	const [status, setStatus] = useState<string>("WAITING");
	const [playerLeft, setPlayerLeft] = useState<any | null>(null);
	const [playerRight, setPlayerRight] = useState<any | null>(null);
	const navigate = useNavigate();
	const [socket] = useContext(SocketContext);
	const [searchParams] = useSearchParams();
	let test = searchParams.get('gameId');
	let spectate = searchParams.get('spectate');
	let gameId: number = 0;
	
	if (test)
		gameId = parseInt(test);

	useEffect(() => {
		if (test) {
			if (spectate) 
				setStatus('INGAME')
			socket.emit('join', {id: gameId} );

			if (!spectate) {
				return () => {
					socket.emit('leave', {id: gameId});
				}
			}
		} 
	}, []);

	const handleStatus = useCallback((data:any) => {
		if (data.id === gameId) {
					setStatus(data.status);
					if (!playerLeft && !playerRight) {
						setPlayerLeft(data.leftPlayer)
						setPlayerRight(data.rightPlayer)
					}
				}
	}, [gameId, playerRight, playerLeft])

	const handleMoveScore = useCallback((data:any) => {
		if (data.id === gameId) {
			setScore(data.scoreboard);
		}
	}, [gameId])

	const handleMoveBall = useCallback((data:any) => {
		if (data.id === gameId) {
			setBall(data.ball);
		}
	}, [gameId])

	const handleMovePaddle = useCallback((data:any) => {
		if (data.id === gameId) {
			setLpadlle(data.left);
			setRpadlle(data.right);
		}
	}, [gameId])

	useEffect(() => {
		if (test) {	
			socket.on('status', handleStatus);

			socket.on('moveScore', handleMoveScore);

			socket.on('moveBall', handleMoveBall);

			socket.on('movePaddle', handleMovePaddle);
		}
	}, [handleStatus, handleMoveScore, handleMoveBall, handleMovePaddle]);

	useEffect(() => {
		if (status === 'FINISHED' || status === 'INTERRUPTED') {
			navigate('/');
		}
	}, [status])

	const render = useCallback((ctx: CanvasRenderingContext2D) => {
		ctx.fillStyle = playerLeft?.map ? playerLeft.map : BACKGROUND_COLOR;
		ctx.fillRect(0, 0, PONG_WIDTH, PONG_HEIGHT);
		ctx.fillStyle = FOREGROUND_COLOR;
		ctx.strokeStyle = FOREGROUND_COLOR;
		
		ctx.lineWidth = 10;
		ctx.font = '18px Monospace';
		ctx.textAlign = "center";
		
		if (status === 'WAITING')
			drawTextCenter(ctx, 'Waiting for opponent...');
		else if (status === 'INGAME') {
			drawHalfwayLine(ctx);
			renderBall(ctx, ball);
			renderPaddle(ctx, lpaddle, playerLeft ? playerLeft : FOREGROUND_COLOR, FOREGROUND_COLOR);
			renderPaddle(ctx, rpaddle, playerRight ? playerRight : FOREGROUND_COLOR, FOREGROUND_COLOR);
			renderScoreboard(ctx, score, playerLeft?.username, playerRight?.username);
		}
		else if (status === 'FINISHED') {
			renderScoreboard(ctx, score, playerLeft?.username, playerRight?.username);
			drawTextCenter(ctx, 'Game finished');
		}
		else if (status === 'INTERRUPTED')
			drawTextCenter(ctx, 'Opponent left, free win');
	}, [lpaddle, rpaddle, ball, score]);

	const [canvasRef] = useCanvas(resizeCanvas, render);

	useEffect(() => {
		if (test) {
			const context = canvasRef.current?.getContext('2d');
			const resizeFunc = (e?:any) => {
				if (context) {
					resizeCanvas(context);
				}
			}
			resizeFunc();
			if (!spectate) {
				window.document.addEventListener('keydown', logKeyDown);
				window.document.addEventListener('keyup', logKeyUp);
			}
			window.addEventListener('resize', resizeFunc);
			return ( ()=>{
				window.document.removeEventListener('keydown', logKeyDown);
				window.document.removeEventListener('keyup', logKeyUp);
				window.document.removeEventListener('resize', resizeFunc)
			})
		}
	}, [canvasRef]);

	function logKeyDown(e: any) {
		switch (e.code) {
			case 'ArrowUp':
				socket.emit("paddleMove", {id: gameId, newDirection: 0})
				break;
			case 'ArrowDown':
				socket.emit("paddleMove", {id: gameId, newDirection: 1})
				break;
		  }
	};

	function logKeyUp(e: any) {
		switch (e.code) {
			case 'ArrowUp':
				socket.emit("paddleMove", {id: gameId, newDirection: 2})
				break;
			case 'ArrowDown':
				socket.emit("paddleMove", {id: gameId, newDirection: 2})
				break;
		  }
	};

	return (
	<>
		{ !test ?
			<Create></Create>
			:
			<Flex h='100%' align='center'>
				<Spacer />
					<Box>
						<canvas id="rendering-canvas" ref={canvasRef}/>
					</Box>
				<Spacer />
			</Flex>
		}
 	</>
	);
};

const Play = () => {
	const {key} = useLocation();
	
	return <PlayContent key={key}/>
}

export default Play;