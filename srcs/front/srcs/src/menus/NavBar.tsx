import { Popover, Circle, PopoverTrigger, PopoverArrow, PopoverHeader, PopoverBody, PopoverContent, PopoverCloseButton, IconButton, Flex, SkeletonCircle, Menu, MenuList, MenuItem, MenuButton, Link, Button, Image, Spacer } from '@chakra-ui/react'
import { useBreakpointValue, useOutsideClick, useDisclosure } from '@chakra-ui/react'
import { CloseIcon, HamburgerIcon, BellIcon } from '@chakra-ui/icons'
import { Link as ReactRouter } from 'react-router-dom'
import { AvatarMenu } from '../menus/AvatarMenu'
import { useRef, useContext, useState, useEffect, useCallback } from 'react'
import useProfil from '../hooks/useProfil'
import logo from '../assets/logo.png'
import { FriendReqBody } from '../modals/Bodies'
import SocketContext from '../context/SocketContext'

const PushNotif = () => {

	const [requests, setRequests] = useState<null | any[]>(null);
	const [count, setCount] = useState<number>(0);
	const [socket] = useContext(SocketContext);

	const fetchReq = async() => {
		const res = await fetch(`${process.env.REACT_APP_URL}/api/request`, {
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${window.localStorage.getItem('jwt_token')}`
			}
		});
		if (res.ok) {
			let data = await res.json();
			setCount(data.length);
			setRequests(data);
		}
	};

	const handleNewRequest = useCallback((data: any) => {
		setCount((e: number) => e + 1);
	}, [setCount]);

	useEffect(() => {
		fetchReq().then();
	}, []);

	useEffect(() => {
		socket.on('new_request', handleNewRequest);
	}, [handleNewRequest]);

	return (
		<Popover placement='bottom'>
			<PopoverTrigger>
				<IconButton
				onClick={() => { fetchReq().then(); }}
				colorScheme={'blackAlpha'}
				aria-label={'Notifications'}
				size={'lg'}
				icon={<>
					<BellIcon color={'white'} w={50} h={30}/>
					{count ?
						<Circle color={'white'} position={'absolute'} top={'6px'} right={'4px'} fontSize={'0.8rem'}
							bgColor={'red'} zIndex={9999} p={'1px'}>
							{count}
						</Circle>
					:null}
				</>}
				/>
			</PopoverTrigger>
			<PopoverContent>
				<PopoverArrow />
				<PopoverCloseButton />
				<PopoverHeader>Active requests</PopoverHeader>
				<PopoverBody>
					<FriendReqBody requests={requests} counter={setCount} setRequests={setRequests}/>
				</PopoverBody>
			</PopoverContent>
		</Popover>
	);
};

const SmallBar = () => {

	const { isOpen, onOpen, onClose } = useDisclosure();

	useOutsideClick({
		ref: useRef(null),
		handler: () => onClose()
	});

	return (
	<Flex>
		<Menu isOpen={isOpen}>
			<MenuButton as={IconButton} icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
				onClick={isOpen ? onClose : onOpen} display={{md:'none'}} size='md'/>
			<MenuList>
				<MenuItem as={ReactRouter} to='/' style={{ textDecoration: 'none' }}>Home</MenuItem>
				<MenuItem as={ReactRouter} to='play' style={{ textDecoration: 'none' }}>Play</MenuItem>
				<MenuItem as={ReactRouter} to='profile' style={{ textDecoration: 'none' }}>Profil</MenuItem>
				<MenuItem as={ReactRouter} to='/chat' style={{ textDecoration: 'none' }}>Chat</MenuItem>
				<MenuItem as={ReactRouter} to='settings' style={{ textDecoration: 'none' }}>Settings</MenuItem>
			</MenuList>
		</Menu>
		<Spacer />
	</Flex>
	);
}

const NormalBar = () => {
	return (
	<Flex gap='1' pl='2' pr='2' w='full' display={{ base: 'none', md:'flex'}}>
		<Link as={ReactRouter} to='/'>
			<Button variant='outline' >Home</Button>
		</Link>
		<Link as={ReactRouter} to='/play'>
			<Button variant='outline' >Play</Button>
		</Link>
		<Spacer />
		<Link as={ReactRouter} to='/'>
			<Image src={logo} alt='Pong 42 logo'/>
		</Link>
		<Spacer />
		<Link as={ReactRouter} to='/profile'>
			<Button variant='outline' >Profile</Button>
		</Link>
		<Link as={ReactRouter} to='/settings'>
			<Button variant='outline' >Settings</Button>
		</Link>
	</Flex>
	);
};

const NavBar = () => {

	const breakpoint = useBreakpointValue({ base: "base", sm: "sm", md:"md", lg: "lg", xl: "xl" })
	const smallScreen = (breakpoint === 'sm' || breakpoint === 'base');
	const { profil } = useProfil();

	return (
	<Flex h='full' alignItems={'center'} justifyContent={'space-between'}>
		{ smallScreen ? <SmallBar /> : <NormalBar /> }
		{ profil ?
		<>
			{ smallScreen ?
			<Link as={ReactRouter} to='/'>
				<Image src={logo} alt='Pong 42 logo'/>
			</Link>
			: null}
		
			<PushNotif />
			<AvatarMenu id={profil.id} avatar={profil.avatar} status={profil.status} who={'me'}/>
		</>
		:
			<SkeletonCircle size='48px' m='auto'/>
		}
	</Flex>
	);
};

export default NavBar;